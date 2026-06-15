// 世界杯射手榜（金靴）数据源：football-data.org /competitions/WC/scorers。
// 实测 FREE_PLUS_LIVESCORES 档可用（返回 player/team/goals/penalties/playedMatches；assists 为 null）。
// 合规：纯进球数据，绝不涉及任何盘口/赔率措辞。无 key/失败/非 200 一律降级返回空数组。
// 缓存 30 分钟共享 → 整届最多 ~1 次/30min，配额可忽略。

import { unstable_cache } from "next/cache";

export interface Scorer {
  rank: number; // 竞赛名次（同进球数并列同名次）
  playerName: string;
  nationality: string | null; // 球员国籍（国家队即等于球队）
  teamName: string; // football-data 球队英文名（与 NATIONS 键一致，供 teamName/flagUrl 本地化）
  crest: string | null; // 官方队徽 URL（payload 自带，作国旗兜底）
  goals: number;
  penalties: number | null; // 其中点球数（部分球员为 null）
  playedMatches: number | null;
}

interface ApiScorer {
  player?: { name?: string; nationality?: string | null };
  team?: { name?: string; crest?: string | null };
  goals?: number | null;
  penalties?: number | null;
  playedMatches?: number | null;
}

async function fetchScorers(): Promise<Scorer[]> {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) return [];
  try {
    const r = await fetch("https://api.football-data.org/v4/competitions/WC/scorers?limit=20", {
      headers: { "X-Auth-Token": key },
    });
    if (!r.ok) return [];
    const j = (await r.json()) as { scorers?: ApiScorer[] };
    const raw = (j.scorers ?? []).filter((s) => typeof s.goals === "number" && (s.goals ?? 0) > 0);
    const out: Scorer[] = [];
    let lastGoals: number | null = null;
    let lastRank = 0;
    raw.forEach((s, i) => {
      const goals = s.goals ?? 0;
      const rank = goals === lastGoals ? lastRank : i + 1; // 并列同名次（1,2,2,4…）
      lastGoals = goals;
      lastRank = rank;
      out.push({
        rank,
        playerName: s.player?.name ?? "?",
        nationality: s.player?.nationality ?? null,
        teamName: s.team?.name ?? "",
        crest: s.team?.crest ?? null,
        goals,
        penalties: s.penalties ?? null,
        playedMatches: s.playedMatches ?? null,
      });
    });
    return out;
  } catch {
    return [];
  }
}

/** 射手榜（按进球降序，最多 20 名）；缓存 30min。无 key/失败 → 空数组。 */
export const getScorers = unstable_cache(fetchScorers, ["wc-scorers-v1"], { revalidate: 1800 });
