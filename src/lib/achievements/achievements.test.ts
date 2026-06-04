import { it, expect, describe } from "vitest";
import { computeAchievements, type AchievementInput } from "./achievements";

const base: AchievementInput = {
  total: 0,
  won: 0,
  hitRate: 0,
  biggestPayout: 0,
  checkinStreak: 0,
  balance: 1000,
};

function earned(input: Partial<AchievementInput>): string[] {
  return computeAchievements({ ...base, ...input })
    .filter((a) => a.earned)
    .map((a) => a.id);
}

describe("computeAchievements", () => {
  it("空档案：无成就", () => {
    expect(earned({})).toEqual([]);
  });
  it("首次预测解锁初出茅庐", () => {
    expect(earned({ total: 1 })).toContain("first_bet");
  });
  it("命中解锁旗开得胜", () => {
    expect(earned({ won: 1 })).toContain("first_win");
  });
  it("神准需命中率≥60% 且≥10场", () => {
    expect(earned({ hitRate: 70, total: 5 })).not.toContain("sharp");
    expect(earned({ hitRate: 70, total: 10 })).toContain("sharp");
  });
  it("大额派分解锁冷门猎手", () => {
    expect(earned({ biggestPayout: 500 })).toContain("underdog");
  });
  it("段位徽章按余额", () => {
    expect(earned({ balance: 2500 })).toContain("gold");
    expect(earned({ balance: 2000 })).not.toContain("gold");
  });
});
