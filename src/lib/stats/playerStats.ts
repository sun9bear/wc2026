// 由预测记录算个人战绩（纯函数）。
export interface BetStatusRow {
  status: string; // pending / won / lost / refunded
}

export interface PlayerStats {
  total: number;
  won: number;
  lost: number;
  pending: number;
  hitRate: number; // 命中率百分比（仅按已结算计算），0-100 整数
}

export function computeStats(bets: BetStatusRow[]): PlayerStats {
  const total = bets.length;
  const won = bets.filter((b) => b.status === "won").length;
  const lost = bets.filter((b) => b.status === "lost").length;
  const pending = bets.filter((b) => b.status === "pending").length;
  const settled = won + lost;
  const hitRate = settled > 0 ? Math.round((won / settled) * 100) : 0;
  return { total, won, lost, pending, hitRate };
}
