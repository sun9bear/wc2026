// 实时世界杯比分源（API-Football）：全局 /fixtures?live=all 过滤 league=1（World Cup）。
// 缓存 70s → 整届最多 ~1 次/70s 配额消耗，且不随观众数增长（多客户端共享缓存）。
// 任何失败/无 key 都降级返回空数组，前端据此回退赛前分布。
// 合规：纯比分/分钟数据，非博彩源；对外措辞「最可能的比分」，不触盘口/赔率。

import { unstable_cache } from "next/cache";
import { normalizeTeamName } from "./names";

const WC_LEAGUE_ID = 1; // API-Football 联赛 id：World Cup

export interface LiveFixture {
  homeName: string;
  awayName: string;
  homeNorm: string;
  awayNorm: string;
  hNow: number;
  aNow: number;
  minute: number;
  short: string; // 1H / HT / 2H / ET / P / FT ...
}

interface ApiFixture {
  fixture?: { status?: { elapsed?: number | null; short?: string } };
  league?: { id?: number };
  teams?: { home?: { name?: string }; away?: { name?: string } };
  goals?: { home?: number | null; away?: number | null };
}

async function fetchLiveWc(): Promise<LiveFixture[]> {
  const key = process.env.APISPORTS_KEY;
  if (!key) return [];
  try {
    const r = await fetch("https://v3.football.api-sports.io/fixtures?live=all", {
      headers: { "x-apisports-key": key },
    });
    if (!r.ok) return [];
    const j = (await r.json()) as { response?: ApiFixture[] };
    const out: LiveFixture[] = [];
    for (const f of j.response ?? []) {
      if (f?.league?.id !== WC_LEAGUE_ID) continue;
      const homeName = f.teams?.home?.name;
      const awayName = f.teams?.away?.name;
      if (!homeName || !awayName) continue;
      out.push({
        homeName,
        awayName,
        homeNorm: normalizeTeamName(homeName),
        awayNorm: normalizeTeamName(awayName),
        hNow: f.goals?.home ?? 0,
        aNow: f.goals?.away ?? 0,
        minute: f.fixture?.status?.elapsed ?? 0,
        short: f.fixture?.status?.short ?? "",
      });
    }
    return out;
  } catch {
    return [];
  }
}

/** 当前所有进行中的世界杯比赛；缓存 70s（配额友好）。无 key/失败→空数组。 */
export const getLiveWcFixtures = unstable_cache(fetchLiveWc, ["live-wc-v1"], { revalidate: 70 });

/** 把一场 DB 比赛（队名）匹配到当前直播；含主客对调兜底。无匹配返回 null。 */
export function matchLive(
  fixtures: LiveFixture[],
  homeName: string,
  awayName: string
): { fx: LiveFixture; swapped: boolean } | null {
  const h = normalizeTeamName(homeName);
  const a = normalizeTeamName(awayName);
  for (const fx of fixtures) {
    if (fx.homeNorm === h && fx.awayNorm === a) return { fx, swapped: false };
    if (fx.homeNorm === a && fx.awayNorm === h) return { fx, swapped: true };
  }
  return null;
}
