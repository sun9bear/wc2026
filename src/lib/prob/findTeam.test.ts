import { describe, it, expect } from "vitest";
import { findTeam, teamSlug, normalizeSlug } from "./findTeam";
import type { ForecastData } from "./pipeline";

// findTeam 只读 data.groups[].table[] 的 {id,name,zh}，其余字段塞占位即可。
function stub(teams: { id: string; name: string; zh: string }[]): ForecastData {
  return {
    groups: [
      {
        letter: "A",
        table: teams.map((t) => ({
          ...t,
          flag: null,
          pts: 0,
          played: 0,
          gd: 0,
          gf: 0,
          pAdvance: 0,
          pChampion: 0,
        })),
      },
    ],
  } as unknown as ForecastData;
}

describe("findTeam / teamSlug 往返", () => {
  const data = stub([
    { id: "t1", name: "South Korea", zh: "韩国" },
    { id: "t2", name: "Bosnia-Herzegovina", zh: "波黑" },
    { id: "t3", name: "United States", zh: "美国" },
  ]);

  it("多词名 slug 可往返", () => {
    expect(findTeam(data, teamSlug("South Korea"))?.team.id).toBe("t1");
  });

  it("连字符名 slug 可往返（回归：Bosnia-Herzegovina 曾匹配失败）", () => {
    expect(teamSlug("Bosnia-Herzegovina")).toBe("bosnia-herzegovina");
    expect(findTeam(data, teamSlug("Bosnia-Herzegovina"))?.team.id).toBe("t2");
  });

  it("中文名 / team id 仍可命中", () => {
    expect(findTeam(data, "美国")?.team.id).toBe("t3");
    expect(findTeam(data, "t1")?.team.id).toBe("t1");
  });

  it("查不到返回 null", () => {
    expect(findTeam(data, "narnia")).toBeNull();
  });

  it("ç 队名跨 Unicode 归一形可命中（回归：Curaçao 软 404）", () => {
    const nfc = "Curaçao"; // 预组合 ç (U+00E7)，库内/预测里的形态
    const nfd = "Curaçao"; // 分解 c + U+0327，URL/Next 路由可能到达的形态
    const d = stub([{ id: "cw", name: nfc, zh: "库拉索" }]);
    expect(teamSlug(nfc)).toBe("curaçao"); // slug 统一输出预组合形
    expect(findTeam(d, nfd)?.team.id).toBe("cw"); // 分解形 slug 仍命中预组合形队名
    expect(findTeam(d, nfc.toLowerCase())?.team.id).toBe("cw"); // 预组合形 slug 命中
  });

  it("百分号编码 slug 可命中（真实根因：Next 把 page 段交付为原始 cura%C3%A7ao）", () => {
    const d = stub([{ id: "cw", name: "Curaçao", zh: "库拉索" }]);
    // 大小写两种编码都要解（Next/浏览器可能任一）
    expect(findTeam(d, "cura%C3%A7ao")?.team.id).toBe("cw");
    expect(findTeam(d, "cura%c3%a7ao")?.team.id).toBe("cw");
  });

  it("normalizeSlug：解码 + NFC + 容错畸形转义", () => {
    expect(normalizeSlug("cura%C3%A7ao")).toBe(normalizeSlug("Curaçao".toLowerCase())); // 解码后等于已解码形
    expect(normalizeSlug("south-korea")).toBe("south-korea"); // ASCII 无副作用
    expect(normalizeSlug("100%")).toBe("100%"); // 畸形转义回退原值，不抛错
  });
});
