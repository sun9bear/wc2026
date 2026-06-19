// 进行中比赛的「技术统计」源（API-Football /fixtures/statistics?fixture=）。
// football-data.org 不提供技术统计，故控球/射门/角球只能走 API-Football（apisports）。
// 懒加载：仅在用户点「展开技术统计」时由 /api/match-stats 调用 → 配额友好（不随轮询消耗）。
// 90s 共享缓存(unstable_cache by fixtureId)。无 key/失败/无数据 → null（前端隐藏面板）。
// 合规：纯赛事统计（控球率/射门/角球/犯规/越位），无任何盘口/赔率。

import { unstable_cache } from "next/cache";

export interface TeamStat {
  possession: string | null; // 形如 "55%"
  shots: number | null;
  shotsOn: number | null;
  corners: number | null;
  fouls: number | null;
  offsides: number | null;
}

interface ApiStatRow {
  type?: string;
  value?: number | string | null;
}
interface ApiStatEntry {
  team?: { id?: number; name?: string };
  statistics?: ApiStatRow[];
}

function toNum(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const n = Number(String(v).replace("%", "").trim());
  return Number.isFinite(n) ? n : null;
}

function mapEntry(entry: ApiStatEntry): TeamStat {
  const pick = (type: string) => entry.statistics?.find((s) => s.type === type)?.value ?? null;
  const poss = pick("Ball Possession");
  return {
    possession: poss == null ? null : String(poss),
    shots: toNum(pick("Total Shots")),
    shotsOn: toNum(pick("Shots on Goal")),
    corners: toNum(pick("Corner Kicks")),
    fouls: toNum(pick("Fouls")),
    offsides: toNum(pick("Offsides")),
  };
}

/** 返回 apisports fixture 顺序的两队统计 [home, away]；调用方按 swapped 自行对调。null = 不可用。 */
async function fetchMatchStats(fixtureId: number): Promise<[TeamStat, TeamStat] | null> {
  const key = process.env.APISPORTS_KEY;
  if (!key || !fixtureId) return null;
  try {
    const r = await fetch(
      `https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixtureId}`,
      { headers: { "x-apisports-key": key } }
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { response?: ApiStatEntry[] };
    const arr = j.response ?? [];
    if (arr.length < 2) return null; // 比赛刚开场可能尚无统计
    // API-Football statistics 按 fixture 主客顺序返回：response[0]=主、[1]=客。
    return [mapEntry(arr[0]), mapEntry(arr[1])];
  } catch {
    return null;
  }
}

/** 单场技术统计（apisports 主客顺序）；按 fixtureId 缓存 90s。无 key/失败 → null。 */
export const getMatchStats = unstable_cache(fetchMatchStats, ["match-stats-v1"], {
  revalidate: 90,
});
