import { describe, it, expect } from "vitest";
import { genLeagueCode, normalizeLeagueCode } from "./code";

describe("genLeagueCode", () => {
  it("形如 WC-XXXX，4 位取自无歧义字母表（不含 0/1/I/L/O）", () => {
    for (let i = 0; i < 200; i++) {
      const c = genLeagueCode();
      expect(c).toMatch(/^WC-[A-HJ-NP-Z2-9]{4}$/);
    }
  });
});

describe("normalizeLeagueCode", () => {
  const VALID = /^WC-[A-Z2-9]{4}$/;

  it("标准写法原样保留", () => {
    expect(normalizeLeagueCode("WC-8K2F")).toBe("WC-8K2F");
  });
  it("小写 + 空格容错", () => {
    expect(normalizeLeagueCode("  wc-8k2f ")).toBe("WC-8K2F");
  });
  it("裸后缀补前缀", () => {
    expect(normalizeLeagueCode("8K2F")).toBe("WC-8K2F");
  });
  it("漏写横杠（WC8K2F）也能修复 —— 对抗审查回归点", () => {
    expect(normalizeLeagueCode("WC8K2F")).toBe("WC-8K2F");
    expect(normalizeLeagueCode("wc8k2f")).toBe("WC-8K2F");
  });
  it("后缀本身以 WC 开头时不被误砍", () => {
    // 真实口令 WC-WCXY：完整写法与裸后缀都应还原成 WC-WCXY
    expect(normalizeLeagueCode("WC-WCXY")).toBe("WC-WCXY");
    expect(normalizeLeagueCode("WCWCXY")).toBe("WC-WCXY");
    expect(normalizeLeagueCode("WCXY")).toBe("WC-WCXY");
  });
  it("修复后的常见输入都能通过 join 路由的校验正则", () => {
    for (const input of ["WC-8K2F", "8K2F", "WC8K2F", "wc-8k2f", "WCXY"]) {
      expect(normalizeLeagueCode(input)).toMatch(VALID);
    }
  });
});
