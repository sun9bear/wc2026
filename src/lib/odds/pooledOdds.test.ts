import { it, expect, describe } from "vitest";
import { pooledMultiplier, computeMultipliers, combinedMultiplier } from "./pooledOdds";

describe("pooledMultiplier", () => {
  it("无人下注时各选项倍率 = 选项数", () => {
    expect(pooledMultiplier(0, 0, 3)).toBe(3);
    expect(pooledMultiplier(0, 0, 2)).toBe(2);
  });

  it("均分时各选项倍率 = 选项数", () => {
    // 三选项各 100，总 300
    expect(pooledMultiplier(100, 300, 3)).toBe(3);
  });

  it("热门选项倍率低、冷门选项倍率高", () => {
    // 全押选项A：A=300, B=0, C=0, 总=300, k=100
    expect(pooledMultiplier(300, 300, 3)).toBeCloseTo(1.5, 2); // (300+300)/(300+100)=1.5
    expect(pooledMultiplier(0, 300, 3)).toBeCloseTo(6, 2); //   (300+300)/(0+100)=6
  });

  it("命中下限 floor", () => {
    expect(pooledMultiplier(1_000_000, 1_000_000, 2, { k: 100 })).toBe(1.1);
  });

  it("命中上限 cap", () => {
    expect(pooledMultiplier(0, 1_000_000, 2, { k: 1 })).toBe(50);
  });

  it("选项数 <= 0 抛错", () => {
    expect(() => pooledMultiplier(0, 0, 0)).toThrow();
  });

  it("负投入抛错", () => {
    expect(() => pooledMultiplier(-1, 0, 2)).toThrow();
  });
});

describe("computeMultipliers", () => {
  it("均分三选项 → 全 3.0", () => {
    expect(computeMultipliers([100, 100, 100])).toEqual([3, 3, 3]);
  });
  it("偏斜池 → 热门低冷门高", () => {
    expect(computeMultipliers([300, 0, 0])).toEqual([1.5, 6, 6]);
  });
});

describe("combinedMultiplier", () => {
  it("连乘各腿", () => {
    expect(combinedMultiplier([3, 3])).toBe(9);
    expect(combinedMultiplier([2, 2.5, 2])).toBe(10);
  });
  it("空数组 → 1", () => {
    expect(combinedMultiplier([])).toBe(1);
  });
});
