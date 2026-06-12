import { describe, it, expect } from "vitest";
import { simulateTournament, matrixToCdf, type SimMatch } from "./simulate";
import { scoreMatrix, lambdasFromElo } from "./poisson";

// 合成 48 队（A1..L4）：A1 给极高 Elo，其余按组内递减；全部 72 场小组赛未赛。
function makeInput(runs: number) {
  const letters = "ABCDEFGHIJKL".split("");
  const groups: Record<string, string[]> = {};
  const rating = new Map<string, number>();
  for (const g of letters) {
    groups[g] = [1, 2, 3, 4].map((i) => `${g}${i}`);
    groups[g].forEach((id, i) => rating.set(id, 1750 - i * 90));
  }
  rating.set("A1", 2400); // 巨无霸
  const remaining: SimMatch[] = [];
  for (const g of letters) {
    const t = groups[g];
    const pairs: [number, number][] = [
      [0, 1],
      [2, 3],
      [0, 2],
      [1, 3],
      [0, 3],
      [1, 2],
    ];
    for (const [x, y] of pairs) {
      const l = lambdasFromElo(rating.get(t[x])!, rating.get(t[y])!);
      remaining.push({
        homeId: t[x],
        awayId: t[y],
        cdf: matrixToCdf(scoreMatrix(l.home, l.away)),
      });
    }
  }
  return { groups, played: [], remaining, rating, runs, seed: 7 };
}

describe("simulateTournament", () => {
  const out = simulateTournament(makeInput(400));

  it("covers all 48 teams with probabilities in [0,1]", () => {
    expect(out.size).toBe(48);
    for (const t of out.values()) {
      for (const p of [t.pAdvance, t.pR16, t.pQF, t.pSF, t.pFinal, t.pChampion]) {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }
      // 阶段单调：越深概率越小
      expect(t.pAdvance).toBeGreaterThanOrEqual(t.pR16);
      expect(t.pR16).toBeGreaterThanOrEqual(t.pQF);
      expect(t.pQF).toBeGreaterThanOrEqual(t.pSF);
      expect(t.pSF).toBeGreaterThanOrEqual(t.pFinal);
      expect(t.pFinal).toBeGreaterThanOrEqual(t.pChampion);
    }
  });
  it("champion probabilities sum to 1", () => {
    const s = [...out.values()].reduce((a, t) => a + t.pChampion, 0);
    expect(s).toBeCloseTo(1, 6);
  });
  it("exactly 32 advance per run", () => {
    const s = [...out.values()].reduce((a, t) => a + t.pAdvance, 0);
    expect(s).toBeCloseTo(32, 6);
  });
  it("the 2400-Elo team dominates its group and the field", () => {
    const a1 = out.get("A1")!;
    expect(a1.pAdvance).toBeGreaterThan(0.95);
    expect(a1.pChampion).toBeGreaterThan(5 / 48);
  });
});
