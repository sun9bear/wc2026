/**
 * Trending RSS 探针：解析 + 匹配世界杯参赛国（验证 getTrendingNow 的解析/匹配逻辑）。
 *
 * 本机（中国大陆封 Google，Node fetch 不认 OS 代理）：先用 curl 落地 XML（curl 认 HTTPS_PROXY），再跑解析匹配——
 *   curl -sS "https://trends.google.com/trending/rss?geo=US" -o /tmp/wc_us.xml
 *   curl -sS "https://trends.google.com/trending/rss?geo=GB" -o /tmp/wc_gb.xml
 *   npx tsx scripts/probe-trending.ts /tmp/wc_us.xml /tmp/wc_gb.xml
 * 不传文件参数则直接 fetch（仅限能直连 Google 的环境，如 Vercel/海外）。
 */
import { readFileSync } from "node:fs";
import { parseTrendingRss, matchTrendingNations, type TrendingItem } from "../src/lib/blog/getTrendingNow";

async function main(): Promise<void> {
  const files = process.argv.slice(2);
  let items: TrendingItem[] = [];
  if (files.length) {
    for (const f of files) items = items.concat(parseTrendingRss(readFileSync(f, "utf8")));
  } else {
    const r = await fetch("https://trends.google.com/trending/rss?geo=US");
    items = parseTrendingRss(await r.text());
  }
  // 跨文件按词去重
  const seen = new Set<string>();
  items = items.filter((i) => (seen.has(i.term.toLowerCase()) ? false : (seen.add(i.term.toLowerCase()), true)));

  console.log(`解析热搜条目: ${items.length}`);
  console.log("前 12 词:", items.slice(0, 12).map((i) => `${i.term}(${i.traffic ?? "?"})`).join(" | "));

  const nations = matchTrendingNations(items);
  console.log(`\n匹配到世界杯参赛国: ${nations.length}`);
  for (const n of nations) {
    const tag = n.matchedInNews ? " (仅新闻命中)" : "";
    console.log(`  ${n.name} [${n.iso2}] traffic=${n.maxTraffic ?? "?"}${tag}  词=${n.terms.join(", ")}`);
    if (n.sampleNews[0]) console.log(`      ↳ 新闻: ${n.sampleNews[0].title} — ${n.sampleNews[0].source ?? ""}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
