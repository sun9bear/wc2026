// 下注报价/校验（纯函数，可单测）。

/** 校验投入积分；通过返回 null，否则返回中文错误信息。 */
export function validateStake(stake: number, balance: number): string | null {
  if (!Number.isInteger(stake) || stake <= 0) return "投入积分必须为正整数";
  if (stake > balance) return "积分不足";
  return null;
}

/** 命中可派分 = 投入 × 倍率（四舍五入）。 */
export function quotePayout(stake: number, multiplier: number): number {
  return Math.round(stake * multiplier);
}
