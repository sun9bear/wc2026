// 人气指数合成（设计 §5）：投票 55% + 表现 30% + 热度 15%。
// 各分量先 min-max 归一到 0-100，再加权求和。纯函数，便于测试与对抗审核。

export const WEIGHTS = { vote: 0.55, perf: 0.3, buzz: 0.15 } as const;

/** min-max 归一到 0-100；max<=0 或 value<=0 → 0。 */
export function norm0100(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0;
  return Math.round((value / max) * 100);
}

export interface PlayerSignals {
  id: string;
  slug: string;
  name: string;
  teamName: string;
  countryIso: string | null;
  position: string | null;
  votes: number; // 票数（原始）
  buzz: number; // 维基 pageviews 原始
  goals: number; // 当前进球数（射手榜匹配，无则 0）
  blurbZh: string | null;
  blurbEn: string | null;
}

export interface RankedPlayer extends PlayerSignals {
  voteScore: number; // 0-100
  perfScore: number; // 0-100
  buzzScore: number; // 0-100
  index: number; // 0-100 加权综合
}

/** 归一化 + 加权 + 排序（index 降序，平手比票数，再比名字）。 */
export function composeRanking(raw: PlayerSignals[]): RankedPlayer[] {
  const maxVotes = raw.reduce((m, r) => Math.max(m, r.votes), 0);
  const maxBuzz = raw.reduce((m, r) => Math.max(m, r.buzz), 0);
  const maxGoals = raw.reduce((m, r) => Math.max(m, r.goals), 0);

  const rows: RankedPlayer[] = raw.map((r) => {
    const voteScore = norm0100(r.votes, maxVotes);
    const perfScore = norm0100(r.goals, maxGoals);
    const buzzScore = norm0100(r.buzz, maxBuzz);
    const index = Math.round(
      WEIGHTS.vote * voteScore + WEIGHTS.perf * perfScore + WEIGHTS.buzz * buzzScore
    );
    return { ...r, voteScore, perfScore, buzzScore, index };
  });

  rows.sort((a, b) => b.index - a.index || b.votes - a.votes || a.name.localeCompare(b.name));
  return rows;
}
