// SEO/GEO 发布前合规扫描：抓取关键页面的渲染输出，用真实雷词表扫可见文本。
// 经 CodeX 外审（B5）：不抄正则到脚本，复用 src/lib/compliance/bannedTerms 的真实词表。
// per-locale URL 改造后：en 树扫【根路径】，zh 树扫【/zh 前缀路径】——locale 由 URL 决定
// （不再靠 accept-language 头切；否则给根 EN 路径发 zh 头仍返回 EN，会把中文树零扫描放行 = 合规假绿）。
// 用法：先起服务（next dev / preview / 线上），再：
//   npx tsx scripts/seo-compliance-scan.ts https://<preview-or-prod>
// 默认扫生产。任一页命中雷词即 exit 1（部署阻断闸）。zh 树是新暴露给爬虫的面，务必真实扫到。
import { findBannedTerms } from "../src/lib/compliance/bannedTerms";

const BASE = (process.argv[2] || process.env.SCAN_BASE || "https://www.wc2026.cool").replace(/\/$/, "");

// locale-无关裸路径（en 扫根、zh 扫 /zh 前缀）。已补齐 b–l 组 + privacy + disclaimer。
const STATIC_PATHS = [
  "/",
  "/forecast",
  "/forecast/best-thirds",
  "/calculator",
  ..."abcdefghijkl".split("").map((l) => `/calculator/group/${l}`),
  "/rules",
  "/watch",
  "/about",
  "/privacy",
  "/disclaimer",
  "/combo",
  "/leaderboard",
];

// 根级共享文件（无 /zh 版）：两套雷词表都扫（可能含中英双语条目）。
const SHARED_PATHS = ["/llms.txt"];

const zhPath = (p: string) => (p === "/" ? "/zh" : "/zh" + p);

// 从 sitemap 抽样一个真实 team / match 裸路径（动态路由需具体 slug/id）——CodeX 外审 M4。
async function sampleDynamic(base: string): Promise<string[]> {
  // fail-closed：sitemap 抓取失败 / 无 team|match URL 即抛错，由 main 记为失败，绝不静默跳过。
  const res = await fetch(base + "/sitemap.xml");
  if (!res.ok) throw new Error(`sitemap.xml HTTP ${res.status}`);
  const xml = await res.text();
  // sitemap 现每页双 locale；取 en（不带 /zh）的 team/match 各一个作裸路径样本，zh 树再加前缀扫。
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(base, ""));
  const team = locs.find((u) => /^\/team\//.test(u));
  const match = locs.find((u) => /^\/match\//.test(u));
  const urls = [team, match].filter((u): u is string => Boolean(u));
  if (urls.length < 2) throw new Error("sitemap.xml missing a team or match URL to sample");
  return urls;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ");
}

async function scan(path: string, lang: "en" | "zh"): Promise<string[]> {
  // redirect:"manual" —— 绝不跟随跳转。否则 /zh/* 若回归成 30x→根 EN，fetch 会跟到 EN 200，
  // 把英文当中文扫 → 合规假绿（RED LINE 2）。任何 /zh 路径上的跳转一律判失败（fail-closed）。
  const res = await fetch(BASE + path, {
    headers: { "accept-language": lang === "zh" ? "zh-CN,zh;q=0.9" : "en-US,en;q=0.9" },
    redirect: "manual",
  });
  if (res.status >= 300 && res.status < 400) {
    throw new Error(`unexpected redirect ${res.status} → ${res.headers.get("location") ?? "?"}`);
  }
  if (res.type === "opaqueredirect") throw new Error("unexpected redirect (opaque)");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw = await res.text();
  // zh 页必须真渲染中文：断言 <html lang="zh">，否则即便 200 也可能是 /zh→EN 内容塌缩（仍判失败）。
  if (lang === "zh" && !path.endsWith(".txt") && !/<html[^>]*\blang=["']zh/i.test(raw)) {
    throw new Error('expected lang="zh" html (possible /zh→EN collapse)');
  }
  const text = path.endsWith(".txt") ? raw : stripHtml(raw);
  return findBannedTerms(text, lang);
}

async function main() {
  console.log(`SEO compliance scan @ ${BASE}\n`);
  let failed = false;
  let dynamicPaths: string[] = [];
  try {
    dynamicPaths = await sampleDynamic(BASE);
  } catch (e) {
    failed = true;
    console.error(`  [FAIL]   sitemap sampling: ${(e as Error).message}`);
  }
  const barePaths = [...STATIC_PATHS, ...dynamicPaths];

  // 待扫清单：en 树(根路径, en) + zh 树(/zh 前缀, zh) + 共享根文件(两套词表都扫)。
  const jobs: { path: string; lang: "en" | "zh" }[] = [
    ...barePaths.map((p) => ({ path: p, lang: "en" as const })),
    ...barePaths.map((p) => ({ path: zhPath(p), lang: "zh" as const })),
    ...SHARED_PATHS.flatMap((p) => [
      { path: p, lang: "en" as const },
      { path: p, lang: "zh" as const },
    ]),
  ];

  for (const { path, lang } of jobs) {
    try {
      const hits = await scan(path, lang);
      if (hits.length) {
        failed = true;
        console.error(`  [BANNED] ${path} (${lang}): ${hits.join(", ")}`);
      } else {
        console.log(`  [ok]     ${path} (${lang})`);
      }
    } catch (e) {
      // 抓取失败 = 失败（fail-closed），不再静默 skip 后 exit 0。
      failed = true;
      console.error(`  [FAIL]   ${path} (${lang}): ${(e as Error).message}`);
    }
  }

  if (failed) {
    console.error("\n❌ Compliance scan FAILED — banned term(s) in public output. Block deploy.");
    process.exit(1);
  }
  console.log("\n✅ Compliance scan passed.");
}

main();
