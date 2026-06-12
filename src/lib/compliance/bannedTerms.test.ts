import { it, expect, describe } from "vitest";
import { findBannedTerms, assertClean } from "./bannedTerms";

describe("findBannedTerms", () => {
  it("flags zh gambling terms", () => {
    expect(findBannedTerms("立即投注赢大奖", "zh")).toContain("投注");
  });
  it("flags zh terms even when negated (scanner ignores context)", () => {
    expect(findBannedTerms("仅供娱乐，非投注建议", "zh")).toContain("投注");
  });
  it("flags advice/guarantee terms forbidden by AI prompts", () => {
    for (const t of ["推荐", "必赢", "稳赢", "稳赚"]) {
      expect(findBannedTerms(`这场${t}没跑`, "zh")).toContain(t);
    }
  });
  it("flags en gambling terms case-insensitively", () => {
    expect(findBannedTerms("Place your BET now", "en")).toContain("bet");
  });
  it("flags US sportsbook vocabulary (AdSense classifier features)", () => {
    for (const t of ["parlay", "accumulator", "handicap", "tipster", "payout", "sportsbook"]) {
      expect(findBannedTerms(`try this ${t} today`, "en")).toContain(t);
    }
  });
  it("flags en plural forms", () => {
    expect(findBannedTerms("Build winning parlays", "en")).toContain("parlay");
    expect(findBannedTerms("compare payouts here", "en")).toContain("payout");
    expect(findBannedTerms("place your bets", "en")).toContain("bet");
  });
  it("passes clean neutral en copy", () => {
    expect(findBannedTerms("Combo picks: win probability 62% — for fun only", "en")).toEqual([]);
  });
  it("passes clean neutral zh copy", () => {
    expect(findBannedTerms("仅供娱乐 · 积分无现实价值 · 不可兑换", "zh")).toEqual([]);
  });
  it("assertClean throws on violation", () => {
    expect(() => assertClean("赔率更新", "zh")).toThrow();
  });
  it("assertClean passes clean copy", () => {
    expect(() => assertClean("趣味预测 · 冲榜", "zh")).not.toThrow();
  });
});
