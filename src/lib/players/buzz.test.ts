import { describe, it, expect } from "vitest";
import { pageviewsUrl, sumViews } from "./buzz";

describe("buzz", () => {
  it("pageviewsUrl 路径/日期格式正确，条目名编码", () => {
    const u = pageviewsUrl("Lionel_Messi", new Date("2026-06-01T00:00:00Z"), new Date("2026-06-08T00:00:00Z"));
    expect(u).toContain("/per-article/en.wikipedia.org/all-access/user/");
    expect(u).toContain("/Lionel_Messi/daily/20260601/20260608");
  });

  it("pageviewsUrl 对重音条目名做 URL 编码", () => {
    const u = pageviewsUrl("Kylian_Mbappé", new Date("2026-06-01T00:00:00Z"), new Date("2026-06-02T00:00:00Z"));
    expect(u).toContain("Kylian_Mbapp%C3%A9");
  });

  it("sumViews 累加 views，容错缺失/非数/空", () => {
    expect(sumViews({ items: [{ views: 100 }, { views: 250 }, { views: 0 }] })).toBe(350);
    expect(sumViews({ items: [{ views: 5 }, {}, { views: undefined }] })).toBe(5);
    expect(sumViews({})).toBe(0);
    expect(sumViews(null)).toBe(0);
  });
});
