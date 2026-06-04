import { it, expect, describe } from "vitest";
import { computeStats } from "./playerStats";

describe("computeStats", () => {
  it("统计各状态数量", () => {
    const s = computeStats([
      { status: "won" },
      { status: "won" },
      { status: "lost" },
      { status: "pending" },
    ]);
    expect(s.total).toBe(4);
    expect(s.won).toBe(2);
    expect(s.lost).toBe(1);
    expect(s.pending).toBe(1);
  });
  it("命中率按已结算计算（2胜1负 → 67%）", () => {
    expect(
      computeStats([{ status: "won" }, { status: "won" }, { status: "lost" }]).hitRate
    ).toBe(67);
  });
  it("无已结算时命中率为 0", () => {
    expect(computeStats([{ status: "pending" }]).hitRate).toBe(0);
    expect(computeStats([]).hitRate).toBe(0);
  });
});
