import { describe, it, expect } from "vitest";
import {
  localeHref,
  stripLocale,
  isLocale,
  PREFIXED_LOCALES,
  LOCALES,
  DEFAULT_LOCALE,
} from "./locales";

// P2-2 A1：把硬编码的 zh 前缀逻辑重构成配置驱动（PREFIXED_LOCALES）。
// 这些断言锁死【重构前后行为完全一致】——en 留根、zh 加 /zh、互为逆。回归闸。

describe("localeHref — 行为须与重构前一致", () => {
  it("DEFAULT_LOCALE(en) 留根，路径原样返回", () => {
    expect(localeHref("en", "/")).toBe("/");
    expect(localeHref("en", "/forecast")).toBe("/forecast");
    expect(localeHref("en", "/match/abc-123")).toBe("/match/abc-123");
  });
  it("zh 加 /zh 前缀，根特判为 /zh", () => {
    expect(localeHref("zh", "/")).toBe("/zh");
    expect(localeHref("zh", "/forecast")).toBe("/zh/forecast");
    expect(localeHref("zh", "/team/brazil")).toBe("/zh/team/brazil");
  });
  it("P2-2 激活的 es/pt/de/fr 各加自身前缀", () => {
    expect(localeHref("es", "/")).toBe("/es");
    expect(localeHref("es", "/forecast")).toBe("/es/forecast");
    expect(localeHref("pt", "/forecast")).toBe("/pt/forecast");
    expect(localeHref("de", "/forecast")).toBe("/de/forecast");
    expect(localeHref("fr", "/team/brazil")).toBe("/fr/team/brazil");
  });
});

describe("stripLocale — 行为须与重构前一致", () => {
  it("剥 /zh 前缀，/zh 映射回 /", () => {
    expect(stripLocale("/zh")).toBe("/");
    expect(stripLocale("/zh/forecast")).toBe("/forecast");
    expect(stripLocale("/zh/team/brazil")).toBe("/team/brazil");
  });
  it("根/en 路径原样不动", () => {
    expect(stripLocale("/")).toBe("/");
    expect(stripLocale("/forecast")).toBe("/forecast");
  });
  it("不误伤含 zh 子串但非前缀段的路径", () => {
    expect(stripLocale("/zhang")).toBe("/zhang");
    expect(stripLocale("/zhao/x")).toBe("/zhao/x");
  });
});

describe("localeHref ↔ stripLocale 对每个前缀 locale 互逆", () => {
  it("round-trip", () => {
    for (const loc of PREFIXED_LOCALES) {
      expect(stripLocale(localeHref(loc, "/"))).toBe("/");
      expect(stripLocale(localeHref(loc, "/forecast"))).toBe("/forecast");
      expect(stripLocale(localeHref(loc, "/match/x"))).toBe("/match/x");
    }
  });
});

describe("isLocale 运行时守卫", () => {
  it("受支持的 locale 返回 true", () => {
    for (const loc of LOCALES) expect(isLocale(loc)).toBe(true);
  });
  it("P2-2 激活后 es/pt/de/fr 返回 true", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("pt")).toBe(true);
    expect(isLocale("de")).toBe(true);
    expect(isLocale("fr")).toBe(true);
  });
  it("非法值返回 false", () => {
    expect(isLocale("xx")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("配置自洽性（防扩语种时配置写歪）", () => {
  it("DEFAULT_LOCALE 不带前缀（留根）", () => {
    expect(PREFIXED_LOCALES).not.toContain(DEFAULT_LOCALE);
  });
  it("PREFIXED_LOCALES ⊆ LOCALES", () => {
    for (const loc of PREFIXED_LOCALES) expect(LOCALES).toContain(loc);
  });
  it("DEFAULT_LOCALE ∈ LOCALES", () => {
    expect(LOCALES).toContain(DEFAULT_LOCALE);
  });
});
