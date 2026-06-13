import { describe, it, expect } from "vitest";
import { computeWinStreaks } from "./winStreak";

describe("computeWinStreaks", () => {
  it("空序列", () => {
    expect(computeWinStreaks([])).toEqual({ streak: 0, bestStreak: 0 });
  });

  it("全胜：当前=历史=长度", () => {
    expect(computeWinStreaks([true, true, true])).toEqual({ streak: 3, bestStreak: 3 });
  });

  it("末尾连胜为当前，中段更长为历史最佳", () => {
    // W W W L W W → 当前 2，最佳 3
    expect(computeWinStreaks([true, true, true, false, true, true])).toEqual({
      streak: 2,
      bestStreak: 3,
    });
  });

  it("最近一场失利 → 当前归零，历史保留", () => {
    expect(computeWinStreaks([true, true, false])).toEqual({ streak: 0, bestStreak: 2 });
  });

  it("全负", () => {
    expect(computeWinStreaks([false, false])).toEqual({ streak: 0, bestStreak: 0 });
  });
});
