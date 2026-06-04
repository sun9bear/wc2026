export type Locale = "zh" | "en";

// 去博彩化雷词表（设计方案 §3）。公开文案中绝不出现这些词，含否定形式。
// 关键词扫描只匹配词、不看上下文，因此"非投注"中的"投注"同样命中。
const BANNED: Record<Locale, string[]> = {
  zh: [
    "投注", "下注", "押注", "赌", "博彩", "赔率", "庄家", "盘口", "彩票", "竞彩", "体彩",
    // 诱导/承诺类（AI 提示词明令禁止，lint 须强制对齐）
    "推荐", "必赢", "稳赢", "稳赚",
  ],
  en: ["bet", "betting", "wager", "odds", "bookmaker", "gamble", "gambling", "casino", "stake"],
};

/** 返回文本中命中的雷词；无命中返回空数组。 */
export function findBannedTerms(text: string, locale: Locale): string[] {
  const hay = locale === "en" ? text.toLowerCase() : text;
  return BANNED[locale].filter((term) =>
    locale === "en" ? new RegExp(`\\b${term}\\b`).test(hay) : hay.includes(term)
  );
}

/** 命中雷词则抛错——用于发布前对公开文案做强制校验。 */
export function assertClean(text: string, locale: Locale): void {
  const hits = findBannedTerms(text, locale);
  if (hits.length) {
    throw new Error(`Banned term(s) in ${locale} copy: ${hits.join(", ")}`);
  }
}
