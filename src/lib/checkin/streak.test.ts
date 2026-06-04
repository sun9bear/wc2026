import { it, expect, describe } from "vitest";
import { prevDay, computeStreak } from "./streak";

describe("prevDay", () => {
  it("普通前一天", () => {
    expect(prevDay("2026-06-12")).toBe("2026-06-11");
  });
  it("跨月", () => {
    expect(prevDay("2026-06-01")).toBe("2026-05-31");
  });
  it("跨年", () => {
    expect(prevDay("2026-01-01")).toBe("2025-12-31");
  });
});

describe("computeStreak", () => {
  const today = "2026-06-12";
  it("今天签到 → 1", () => {
    expect(computeStreak(["2026-06-12"], today)).toBe(1);
  });
  it("连续三天 → 3", () => {
    expect(computeStreak(["2026-06-12", "2026-06-11", "2026-06-10"], today)).toBe(3);
  });
  it("昨天签了今天没签 → 1（仍有效）", () => {
    expect(computeStreak(["2026-06-11"], today)).toBe(1);
  });
  it("中间断了 → 只数到断点", () => {
    expect(computeStreak(["2026-06-12", "2026-06-10"], today)).toBe(1);
  });
  it("没签过 → 0", () => {
    expect(computeStreak([], today)).toBe(0);
  });
});
