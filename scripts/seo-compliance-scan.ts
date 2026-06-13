// SEO/GEO 发布前合规扫描：抓取关键页面的渲染输出，用真实雷词表扫可见文本。
// 经 CodeX 外审（B5）：不抄正则到脚本，复用 src/lib/compliance/bannedTerms 的真实词表。
// 用法：先起服务（next dev / preview / 线上），再：
//   npx tsx scripts/seo-compliance-scan.ts https://<preview-or-prod>
// 默认扫生产。任一页命中雷词即 exit 1（部署阻断闸）。
import { findBannedTerms } from "../src/lib/compliance/bannedTerms";

const BASE = (process.argv[2] || process.env.SCAN_BASE || "https://www.wc2026.cool").replace(/\/$/, "");

// 静态 + 着陆页；team/match 抽样可按需补（取一个真实 slug/id）。
const STATIC_PATHS = [
  "/",
  "/forecast",
  "/calculator",
  "/calculator/group/a",
  "/watch",
  "/about",
  "/combo",
  "/leaderboard",
  "/llms.txt",
];

// 从 sitemap 抽样一个真实 team / match 页（动态路由需具体 slug/id）——CodeX 外审 M4。
async function sampleDynamic(base: string): Promise<string[]> {
  // CodeX 外审 M4：fail-closed —— sitemap 抓取失败 / 无 team|match URL 即抛错，由 main 记为失败，
  // 绝不静默跳过 team/match 扫描（否则合规闸假绿）。
  const res = await fetch(base + "/sitemap.xml");
  if (!res.ok) throw new Error(`sitemap.xml HTTP ${res.status}`);
  const xml = await res.text();
  const team = xml.match(/<loc>([^<]*\/team\/[^<]+)<\/loc>/)?.[1];
  const match = xml.match(/<loc>([^<]*\/match\/[^<]+)<\/loc>/)?.[1];
  const urls = [team, match]
    .filter((u): u is string => Boolean(u))
    .map((u) => u.replace(base, ""));
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
  const res = await fetch(BASE + path, {
    headers: { "accept-language": lang === "zh" ? "zh-CN,zh;q=0.9" : "en-US,en;q=0.9" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw = await res.text();
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
  const paths = [...STATIC_PATHS, ...dynamicPaths];
  for (const p of paths) {
    for (const lang of ["en", "zh"] as const) {
      try {
        const hits = await scan(p, lang);
        if (hits.length) {
          failed = true;
          console.error(`  [BANNED] ${p} (${lang}): ${hits.join(", ")}`);
        } else {
          console.log(`  [ok]     ${p} (${lang})`);
        }
      } catch (e) {
        // CodeX 外审 M4：抓取失败=失败（fail-closed），不再静默 skip 后 exit 0。
        failed = true;
        console.error(`  [FAIL]   ${p} (${lang}): ${(e as Error).message}`);
      }
    }
  }
  if (failed) {
    console.error("\n❌ Compliance scan FAILED — banned term(s) in public output. Block deploy.");
    process.exit(1);
  }
  console.log("\n✅ Compliance scan passed.");
}

main();
