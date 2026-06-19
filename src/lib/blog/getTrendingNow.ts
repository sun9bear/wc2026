// Trending Now 需求信号（best-effort，二级信号）：抓 Google Trends 新版 RSS
// （旧 dailytrends/realtimetrends + pytrends/google-trends-api 端点已 404，见 BLOG-EVENT-COMMENTARY-DESIGN §13 R2），
// 解析热搜词 + 相关新闻，匹配出"正在被搜的世界杯参赛国"。任何失败都返回空，绝不抛给调用方。
//
// 定位：国家级 top~10/日，具体某场常缺席 → 当"二级"需求信号 + 新闻上下文；
//       "一级"需求骨干是赛程 query 模板（见 P2 fixture-template 层）。
// 部署：生产用 plain fetch（Vercel 直连 Google 即可）；本机（中国大陆封 Google）测试经
//       scripts/probe-trending.ts 落地 XML 再解析，避开 Node fetch 不认 OS 代理的坑。
// 缓存：本模块不内置缓存——调用方（P3/P5 的 cron）自控频率/可外包 unstable_cache。

import { nationMatchList } from "@/lib/football/teams";

const RSS = "https://trends.google.com/trending/rss";

export interface TrendingItem {
  term: string;
  traffic: number | null; // approx_traffic 解析为整数（"200000+" → 200000）
  pubDate: string | null;
  news: { title: string; source: string | null; url: string | null }[];
}

export interface TrendingNation {
  iso2: string;
  name: string; // 代表性英文名
  terms: string[]; // 命中的热搜词
  maxTraffic: number | null; // 命中词里的最大 approx_traffic
  matchedInNews: boolean; // true=仅在相关新闻标题里命中（信号更弱）
  sampleNews: { title: string; source: string | null }[];
}

export interface TrendingSnapshot {
  ok: boolean;
  geos: string[];
  itemCount: number;
  nations: TrendingNation[];
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function tagText(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? decodeEntities(m[1].trim()) : null;
}

/** 解析 trending RSS XML → 结构化条目（结构异常的块跳过）。 */
export function parseTrendingRss(xml: string): TrendingItem[] {
  const items: TrendingItem[] = [];
  for (const block of xml.match(/<item>[\s\S]*?<\/item>/g) ?? []) {
    const term = tagText(block, "title");
    if (!term) continue;
    const trafficRaw = tagText(block, "ht:approx_traffic");
    const traffic = trafficRaw ? Number(trafficRaw.replace(/\D/g, "")) || null : null;
    const news: TrendingItem["news"] = [];
    for (const nb of block.match(/<ht:news_item>[\s\S]*?<\/ht:news_item>/g) ?? []) {
      const title = tagText(nb, "ht:news_item_title");
      if (title) news.push({ title, source: tagText(nb, "ht:news_item_source"), url: tagText(nb, "ht:news_item_url") });
    }
    items.push({ term, traffic, pubDate: tagText(block, "pubDate"), news });
  }
  return items;
}

const strip = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** needle 是否作为"词边界完整片段"出现在 haystack（两侧非字母数字）。 */
function boundedIncludes(haystack: string, needle: string): boolean {
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + 1)) {
    const before = i === 0 ? "" : haystack[i - 1];
    const after = i + needle.length >= haystack.length ? "" : haystack[i + needle.length];
    if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) return true;
  }
  return false;
}

// 仅新闻标题命中时要求的足球/世界杯语境词（去音标小写后匹配），过滤 "Bank of Japan"、澳洲板球这类噪音。
const FOOTBALL_HINT =
  /world cup|fifa|football|soccer|qualif|knockout|round of|group [a-l]\b|\bvs\b|national team/;

/** 把热搜条目匹配到世界杯参赛国（热搜词命中=强信号；仅新闻标题命中=弱信号，且该标题须含足球语境词）。 */
export function matchTrendingNations(items: TrendingItem[]): TrendingNation[] {
  const nations = nationMatchList();
  const byIso = new Map<string, TrendingNation>();
  for (const item of items) {
    const termHay = strip(item.term);
    const newsTitles = item.news.map((n) => strip(n.title));
    for (const nat of nations) {
      const inTerm = nat.aliases.some((a) => boundedIncludes(termHay, a));
      const inNews =
        !inTerm &&
        newsTitles.some((t) => FOOTBALL_HINT.test(t) && nat.aliases.some((a) => boundedIncludes(t, a)));
      if (!inTerm && !inNews) continue;
      let row = byIso.get(nat.iso2);
      if (!row) {
        row = { iso2: nat.iso2, name: nat.name, terms: [], maxTraffic: null, matchedInNews: true, sampleNews: [] };
        byIso.set(nat.iso2, row);
      }
      if (!row.terms.includes(item.term)) row.terms.push(item.term);
      if (inTerm) {
        row.matchedInNews = false; // 出现过强信号
        if (item.traffic != null && (row.maxTraffic == null || item.traffic > row.maxTraffic)) row.maxTraffic = item.traffic;
      }
      const lead = item.news[0];
      if (lead && row.sampleNews.length < 3) row.sampleNews.push({ title: lead.title, source: lead.source });
    }
  }
  return [...byIso.values()].sort((a, b) => (b.maxTraffic ?? 0) - (a.maxTraffic ?? 0));
}

/** 抓单个 geo 的 trending RSS（10s 超时，失败返回 []）。 */
async function fetchTrendingTerms(geo: string): Promise<TrendingItem[]> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 10_000);
    const r = await fetch(`${RSS}?geo=${encodeURIComponent(geo)}`, {
      signal: c.signal,
      headers: { "user-agent": "Mozilla/5.0 (compatible; wc2026bot/1.0; +https://www.wc2026.cool)" },
    });
    clearTimeout(t);
    if (!r.ok) return [];
    return parseTrendingRss(await r.text());
  } catch {
    return [];
  }
}

/** 抓多个 geo、跨 geo 按热搜词去重、匹配参赛国。生产入口（调用方自控频率/缓存）。 */
export async function computeWorldCupTrending(geos: string[] = ["US", "GB"]): Promise<TrendingSnapshot> {
  const perGeo = await Promise.all(geos.map(fetchTrendingTerms));
  const seen = new Set<string>();
  const items: TrendingItem[] = [];
  for (const arr of perGeo) {
    for (const it of arr) {
      const k = it.term.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      items.push(it);
    }
  }
  return { ok: items.length > 0, geos, itemCount: items.length, nations: matchTrendingNations(items) };
}
