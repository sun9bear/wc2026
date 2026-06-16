import { describe, it, expect } from "vitest";
import { computeRequirements } from "./requirements";
import type { GroupResult } from "./types";

// 合成 12 组 × 4 队。B–L 全部踢完（小序号 1-0 胜，无剩余）。
// A 组精心设计：A1 胜 A2、A1 胜 A3、A3 胜 A2、A4 胜 A2、A4 胜 A3 → 仅剩 A1-A4。
// 此时 A1=6 分(2 场)、A4=6 分(2 场)、A3=3 分(踢完)、A2=0 分(踢完)。
// 故无论 A1-A4 结果如何，A1 与 A4 都 ≥6 > A3 的 3 → A1 必进前二（已锁定出线）。
function makeData() {
  const letters = "ABCDEFGHIJKL".split("");
  const groupTeams: Record<string, string[]> = {};
  const rating: Record<string, number> = {};
  const played: GroupResult[] = [];
  const table: Record<string, { id: string; name: string; zh: string; flag: null }[]> = {};

  for (const L of letters) {
    const ids = [1, 2, 3, 4].map((n) => `${L}${n}`);
    groupTeams[L] = ids;
    table[L] = ids.map((id) => ({ id, name: id, zh: id, flag: null }));
    for (const id of ids) rating[id] = 1600;
    if (L === "A") continue;
    const pairs: [number, number][] = [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [2, 3],
    ];
    for (const [i, j] of pairs)
      played.push({ homeId: ids[i], awayId: ids[j], homeGoals: 1, awayGoals: 0 });
  }
  // A 组手工：仅剩 A1-A4
  played.push({ homeId: "A1", awayId: "A2", homeGoals: 1, awayGoals: 0 });
  played.push({ homeId: "A1", awayId: "A3", homeGoals: 1, awayGoals: 0 });
  played.push({ homeId: "A3", awayId: "A2", homeGoals: 1, awayGoals: 0 });
  played.push({ homeId: "A4", awayId: "A2", homeGoals: 1, awayGoals: 0 });
  played.push({ homeId: "A4", awayId: "A3", homeGoals: 1, awayGoals: 0 });

  const matches = [{ homeId: "A1", awayId: "A4" }];
  const groups = letters.map((L) => ({ letter: L, table: table[L] }));

  return { groupTeams, rating, played, matches, groups } as unknown as Parameters<
    typeof computeRequirements
  >[0];
}

describe("computeRequirements", () => {
  const data = makeData();

  it("A1 已锁定前二：3 种战绩全部 100% 出线，门槛=6 分净胜+1", () => {
    const req = computeRequirements(data, "A1")!;
    expect(req).not.toBeNull();
    expect(req.curPts).toBe(6);
    expect(req.records).toHaveLength(3); // k=1 → 胜/平/负
    for (const r of req.records) expect(r.p).toBe(1);
    // 战绩按积分降序：9 / 7 / 6
    expect(req.records.map((r) => r.pts)).toEqual([9, 7, 6]);
    // 保底门槛：最低保证(负 A4)=6 分，净胜球 +1（2 胜 -1 负）
    expect(req.clinchPts).toBe(6);
    expect(req.clinchGd).toBe(1);
  });

  it("A4 镜像同样锁定", () => {
    const req = computeRequirements(data, "A4")!;
    expect(req.clinchPts).toBe(6);
    for (const r of req.records) expect(r.p).toBe(1);
  });

  it("A2 已出局：唯一战绩(0 分)出线概率为 0、无保底门槛", () => {
    const req = computeRequirements(data, "A2")!;
    expect(req.curPts).toBe(0);
    expect(req.records).toHaveLength(1); // k=0，已踢完
    expect(req.records[0].p).toBeLessThan(0.01);
    expect(req.clinchPts).toBeNull();
  });

  it("概率字段恒在 [0,1] 且 pLow ≤ p ≤ pHigh", () => {
    for (const id of ["A1", "A2", "A4"]) {
      const req = computeRequirements(data, id)!;
      for (const r of req.records) {
        expect(r.pLow).toBeLessThanOrEqual(r.p + 1e-9);
        expect(r.p).toBeLessThanOrEqual(r.pHigh + 1e-9);
        expect(r.p).toBeGreaterThanOrEqual(0);
        expect(r.p).toBeLessThanOrEqual(1);
      }
    }
  });

  it("结构不完整(<12 组)返回 null", () => {
    const bad = { ...(data as object), groupTeams: { A: ["A1", "A2", "A3", "A4"] } } as Parameters<
      typeof computeRequirements
    >[0];
    expect(computeRequirements(bad, "A1")).toBeNull();
  });
});
