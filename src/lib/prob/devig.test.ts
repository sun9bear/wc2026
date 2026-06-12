import { describe, it, expect } from "vitest";
import { devigBook, consensus, fuse } from "./devig";

describe("devigBook", () => {
  it("equal prices give equal probs summing to 1", () => {
    const p = devigBook(3, 3, 3)!;
    expect(p.home).toBeCloseTo(1 / 3, 10);
    expect(p.home + p.draw + p.away).toBeCloseTo(1, 10);
  });
  it("removes overround proportionally", () => {
    // 1.85/3.55/4.9（实测 Unibet 报价）：隐含和 >1，去水后和=1 且排序保持
    const p = devigBook(1.85, 3.55, 4.9)!;
    expect(p.home + p.draw + p.away).toBeCloseTo(1, 10);
    expect(p.home).toBeGreaterThan(p.draw);
    expect(p.draw).toBeGreaterThan(p.away);
  });
  it("rejects invalid prices", () => {
    expect(devigBook(1, 3, 4)).toBeNull();
    expect(devigBook(0, 3, 4)).toBeNull();
  });
});

describe("consensus", () => {
  it("returns null for empty input", () => {
    expect(consensus([]).p).toBeNull();
  });
  it("median across books resists one outlier", () => {
    const books = [
      { home: 2, draw: 3.4, away: 3.8 },
      { home: 2.05, draw: 3.5, away: 3.7 },
      { home: 9, draw: 1.2, away: 9 }, // 异常机构
    ];
    const { p, books: n } = consensus(books);
    expect(n).toBe(3);
    expect(p!.home).toBeGreaterThan(p!.away); // 不被离群值带偏
    expect(p!.home + p!.draw + p!.away).toBeCloseTo(1, 10);
  });
});

describe("fuse", () => {
  const model = { home: 0.5, draw: 0.3, away: 0.2 };
  it("returns model when no market", () => {
    expect(fuse(null, model, 0)).toEqual(model);
  });
  it("weights market 0.75 with many books", () => {
    const market = { home: 0.7, draw: 0.2, away: 0.1 };
    const f = fuse(market, model, 24);
    expect(f.home).toBeCloseTo(0.75 * 0.7 + 0.25 * 0.5, 10);
    expect(f.home + f.draw + f.away).toBeCloseTo(1, 10);
  });
  it("lowers market weight with thin coverage", () => {
    const market = { home: 0.7, draw: 0.2, away: 0.1 };
    const thin = fuse(market, model, 1);
    const thick = fuse(market, model, 10);
    expect(thin.home).toBeLessThan(thick.home);
  });
});
