// 积分只通过 points_ledger 流水累加得出（设计方案 §8.3）。积分无现实价值、不可购买。
export type LedgerReason =
  | "signup"
  | "daily"
  | "ad_reward"
  | "invite_reward"
  | "bet_stake"
  | "bet_payout"
  | "reset"
  | "refund"
  | "cosmetic";

export interface LedgerEntry {
  reason: LedgerReason;
  delta: number;
}

/** 由流水计算当前积分余额。 */
export function computeBalance(entries: LedgerEntry[]): number {
  return entries.reduce((sum, e) => sum + e.delta, 0);
}
