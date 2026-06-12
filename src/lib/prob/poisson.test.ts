import { describe, it, expect } from "vitest";
import {
  poissonPmf,
  lambdasFromElo,
  scoreMatrix,
  matrixTo1x2,
  topScores,
  calibrateToTarget,
} from "./poisson";

describe("poissonPmf", () => {
  it("sums to ~1 over support", () => {
    let s = 0;
    for (let k = 0; k <= 30; k++) s += poissonPmf(k, 2);
    expect(s).toBeCloseTo(1, 8);
  });
});

describe("lambdasFromElo", () => {
  it("equal ratings give equal lambdas", () => {
    const { home, away } = lambdasFromElo(1800, 1800);
    expect(home).toBeCloseTo(away, 10);
  });
  it("stronger home team gets more goals; clamped at extremes", () => {
    const l = lambdasFromElo(2100, 1700);
    expect(l.home).toBeGreaterThan(l.away);
    const extreme = lambdasFromElo(2400, 1200);
    expect(extreme.home / (extreme.home + extreme.away)).toBeLessThanOrEqual(0.85);
  });
  it("host advantage shifts the split", () => {
    const neutral = lambdasFromElo(1800, 1800);
    const hosted = lambdasFromElo(1800, 1800, 100);
    expect(hosted.home).toBeGreaterThan(neutral.home);
  });
});

describe("scoreMatrix", () => {
  it("normalizes to 1", () => {
    const m = scoreMatrix(1.5, 1.1);
    const s = m.flat().reduce((a, b) => a + b, 0);
    expect(s).toBeCloseTo(1, 10);
  });
  it("Dixon-Coles boosts low draws vs independent Poisson", () => {
    const lh = 1.3;
    const la = 1.2;
    const dc = scoreMatrix(lh, la);
    const indep = scoreMatrix(lh, la, 0);
    expect(dc[0][0]).toBeGreaterThan(indep[0][0]);
    expect(dc[1][1]).toBeGreaterThan(indep[1][1]);
  });
  it("symmetric lambdas give symmetric 1x2", () => {
    const p = matrixTo1x2(scoreMatrix(1.3, 1.3));
    expect(p.home).toBeCloseTo(p.away, 10);
    expect(p.home + p.draw + p.away).toBeCloseTo(1, 10);
  });
});

describe("topScores", () => {
  it("returns n entries sorted by probability desc", () => {
    const t = topScores(scoreMatrix(1.5, 1.0), 5);
    expect(t).toHaveLength(5);
    for (let i = 1; i < t.length; i++) expect(t[i - 1].p).toBeGreaterThanOrEqual(t[i].p);
  });
});

describe("calibrateToTarget", () => {
  it("matches target home/away within tolerance", () => {
    const seed = lambdasFromElo(1900, 1850);
    const target = { home: 0.62, draw: 0.22, away: 0.16 }; // 市场强烈偏主队
    const cal = calibrateToTarget(seed.home, seed.away, target);
    const p = matrixTo1x2(cal.matrix);
    expect(Math.abs(p.home - target.home)).toBeLessThan(0.03);
    expect(Math.abs(p.away - target.away)).toBeLessThan(0.03);
  });
});
