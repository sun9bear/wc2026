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
  index: number; // 0-100 加权综合（质量分，保留备用）
  popValue: number; // 人气值（榜单主数）：热度×2 + 表现×1 + 真实票数×1，无上限
}

// 人气值（展示主数 + 排序依据）：归一化热度×2 + 归一化表现×1 + 真实票数×1。
// 与 index(0-100) 不同：票数原始且无上限 → 每投 1 票 +1，「越投越涨」给用户成就感；
// 早期由热度+表现打底（避免全 0 票时榜单扁平），长期由票数主导（符合"球迷最爱"）。
export function popularityValue(buzzScore: number, perfScore: number, votes: number): number {
  return Math.round(buzzScore * 2 + perfScore + votes);
}

/** 归一化 + 合成 + 排序（人气值降序，平手比票数，再比名字）。 */
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
    const popValue = popularityValue(buzzScore, perfScore, r.votes);
    return { ...r, voteScore, perfScore, buzzScore, index, popValue };
  });

  rows.sort((a, b) => b.popValue - a.popValue || b.votes - a.votes || a.name.localeCompare(b.name));
  return rows;
}
