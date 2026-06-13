import { it, expect, describe } from "vitest";
import { findBannedTerms, findBannedTermsStrict, assertClean } from "./bannedTerms";

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

describe("findBannedTermsStrict（用户身份字段抗绕过）", () => {
  it("命中常规雷词（与基础版一致）", () => {
    expect(findBannedTermsStrict("bet", "en")).toContain("bet");
    expect(findBannedTermsStrict("投注", "zh")).toContain("投注");
  });
  it("命中归一化绕过：全角 / 空格 / 标点 / 全角空格 / 零宽", () => {
    expect(findBannedTermsStrict("ｂｅｔ", "en")).toContain("bet"); // 全角拉丁
    expect(findBannedTermsStrict("b e t", "en")).toContain("bet"); // 空格拆分
    expect(findBannedTermsStrict("b.e.t", "en")).toContain("bet"); // 标点拆分
    expect(findBannedTermsStrict("b​e​t", "en")).toContain("bet"); // 零宽插入
    expect(findBannedTermsStrict("投　注", "zh")).toContain("投注"); // 全角空格
    expect(findBannedTermsStrict("下​注", "zh")).toContain("下注"); // 零宽插入
  });
  it("命中拼接嵌入：驼峰 / 数字粘连（基础词边界版漏掉的）", () => {
    expect(findBannedTermsStrict("BetKing", "en")).toContain("bet");
    expect(findBannedTermsStrict("bet365", "en")).toContain("bet");
    expect(findBannedTermsStrict("CasinoBoss", "en")).toContain("casino");
    expect(findBannedTermsStrict("OddsGuru", "en")).toContain("odds");
    // 反证：基础词边界版确实漏掉这些 —— 故身份字段必须用 strict
    expect(findBannedTerms("BetKing", "en")).toEqual([]);
  });
  it("默认趣味名样例保持干净", () => {
    expect(findBannedTermsStrict("LuckyFox42", "en")).toEqual([]);
    expect(findBannedTermsStrict("神算预言家42", "zh")).toEqual([]);
  });
});
