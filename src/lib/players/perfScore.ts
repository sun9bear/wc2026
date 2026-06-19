import type { Scorer } from "@/lib/football/getScorers";

// 表现分（人气指数的 30% 分量，见设计 §5）。用真实进球数据，绝不用 LLM。
// 射手榜（football-data Top20）→ 球员归一化名 → 进球数；非射手 = 0。

/** 归一化球员名用于跨源匹配（去重音、去非字母数字、转小写）。 */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // 去 NFD 组合变音符（Unicode 属性转义，纯 ASCII、编码无关）
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** 顺序无关的归一化（token 排序）：跨源匹配「姓 名」(squad: MESSI Lionel) vs「名 姓」(榜单: Lionel Messi)。
 *  实测 Argentina 3/3、Brazil 2/3 命中；普通 normalizeName 因顺序不同会漏配。 */
export function normalizeNameSorted(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join("");
}

/** 当前射手榜 → Map<归一化名, 进球数>（同名取最大，稳健）。归一化加权在 rankingMath.ts。 */
export function buildGoalsMap(scorers: Scorer[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of scorers) {
    const k = normalizeName(s.playerName);
    if (!k) continue;
    m.set(k, Math.max(m.get(k) ?? 0, s.goals));
  }
  return m;
}
