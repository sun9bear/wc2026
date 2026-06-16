import { describe, it, expect } from "vitest";
import { norm0100, composeRanking, WEIGHTS, type PlayerSignals } from "./rankingMath";

const base = (over: Partial<PlayerSignals>): PlayerSignals => ({
  id: "x",
  slug: "x",
  name: "X",
  teamName: "Brazil",
  countryIso: "br",
  position: "FW",
  votes: 0,
  buzz: 0,
  goals: 0,
  blurbZh: null,
  blurbEn: null,
  ...over,
});

describe("rankingMath", () => {
  it("权重合计为 1", () => {
    expect(WEIGHTS.vote + WEIGHTS.perf + WEIGHTS.buzz).toBeCloseTo(1);
  });

  it("norm0100 边界", () => {
    expect(norm0100(5, 5)).toBe(100);
    expect(norm0100(0, 5)).toBe(0);
    expect(norm0100(3, 6)).toBe(50);
    expect(norm0100(2, 0)).toBe(0);
  });

  it("投票主导(55%)：纯票/纯表现/纯热度的 index = 55/30/15", () => {
    const rows = composeRanking([
      base({ id: "a", name: "A", votes: 10 }),
      base({ id: "b", name: "B", goals: 10 }),
      base({ id: "c", name: "C", buzz: 10 }),
    ]);
    expect(rows.map((r) => r.id)).toEqual(["a", "b", "c"]);
    expect(rows[0].index).toBe(55);
    expect(rows[1].index).toBe(30);
    expect(rows[2].index).toBe(15);
  });

  it("全 0 不崩，按名字稳定排序", () => {
    const rows = composeRanking([base({ id: "z", name: "Zeta" }), base({ id: "a", name: "Alpha" })]);
    expect(rows.every((r) => r.index === 0)).toBe(true);
    expect(rows[0].name).toBe("Alpha");
  });
});
