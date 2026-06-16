import { unstable_cache } from "next/cache";
import { getRanking, type RankedPlayer } from "./getRanking";

// 单球员详情数据：排名行（含 index/分项/票数/短评）+ 名次。
export interface PlayerDetail extends RankedPlayer {
  rank: number;
}

export async function getPlayer(slug: string): Promise<PlayerDetail | null> {
  const ranking = await getRanking();
  const i = ranking.findIndex((r) => r.slug === slug);
  if (i < 0) return null;
  return { ...ranking[i], rank: i + 1 };
}

// Wikidata 事实（CC0，无署名/无传染）：出生日期(→年龄) + 身高。请求时抓 + 缓存 1 天。
export interface PlayerFacts {
  birthDate: string | null; // YYYY-MM-DD
  heightCm: number | null;
}

const UA = "wc2026.cool/1.0 (player facts; Wikidata CC0)";

async function fetchFacts(wikiTitle: string): Promise<PlayerFacts> {
  try {
    const qr = await fetch(
      `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&titles=${encodeURIComponent(
        wikiTitle
      )}`,
      { headers: { "User-Agent": UA } }
    );
    if (!qr.ok) return { birthDate: null, heightCm: null };
    const qj = (await qr.json()) as {
      query?: { pages?: Record<string, { pageprops?: { wikibase_item?: string } }> };
    };
    const pages = qj.query?.pages ?? {};
    const qid = Object.values(pages)[0]?.pageprops?.wikibase_item;
    if (!qid) return { birthDate: null, heightCm: null };

    const er = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, {
      headers: { "User-Agent": UA },
    });
    if (!er.ok) return { birthDate: null, heightCm: null };
    const ej = (await er.json()) as {
      entities?: Record<
        string,
        {
          claims?: Record<
            string,
            { mainsnak?: { datavalue?: { value?: { time?: string; amount?: string } } } }[]
          >;
        }
      >;
    };
    const claims = ej.entities?.[qid]?.claims ?? {};
    const bd = claims.P569?.[0]?.mainsnak?.datavalue?.value?.time; // "+1997-01-12T00:00:00Z"
    const birthDate = bd ? bd.slice(1, 11) : null;
    const hAmt = claims.P2048?.[0]?.mainsnak?.datavalue?.value?.amount; // "+181" 或 "+1.81"
    let heightCm: number | null = null;
    if (hAmt) {
      const n = parseFloat(hAmt);
      if (Number.isFinite(n) && n > 0) heightCm = n > 3 ? Math.round(n) : Math.round(n * 100);
    }
    return { birthDate, heightCm };
  } catch {
    return { birthDate: null, heightCm: null };
  }
}

export function getPlayerFacts(wikiTitle: string): Promise<PlayerFacts> {
  return unstable_cache(() => fetchFacts(wikiTitle), ["player-facts-v1", wikiTitle], {
    revalidate: 86400,
  })();
}

// Wikipedia 简介（CC BY-SA，需署名 + 链接源页，与 CC0 事实不同）：取「当前语言」维基的导语段。
// 经 Wikidata sitelinks 拿到该语言页面标题（zh 标题是「孙兴慜」而非英文名，必须从 sitelinks 取）；
// 再走 REST summary 取已裁剪的纯文本导语。请求时抓 + 缓存 1 天；任何失败回 null（绝不破页）。
export interface PlayerIntro {
  text: string;
  lang: string;
  sourceUrl: string;
}

const LOCALE_WIKI: Record<string, string> = {
  en: "enwiki",
  zh: "zhwiki",
  es: "eswiki",
  pt: "ptwiki",
  de: "dewiki",
  fr: "frwiki",
};
const INTRO_CAP = 320;

// 截到句界 + 去零宽字符/引用角标，避免 CJK 处截半句。
function cleanExtract(s: string): string {
  let t = s.replace(/​/g, "").replace(/\[\d+\]/g, "").trim();
  if (t.length > INTRO_CAP) {
    const cut = t.slice(0, INTRO_CAP);
    const stop = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf(". "), cut.lastIndexOf(" "));
    t = (stop > INTRO_CAP * 0.6 ? cut.slice(0, stop + 1) : cut).trim() + "…";
  }
  return t;
}

async function fetchIntro(wikiTitle: string, locale: string): Promise<PlayerIntro | null> {
  try {
    const wikiKey = LOCALE_WIKI[locale] ?? "enwiki";
    const qr = await fetch(
      `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&titles=${encodeURIComponent(
        wikiTitle
      )}`,
      { headers: { "User-Agent": UA } }
    );
    if (!qr.ok) return null;
    const qj = (await qr.json()) as {
      query?: { pages?: Record<string, { pageprops?: { wikibase_item?: string } }> };
    };
    const qid = Object.values(qj.query?.pages ?? {})[0]?.pageprops?.wikibase_item;
    if (!qid) return null;

    const er = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, {
      headers: { "User-Agent": UA },
    });
    if (!er.ok) return null;
    const ej = (await er.json()) as {
      entities?: Record<string, { sitelinks?: Record<string, { title?: string }> }>;
    };
    const title = ej.entities?.[qid]?.sitelinks?.[wikiKey]?.title;
    if (!title) return null; // 该语言无词条 → 不回退他语（避免显示错语种），直接 null

    const lang = wikiKey.replace(/wiki$/, "");
    const sr = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { "User-Agent": UA } }
    );
    if (!sr.ok) return null;
    const sj = (await sr.json()) as { extract?: string; type?: string };
    if (!sj.extract || sj.type === "disambiguation") return null;

    return {
      text: cleanExtract(sj.extract),
      lang,
      sourceUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  } catch {
    return null;
  }
}

export function getPlayerIntro(wikiTitle: string, locale: string): Promise<PlayerIntro | null> {
  return unstable_cache(() => fetchIntro(wikiTitle, locale), ["player-intro-v1", wikiTitle, locale], {
    revalidate: 86400,
  })();
}
