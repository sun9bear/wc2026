// eloratings.net 数据解析（纯函数：入参为已抓取的文本，便于测试与缓存）。
// World.tsv：制表符分隔，列[2]=队码（如 ES）、列[3]=当前 Elo。
// en.teams.tsv：列[0]=队码，列[1..]=队名与别名。

import { normalizeTeamName } from "./names";

/** 解析 World.tsv → 队码→Elo。 */
export function parseWorldTsv(tsv: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const line of tsv.split("\n")) {
    const cols = line.split("\t");
    if (cols.length < 4) continue;
    const code = cols[2]?.trim();
    const elo = Number(cols[3]);
    if (code && Number.isFinite(elo) && elo > 0) out.set(code, elo);
  }
  return out;
}

/** 解析 en.teams.tsv → 归一化队名（含别名）→ 队码。 */
export function parseTeamsTsv(tsv: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of tsv.split("\n")) {
    const cols = line.split("\t").map((c) => c.trim());
    if (cols.length < 2 || !cols[0] || cols[0].includes("_")) continue; // 跳过 US_loc 等定位词条
    for (let i = 1; i < cols.length; i++) {
      if (cols[i]) out.set(normalizeTeamName(cols[i]), cols[0]);
    }
  }
  return out;
}

/** 组合：任意拼写队名 → Elo；未命中返回 null（调用方降级处理，不猜值）。 */
export function eloFor(
  name: string,
  nameToCode: Map<string, string>,
  codeToElo: Map<string, number>
): number | null {
  const code = nameToCode.get(normalizeTeamName(name));
  if (!code) return null;
  return codeToElo.get(code) ?? null;
}
