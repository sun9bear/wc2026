// SEO/GEO 发布前合规扫描：抓取关键页面的渲染输出，用真实雷词表扫可见文本。
// 经 CodeX 外审（B5）：不抄正则到脚本，复用 src/lib/compliance/bannedTerms 的真实词表。
// per-locale URL：en 树扫【根路径】，其余 locale 树扫【/<locale> 前缀路径】——locale 由 URL 决定
// （不再靠 accept-language 头切；否则给根 EN 路径发 zh 头仍返回 EN，会把非默认树零扫描放行 = 合规假绿）。
// P2-2：扩到 es/pt/de/fr。新语种 Phase A 尚无完整 bannedTerms 表（属 Phase B），此处用
//   英文雷词表（catches bet/odds/casino…）+ 各新语种「博彩红线 guard 词」做部署阻断闸。
// 用法：先起服务（next dev / start / preview / 线上），再：
//   npx tsx scripts/seo-compliance-scan.ts https://<preview-or-prod>
// 默认扫生产。任一页命中雷词即 exit 1（部署阻断闸）。新语种树是新暴露给爬虫的面，务必真实扫到。
import { findBannedTerms } from "../src/lib/compliance/bannedTerms";

const BASE = (process.argv[2] || process.env.SCAN_BASE || "https://www.wc2026.cool").replace(/\/$/, "");

type ScanLocale = "en" | "zh" | "es" | "pt" | "de" | "fr";
// en 留根（前缀空），其余加 /<locale>。
const PREFIX: Record<ScanLocale, string> = { en: "", zh: "/zh", es: "/es", pt: "/pt", de: "/de", fr: "/fr" };
const PREFIXED: ScanLocale[] = ["zh", "es", "pt", "de", "fr"];

// 新语种博彩红线 guard（Phase B 会建完整 bannedTerms 表；此处先守 AdSense 最关键词族）。
// 仅小写、词边界匹配；变位/复数列主要形式。de 故意不含合规的 Tipp/Tippspiel。
const NEW_BANNED: Record<"es" | "pt" | "de" | "fr", string[]> = {
  es: ["apuesta", "apuestas", "apostar", "cuota", "cuotas", "casa de apuestas", "azar"],
  pt: ["aposta", "apostas", "apostar", "casa de apostas", "cassino", "palpite"],
  de: ["wette", "wetten", "wettquote", "buchmacher", "gluecksspiel", "glücksspiel"],
  fr: ["pari", "paris", "parier", "cote", "cotes", "bookmaker", "jeu d'argent"],
};
// 跨语博彩词（任何语种页面都不得出现）。
const UNIVERSAL = ["casino", "odds"];

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 给定文本 + locale，返回命中的雷词。en/zh 走真实词表；新语种 = 英文词表 + 本语种 guard + 通用词。
function bannedHits(text: string, lang: ScanLocale): string[] {
  if (lang === "en" || lang === "zh") return findBannedTerms(text, lang);
  const hits = new Set<string>(findBannedTerms(text, "en")); // 英文博彩词跨语种同样阻断
  const lower = text.toLowerCase();
  for (const w of [...NEW_BANNED[lang], ...UNIVERSAL]) {
    // Unicode 词边界（变音符算字母）：前后非字母即视为独立词。
    if (new RegExp(`(^|[^\\p{L}])${escapeRe(w)}([^\\p{L}]|$)`, "iu").test(lower)) hits.add(w);
  }
  return [...hits];
}

// locale-无关裸路径（en 扫根、其余扫 /<locale> 前缀）。已补齐 b–l 组 + privacy + disclaimer。
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

// 根级共享文件（无 locale 前缀版）：所有词表都扫（可能含多语条目）。
const SHARED_PATHS = ["/llms.txt"];

const localePath = (loc: ScanLocale, p: string) =>
  loc === "en" ? p : p === "/" ? PREFIX[loc] : PREFIX[loc] + p;

// 从 sitemap 抽样一个真实 team / match 裸路径（动态路由需具体 slug/id）——CodeX 外审 M4。
async function sampleDynamic(base: string): Promise<string[]> {
  const res = await fetch(base + "/sitemap.xml");
  if (!res.ok) throw new Error(`sitemap.xml HTTP ${res.status}`);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(base, ""));
  // 取 en（不带任何前缀）的 team/match 各一个作裸路径样本，各 locale 树再加前缀扫。
  const isBare = (u: string) => !/^\/(zh|es|pt|de|fr)\//.test(u);
  const team = locs.find((u) => /^\/team\//.test(u) && isBare(u));
  const match = locs.find((u) => /^\/match\//.test(u) && isBare(u));
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

async function scan(path: string, lang: ScanLocale): Promise<string[]> {
  // redirect:"manual" —— 绝不跟随跳转。否则 /<locale>/* 若回归成 30x→根 EN，fetch 会跟到 EN 200，
  // 把英文当本语种扫 → 合规假绿（RED LINE 2）。任何前缀路径上的跳转一律判失败（fail-closed）。
  const al =
    lang === "zh" ? "zh-CN,zh;q=0.9" : lang === "en" ? "en-US,en;q=0.9" : `${lang},${lang};q=0.9`;
  const res = await fetch(BASE + path, {
    headers: { "accept-language": al },
    redirect: "manual",
  });
  if (res.status >= 300 && res.status < 400) {
    throw new Error(`unexpected redirect ${res.status} → ${res.headers.get("location") ?? "?"}`);
  }
  if (res.type === "opaqueredirect") throw new Error("unexpected redirect (opaque)");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw = await res.text();
  // 前缀树页必须真渲染本语种：断言 <html lang="<loc>">，否则即便 200 也可能是 /<loc>→EN 内容塌缩。
  if (lang !== "en" && !path.endsWith(".txt") && !new RegExp(`<html[^>]*\\blang=["']${lang}`, "i").test(raw)) {
    throw new Error(`expected lang="${lang}" html (possible /${lang}→EN collapse)`);
  }
  const text = path.endsWith(".txt") ? raw : stripHtml(raw);
  return bannedHits(text, lang);
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

  // 待扫清单：en 树(根路径) + zh/es/pt/de/fr 树(各自前缀) + 共享根文件(全词表都扫)。
  const jobs: { path: string; lang: ScanLocale }[] = [
    ...barePaths.map((p) => ({ path: p, lang: "en" as ScanLocale })),
    ...PREFIXED.flatMap((loc) => barePaths.map((p) => ({ path: localePath(loc, p), lang: loc }))),
    ...SHARED_PATHS.flatMap((p) =>
      (["en", "zh"] as ScanLocale[]).map((lang) => ({ path: p, lang })),
    ),
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
