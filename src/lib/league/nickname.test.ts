import { describe, it, expect } from "vitest";
import { validateNickname, canonicalizeNickname } from "./nickname";

describe("validateNickname", () => {
  it("接受正常中英文名", () => {
    expect(validateNickname("张三丰")).toBeNull();
    expect(validateNickname("LuckyFox42")).toBeNull();
    expect(validateNickname("阿强")).toBeNull();
  });

  it("长度边界：<2 或 >20 码点拒，边界值合法", () => {
    expect(validateNickname("a")).toBe("nickname_length");
    expect(validateNickname("")).toBe("nickname_length");
    expect(validateNickname("a".repeat(21))).toBe("nickname_length");
    expect(validateNickname("ab")).toBeNull();
    expect(validateNickname("a".repeat(20))).toBeNull();
  });

  it("拒标签字符 <>", () => {
    expect(validateNickname("a<b>c")).toBe("nickname_invalid");
  });

  it("拒不可见控制/格式字符（RTL override 等显示欺骗向量）", () => {
    expect(validateNickname("ab‮cd")).toBe("nickname_invalid"); // U+202E RLO
  });

  it("雷词及各种绕过手法一律拒（任意非 null 错误码均可——关键是存不进库）", () => {
    for (const bad of [
      "bet", "BET", "投注", "下注", "赔率",
      "BetKing", "bet365", "CasinoBoss", "OddsGuru",
      "ｂｅｔ", "b e t", "b.e.t", "b​e​t",
      "投　注", "下​注",
    ]) {
      expect(validateNickname(bad)).not.toBeNull();
    }
  });

  it("canonicalizeNickname：NFKC 折叠全角 + 合并空白 + trim", () => {
    expect(canonicalizeNickname("  ＡＢ  ")).toBe("AB");
    expect(canonicalizeNickname("a　b")).toBe("a b");
    expect(canonicalizeNickname("张三")).toBe("张三");
  });
});
