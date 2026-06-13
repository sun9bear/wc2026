import { describe, it, expect } from "vitest";
import { liveScoreline } from "./poisson";

// 代表性赛前期望进球（总进球 2.6，主队略强）。
const LH = 1.5;
const LA = 1.1;

function mass(r: { p: { home: number; draw: number; away: number } }): number {
  return r.p.home + r.p.draw + r.p.away;
}

describe("liveScoreline (in-play 最终比分分布)", () => {
  it("胜平负概率归一（开赛即时与中场皆和为 1）", () => {
    expect(mass(liveScoreline(LH, LA, 0, 0, 0))).toBeCloseTo(1, 6);
    expect(mass(liveScoreline(LH, LA, 1, 0, 45))).toBeCloseTo(1, 6);
    expect(mass(liveScoreline(LH, LA, 0, 2, 70))).toBeCloseTo(1, 6);
  });

  it("领先一方的胜率高于同分钟数 0-0 时", () => {
    const lead = liveScoreline(LH, LA, 1, 0, 45);
    const level = liveScoreline(LH, LA, 0, 0, 45);
    expect(lead.p.home).toBeGreaterThan(level.p.home);
    expect(lead.p.away).toBeLessThan(level.p.away);
  });

  it("同样领先，剩余时间越少胜率越高（时间衰减单调）", () => {
    const early = liveScoreline(LH, LA, 1, 0, 30);
    const late = liveScoreline(LH, LA, 1, 0, 80);
    expect(late.p.home).toBeGreaterThan(early.p.home);
  });

  it("终场/补时尾声：最终比分锁定为当前比分，概率为 1", () => {
    const end = liveScoreline(LH, LA, 2, 1, 90);
    expect(end.top).toHaveLength(1);
    expect(end.top[0]).toMatchObject({ h: 2, a: 1, p: 1 });
    expect(end.p.home).toBe(1);
    expect(end.p.draw).toBe(0);
  });

  it("最终比分不可能低于当前比分；Top 概率降序且在 [0,1]", () => {
    const r = liveScoreline(LH, LA, 1, 1, 60);
    for (const c of r.top) {
      expect(c.h).toBeGreaterThanOrEqual(1);
      expect(c.a).toBeGreaterThanOrEqual(1);
      expect(c.p).toBeGreaterThanOrEqual(0);
      expect(c.p).toBeLessThanOrEqual(1);
    }
    for (let i = 1; i < r.top.length; i++) {
      expect(r.top[i - 1].p).toBeGreaterThanOrEqual(r.top[i].p);
    }
  });

  it("开赛即时(0-0,0')分布与赛前一致：1-0/0-1/1-1 等低比分占主要质量", () => {
    const r = liveScoreline(LH, LA, 0, 0, 0);
    // 最可能比分应落在低比分区间（每队 ≤3 球）。
    expect(r.top[0].h).toBeLessThanOrEqual(3);
    expect(r.top[0].a).toBeLessThanOrEqual(3);
    // 主队略强 → 主胜概率应高于客胜。
    expect(r.p.home).toBeGreaterThan(r.p.away);
  });
});
