import { describe, it, expect } from "vitest";
import { buildRows, rankGroup, rankThirds, mulberry32 } from "./standings";
import type { GroupResult, TableRow } from "./types";

const rng = mulberry32(42);

describe("buildRows", () => {
  it("accounts points and goals", () => {
    const rows = buildRows(
      ["A", "B"],
      [{ homeId: "A", awayId: "B", homeGoals: 2, awayGoals: 1 }]
    );
    expect(rows.get("A")).toMatchObject({ pts: 3, gf: 2, ga: 1, gd: 1, played: 1 });
    expect(rows.get("B")).toMatchObject({ pts: 0, gf: 1, ga: 2, gd: -1 });
  });
});

describe("rankGroup (2026 rules: h2h before overall GD)", () => {
  it("orders by points first", () => {
    const results: GroupResult[] = [
      { homeId: "A", awayId: "B", homeGoals: 3, awayGoals: 0 },
      { homeId: "C", awayId: "D", homeGoals: 1, awayGoals: 1 },
    ];
    const order = rankGroup(["A", "B", "C", "D"], results, rng).map((r) => r.teamId);
    expect(order[0]).toBe("A");
  });
  it("head-to-head beats overall goal difference (2026 novelty)", () => {
    // A、B 同 3 分；B 整体净胜 +3 远好于 A 的 0，但相互战绩 A 胜 B → A 在前
    const results: GroupResult[] = [
      { homeId: "A", awayId: "B", homeGoals: 1, awayGoals: 0 },
      { homeId: "B", awayId: "C", homeGoals: 4, awayGoals: 0 },
      { homeId: "D", awayId: "A", homeGoals: 1, awayGoals: 0 },
    ];
    const order = rankGroup(["A", "B", "C", "D"], results, rng).map((r) => r.teamId);
    expect(order.indexOf("A")).toBeLessThan(order.indexOf("B"));
  });
  it("falls back to overall GD when h2h is fully level", () => {
    // A、C 同分且无相互比赛记录 → mini 表无区分 → 整体净胜球定胜负
    const results: GroupResult[] = [
      { homeId: "A", awayId: "B", homeGoals: 3, awayGoals: 0 },
      { homeId: "C", awayId: "D", homeGoals: 1, awayGoals: 0 },
    ];
    const order = rankGroup(["A", "B", "C", "D"], results, rng).map((r) => r.teamId);
    expect(order[0]).toBe("A");
    expect(order[1]).toBe("C");
  });
  it("uses rating as the last tiebreaker before rng", () => {
    const results: GroupResult[] = []; // 全员 0 分 0 球，前序判据全平
    const rating = new Map([
      ["A", 1700],
      ["B", 1900],
      ["C", 1800],
      ["D", 1600],
    ]);
    const order = rankGroup(["A", "B", "C", "D"], results, rng, rating).map((r) => r.teamId);
    expect(order).toEqual(["B", "C", "A", "D"]);
  });
});

describe("rankThirds", () => {
  it("sorts by pts/gd/gf", () => {
    const thirds: TableRow[] = [
      { teamId: "x", played: 3, pts: 4, gf: 3, ga: 3, gd: 0 },
      { teamId: "y", played: 3, pts: 6, gf: 4, ga: 2, gd: 2 },
      { teamId: "z", played: 3, pts: 4, gf: 5, ga: 4, gd: 1 },
    ];
    expect(rankThirds(thirds, rng)).toEqual(["y", "z", "x"]);
  });
});

describe("mulberry32", () => {
  it("is deterministic per seed", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
