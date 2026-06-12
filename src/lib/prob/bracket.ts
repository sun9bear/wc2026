// 2026 世界杯 32 强淘汰赛结构（FIFA 规程，经 Wikipedia 原始数据逐字核对）。
// - R32 共 16 场（M73-M88）：8 场"小组第一 vs 最佳第三"、4 场交叉"第一 vs 第二"、4 场"第二 vs 第二"
// - 第三名分配：按 FIFA Annex C 的 495 行查表（thirdAllocation.json，生成器校验过允许集合）
// - 晋级衔接：R16(M89-96) → QF(M97-100) → SF(M101-102) → 决赛 M104

import allocTable from "./thirdAllocation.json";

/** 第三名槽位顺序（与 JSON 值的字母位序一致）：对阵 1A,1B,1D,1E,1G,1I,1K,1L。 */
export const THIRD_SLOT_ORDER = ["A", "B", "D", "E", "G", "I", "K", "L"] as const;

/** 各槽位允许的第三名来源组（保证不与同组第一相遇）。 */
export const THIRD_ALLOWED: Record<string, string> = {
  A: "CEFHI",
  B: "EFGIJ",
  D: "BEFIJ",
  E: "ABCDF",
  G: "AEHIJ",
  I: "CDFGH",
  K: "DEIJL",
  L: "EHIJK",
};

export type Src =
  | { kind: "winner"; group: string }
  | { kind: "runner"; group: string }
  | { kind: "third"; slot: string }; // slot = 对面第一名所在组

/** R32 对阵表（M73-M88）。 */
export const R32: { match: number; home: Src; away: Src }[] = [
  { match: 73, home: { kind: "runner", group: "A" }, away: { kind: "runner", group: "B" } },
  { match: 74, home: { kind: "winner", group: "E" }, away: { kind: "third", slot: "E" } },
  { match: 75, home: { kind: "winner", group: "F" }, away: { kind: "runner", group: "C" } },
  { match: 76, home: { kind: "winner", group: "C" }, away: { kind: "runner", group: "F" } },
  { match: 77, home: { kind: "winner", group: "I" }, away: { kind: "third", slot: "I" } },
  { match: 78, home: { kind: "runner", group: "E" }, away: { kind: "runner", group: "I" } },
  { match: 79, home: { kind: "winner", group: "A" }, away: { kind: "third", slot: "A" } },
  { match: 80, home: { kind: "winner", group: "L" }, away: { kind: "third", slot: "L" } },
  { match: 81, home: { kind: "winner", group: "D" }, away: { kind: "third", slot: "D" } },
  { match: 82, home: { kind: "winner", group: "G" }, away: { kind: "third", slot: "G" } },
  { match: 83, home: { kind: "runner", group: "K" }, away: { kind: "runner", group: "L" } },
  { match: 84, home: { kind: "winner", group: "H" }, away: { kind: "runner", group: "J" } },
  { match: 85, home: { kind: "winner", group: "B" }, away: { kind: "third", slot: "B" } },
  { match: 86, home: { kind: "winner", group: "J" }, away: { kind: "runner", group: "H" } },
  { match: 87, home: { kind: "winner", group: "K" }, away: { kind: "third", slot: "K" } },
  { match: 88, home: { kind: "runner", group: "D" }, away: { kind: "runner", group: "G" } },
];

/** 后续轮次衔接：match → [上一轮主来源场次, 客来源场次]（取胜者）。 */
export const R16: Record<number, [number, number]> = {
  89: [74, 77],
  90: [73, 75],
  91: [76, 78],
  92: [79, 80],
  93: [83, 84],
  94: [81, 82],
  95: [86, 88],
  96: [85, 87],
};
export const QF: Record<number, [number, number]> = {
  97: [89, 90],
  98: [93, 94],
  99: [91, 92],
  100: [95, 96],
};
export const SF: Record<number, [number, number]> = { 101: [97, 98], 102: [99, 100] };
export const FINAL: [number, number] = [101, 102];

/**
 * 第三名分配：晋级的 8 个组 → 槽位指派（slot 组字母 → 第三名来源组字母）。
 * 主路径查 Annex C 表；表缺失（理论上不可能）时用满足允许集合的确定性完美匹配兜底。
 */
export function allocateThirds(qualifiedGroups: string[]): Record<string, string> {
  const key = [...qualifiedGroups].sort().join("");
  const row = (allocTable as Record<string, string>)[key];
  if (row) {
    const out: Record<string, string> = {};
    THIRD_SLOT_ORDER.forEach((slot, i) => {
      out[slot] = row[i];
    });
    return out;
  }
  const m = matchThirds([...qualifiedGroups].sort());
  if (!m) throw new Error(`第三名分配无解: ${key}`);
  return m;
}

/** 回溯求一个满足允许集合的完美匹配（确定性：槽位序+字母序）。 */
export function matchThirds(groups: string[]): Record<string, string> | null {
  const used = new Set<string>();
  const out: Record<string, string> = {};
  function go(i: number): boolean {
    if (i === THIRD_SLOT_ORDER.length) return true;
    const slot = THIRD_SLOT_ORDER[i];
    for (const g of groups) {
      if (used.has(g) || !THIRD_ALLOWED[slot].includes(g)) continue;
      used.add(g);
      out[slot] = g;
      if (go(i + 1)) return true;
      used.delete(g);
      delete out[slot];
    }
    return false;
  }
  return go(0) ? out : null;
}
