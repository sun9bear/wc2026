import { it, expect } from "vitest";
import { findBannedTerms } from "@/lib/compliance/bannedTerms";
import { zh } from "@/i18n/messages/zh";

// 防止文案漂移：直接校验实际 i18n 文案常量是否合规。
it("disclaimer copy is compliant", () => {
  expect(findBannedTerms(zh.disclaimer, "zh")).toEqual([]);
});

it("all zh ui copy strings are compliant", () => {
  const strings = [zh.appName, zh.tagline, zh.disclaimer, ...Object.values(zh.nav)];
  for (const s of strings) {
    expect(findBannedTerms(s, "zh")).toEqual([]);
  }
});
