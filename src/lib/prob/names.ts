// 跨数据源队名归一：The Odds API / eloratings.net / football-data（库内 canon）拼写各异。
// 策略：宽松归一（去重音/标点/and）+ 显式覆盖表；匹配失败返回 null（调用方降级，绝不猜）。

const OVERRIDES: Record<string, string> = {
  // 归一化后仍对不上的桥接（key/value 均为 normalize 之后的形态）
  "cote d ivoire": "ivory coast",
  "cote divoire": "ivory coast",
  "dr congo": "congo dr",
  "congo kinshasa": "congo dr",
  turkiye: "turkey",
  "korea republic": "south korea",
  usa: "united states",
  "united states of america": "united states",
  "czech republic": "czechia",
  "cape verde islands": "cape verde",
};

/** 宽松归一：小写、去重音、& / - ' . 变空格、去掉独立的 and、压缩空格。 */
export function normalizeTeamName(raw: string): string {
  const base = raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[&/\-'.]/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return OVERRIDES[base] ?? base;
}

/** 用归一化键建立查找表：任意来源拼写 → 你指定的 canon 值（如库内 team id/name）。 */
export function buildNameIndex<T>(entries: { name: string; value: T }[]): Map<string, T> {
  const idx = new Map<string, T>();
  for (const e of entries) idx.set(normalizeTeamName(e.name), e.value);
  return idx;
}

/** 从索引取值；未命中返回 null。 */
export function lookupTeam<T>(idx: Map<string, T>, rawName: string): T | null {
  return idx.get(normalizeTeamName(rawName)) ?? null;
}
