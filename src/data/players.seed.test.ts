import { describe, it, expect } from "vitest";
import { PLAYERS } from "./players.seed";
import { flagUrl } from "@/lib/football/teams";

// 种子完整性守卫：teamName 拼错会让国旗/译名静默失败，这里用 flagUrl 兜底拦截。
describe("players.seed", () => {
  it("候选池规模足够（≥30）", () => {
    expect(PLAYERS.length).toBeGreaterThanOrEqual(30);
  });

  it("slug 唯一且为 ascii kebab-case", () => {
    const slugs = PLAYERS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("每名球员的 teamName 都能解析出国旗（∈ NATIONS）", () => {
    for (const p of PLAYERS) {
      expect(flagUrl(p.teamName), `flag missing: ${p.name} / ${p.teamName}`).not.toBeNull();
    }
  });

  it("countryIso 为小写 ISO（含 gb-eng 等变体）", () => {
    for (const p of PLAYERS) expect(p.countryIso).toMatch(/^[a-z]{2}(-[a-z]{3})?$/);
  });

  it("name / wikiTitle / position 合法", () => {
    for (const p of PLAYERS) {
      expect(p.name.length).toBeGreaterThan(1);
      expect(p.nameZh.length).toBeGreaterThan(0); // zh 渲染依赖
      expect(p.wikiTitle).toMatch(/^\S+$/); // 下划线连接，无空格
      expect(["GK", "DF", "MF", "FW"]).toContain(p.position);
    }
  });
});
