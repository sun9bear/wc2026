// 单场补充信息（football-data.org /v4/matches/{id}）：主裁判 + 赛果时长（常规/加时/点球）。
// 实测 FREE_PLUS_LIVESCORES 档：referees 有值、score.duration 有值；venue 为 null（不取）。
// 一次调用同时供「比赛页裁判信息」与「加时/点球徽章」。无 key/无 external_id/失败 → 空。
// 合规：纯赛事元数据（裁判姓名/赛果类型），无任何盘口/赔率。缓存 6h（裁判/时长定后不变）。

import { unstable_cache } from "next/cache";

export type MatchDuration = "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";

export interface MatchExtra {
  referee: { name: string; nationality: string | null } | null;
  duration: MatchDuration | null;
}

interface ApiReferee {
  name?: string;
  type?: string;
  nationality?: string | null;
}

const EMPTY: MatchExtra = { referee: null, duration: null };

async function fetchMatchExtra(externalId: number | null): Promise<MatchExtra> {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key || externalId == null) return EMPTY;
  try {
    const r = await fetch(`https://api.football-data.org/v4/matches/${externalId}`, {
      headers: { "X-Auth-Token": key },
    });
    if (!r.ok) return EMPTY;
    const j = (await r.json()) as {
      referees?: ApiReferee[];
      score?: { duration?: string | null };
    };
    const refs = j.referees ?? [];
    const main = refs.find((rf) => rf?.type === "REFEREE") ?? refs[0];
    const referee = main?.name ? { name: main.name, nationality: main.nationality ?? null } : null;
    const dur = j.score?.duration;
    const duration =
      dur === "EXTRA_TIME" || dur === "PENALTY_SHOOTOUT" || dur === "REGULAR" ? dur : null;
    return { referee, duration };
  } catch {
    return EMPTY;
  }
}

/** 单场裁判 + 赛果时长；按 external_id 缓存 6h。无 key/失败 → {referee:null,duration:null}。 */
export const getMatchExtra = unstable_cache(fetchMatchExtra, ["wc-match-extra-v1"], {
  revalidate: 21600,
});
