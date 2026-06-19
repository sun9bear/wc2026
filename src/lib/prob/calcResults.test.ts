import { describe, it, expect } from "vitest";
import { buildCalcResults, outcomeOf, clampGoal, FLAT, type Pick } from "./calcResults";
import { rankThirds, mulberry32 } from "./standings";
import type { GroupResult, TableRow } from "./types";

describe("outcomeOf", () => {
  it("maps score to result", () => {
    expect(outcomeOf([2, 0])).toBe("h");
    expect(outcomeOf([1, 1])).toBe("d");
    expect(outcomeOf([0, 1])).toBe("a");
  });
});

describe("clampGoal", () => {
  it("clamps to 0..9 and rounds", () => {
    expect(clampGoal(-3)).toBe(0);
    expect(clampGoal(0)).toBe(0);
    expect(clampGoal(9)).toBe(9);
    expect(clampGoal(12)).toBe(9);
    expect(clampGoal(2.6)).toBe(3);
  });
});

describe("buildCalcResults", () => {
  const played: GroupResult[] = [{ homeId: "P1", awayId: "P2", homeGoals: 3, awayGoals: 1 }];
  const remaining = [
    { id: "m1", homeId: "A", awayId: "B" },
    { id: "m2", homeId: "C", awayId: "D" },
  ];
  const fallback: Record<string, Pick> = { m1: FLAT.h, m2: FLAT.d };

  it("keeps played results untouched and appends remaining", () => {
    const out = buildCalcResults(played, remaining, {}, fallback);
    expect(out[0]).toEqual({ homeId: "P1", awayId: "P2", homeGoals: 3, awayGoals: 1 });
    expect(out).toHaveLength(3);
  });

  it("uses user picks over fallback", () => {
    const out = buildCalcResults(played, remaining, { m1: [4, 0] }, fallback);
    expect(out.find((r) => r.homeId === "A")).toEqual({
      homeId: "A",
      awayId: "B",
      homeGoals: 4,
      awayGoals: 0,
    });
    // m2 无 pick → 回退 fallback (FLAT.d = 1-1)
    expect(out.find((r) => r.homeId === "C")).toEqual({
      homeId: "C",
      awayId: "D",
      homeGoals: 1,
      awayGoals: 1,
    });
  });

  it("does not mutate the played array", () => {
    const snapshot = JSON.parse(JSON.stringify(played));
    buildCalcResults(played, remaining, { m1: [9, 0] }, fallback);
    expect(played).toEqual(snapshot);
  });
});

describe("net-goal path is live (third-place cut flips on margin)", () => {
  // 两支第三名同积分(3)、净胜球初始相同 → 把其中一队净胜球做大 → rankThirds 顺序由 gd 定先后。
  // 证明"改单场比分能影响第三名出线线"这条通路打通。
  const rng = mulberry32(1);
  const base = (gf: number, ga: number): TableRow => ({
    teamId: "",
    played: 3,
    pts: 3,
    gf,
    ga,
    gd: gf - ga,
  });

  it("ranks the bigger margin first", () => {
    const boosted: TableRow[] = [
      { ...base(2, 1), teamId: "X" }, // gd 1
      { ...base(4, 1), teamId: "Y" }, // gd 3 → 居首
    ];
    expect(rankThirds(boosted, rng)[0]).toBe("Y");
  });
});
