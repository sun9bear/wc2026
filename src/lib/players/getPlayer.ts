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
