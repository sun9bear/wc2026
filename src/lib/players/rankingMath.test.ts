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

  it("index(0-100) 仍按 55/30/15 加权（保留备用质量分）", () => {
    const rows = composeRanking([
      base({ id: "a", name: "A", votes: 10 }),
      base({ id: "b", name: "B", goals: 10 }),
      base({ id: "c", name: "C", buzz: 10 }),
    ]);
    expect(rows.find((r) => r.id === "a")!.index).toBe(55);
    expect(rows.find((r) => r.id === "b")!.index).toBe(30);
    expect(rows.find((r) => r.id === "c")!.index).toBe(15);
  });

  it("人气值 = 热度×2 + 表现×1 + 票数；榜单按人气值排序", () => {
    const rows = composeRanking([
      base({ id: "a", name: "A", votes: 10 }), // popValue = 0 + 0 + 10 = 10
      base({ id: "b", name: "B", goals: 10 }), // perfScore 100 → 100
      base({ id: "c", name: "C", buzz: 10 }), // buzzScore 100 ×2 → 200
    ]);
    expect(rows.map((r) => r.id)).toEqual(["c", "b", "a"]);
    expect(rows.map((r) => r.popValue)).toEqual([200, 100, 10]);
  });

  it("票数 1:1 无上限计入人气值（每票 +1，成就感）", () => {
    const rows = composeRanking([
      base({ id: "a", name: "A", votes: 5, buzz: 10 }),
      base({ id: "b", name: "B", votes: 0, buzz: 10 }),
    ]);
    const a = rows.find((r) => r.id === "a")!;
    const b = rows.find((r) => r.id === "b")!;
    expect(a.popValue - b.popValue).toBe(5);
  });

  it("全 0 不崩，按名字稳定排序", () => {
    const rows = composeRanking([base({ id: "z", name: "Zeta" }), base({ id: "a", name: "Alpha" })]);
    expect(rows.every((r) => r.index === 0)).toBe(true);
    expect(rows[0].name).toBe("Alpha");
  });
});
