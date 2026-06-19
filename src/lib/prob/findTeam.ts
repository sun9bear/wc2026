import type { ForecastData, TeamView } from "./pipeline";

/**
 * URL slug 边界归一：安全百分号解码（畸形转义则回退原值）→ NFC → 去空白。
 * 修复根因：Next 对非 ASCII 动态段（Curaçao）在 page 组件与 generateMetadata 之间解码不一致——
 * 一处拿到已解码的 "curaçao"，另一处拿到原始 "cura%C3%A7ao"——直接字符串比较错配 → 软 404。
 * 解码后再 NFC 顺带消化预组合(U+00E7)/分解(c+U+0327)形差异。
 * 对 team id、中文名等无 % / 无重音的输入是幂等且无副作用的。
 */
export function normalizeSlug(raw: string): string {
  let s = raw;
  try {
    s = decodeURIComponent(raw);
  } catch {
    // 畸形百分号转义：保留原值，绝不抛错
  }
  return s.normalize("NFC").trim();
}

// 按 URL 查询词定位球队：支持英文名（含 - / _ 分隔的 slug）、中文名、team id。
export function findTeam(
  data: ForecastData,
  q: string
): { team: TeamView; letter: string; rank: number } | null {
  const raw = normalizeSlug(q);
  if (!raw) return null;
  const norm = raw.toLowerCase().replace(/[-_]+/g, " ");
  for (const g of data.groups) {
    for (let i = 0; i < g.table.length; i++) {
      const t = g.table[i];
      // 存储名也折叠连字符/下划线为空格，与 query 归一化对称——
      // 否则 "Bosnia-Herzegovina" 的 slug "bosnia-herzegovina" 永远匹配不上（连字符卡死）。
      const name = t.name.normalize("NFC").toLowerCase().replace(/[-_]+/g, " ");
      if (name === norm || t.zh.normalize("NFC") === raw || t.id === raw) {
        return { team: t, letter: g.letter, rank: i + 1 };
      }
    }
  }
  return null;
}

/** 英文队名 → URL slug（"South Korea" → "south-korea"）。NFC 归一保证 ç 等重音字符稳定编码。 */
export function teamSlug(name: string): string {
  return name.normalize("NFC").toLowerCase().replace(/\s+/g, "-");
}
