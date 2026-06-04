// 结算逻辑 —— 设计方案 §8.2 / §8.3。
// 下注时已扣除投入（ledger: bet_stake -stake）；命中时派分 = 投入 × 锁定倍率（ledger: bet_payout +payout）。

/** 命中时的派分（四舍五入到整数积分）。 */
export function payoutOnWin(stakePoints: number, multiplierAtBet: number): number {
  if (stakePoints < 0 || multiplierAtBet < 0) throw new Error("参数不能为负");
  return Math.round(stakePoints * multiplierAtBet);
}

export interface SettleableBet {
  id: string;
  stakePoints: number;
  multiplierAtBet: number;
  won: boolean;
}

export interface PayoutResult {
  betId: string;
  status: "won" | "lost";
  payout: number; // 命中=投入×倍率；未命中=0（投入已在下注时扣除）
}

/** 结算一组单场预测。 */
export function settleBets(bets: SettleableBet[]): PayoutResult[] {
  return bets.map((b) => ({
    betId: b.id,
    status: b.won ? "won" : "lost",
    payout: b.won ? payoutOnWin(b.stakePoints, b.multiplierAtBet) : 0,
  }));
}

/** 改期/弃赛退款：全额退回投入（ledger: refund +stake），与设计 §8.2 一致。 */
export function refundAmount(stakePoints: number): number {
  if (stakePoints < 0) throw new Error("投入不能为负");
  return stakePoints;
}
