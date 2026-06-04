import { it, expect, describe } from "vitest";
import { payoutOnWin, settleBets, refundAmount } from "./settle";

describe("payoutOnWin", () => {
  it("投入 × 倍率，四舍五入", () => {
    expect(payoutOnWin(200, 3.4)).toBe(680);
    expect(payoutOnWin(100, 2.15)).toBe(215);
    expect(payoutOnWin(33, 3.33)).toBe(110); // 109.89 → 110
  });
  it("负参数抛错", () => {
    expect(() => payoutOnWin(-1, 2)).toThrow();
  });
});

describe("settleBets", () => {
  it("命中派分、未命中派 0", () => {
    const res = settleBets([
      { id: "a", stakePoints: 200, multiplierAtBet: 3.4, won: true },
      { id: "b", stakePoints: 200, multiplierAtBet: 2.0, won: false },
    ]);
    expect(res).toEqual([
      { betId: "a", status: "won", payout: 680 },
      { betId: "b", status: "lost", payout: 0 },
    ]);
  });
});

describe("refundAmount", () => {
  it("全额退回投入", () => {
    expect(refundAmount(200)).toBe(200);
  });
});
