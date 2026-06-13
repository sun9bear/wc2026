import type { ForecastData, TeamView } from "./pipeline";

// 按 URL 查询词定位球队：支持英文名（含 - / _ 分隔的 slug）、中文名、team id。
export function findTeam(
  data: ForecastData,
  q: string
): { team: TeamView; letter: string; rank: number } | null {
  const raw = q.trim();
  if (!raw) return null;
  const norm = raw.toLowerCase().replace(/[-_]+/g, " ");
  for (const g of data.groups) {
    for (let i = 0; i < g.table.length; i++) {
      const t = g.table[i];
      if (t.name.toLowerCase() === norm || t.zh === raw || t.id === raw) {
        return { team: t, letter: g.letter, rank: i + 1 };
      }
    }
  }
  return null;
}

/** 英文队名 → URL slug（"South Korea" → "south-korea"）。 */
export function teamSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}
