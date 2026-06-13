import { describe, it, expect } from "vitest";
import { findTeam, teamSlug } from "./findTeam";
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
});
