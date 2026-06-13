export type Locale = "zh" | "en";

// 去博彩化雷词表（设计方案 §3）。公开文案中绝不出现这些词，含否定形式。
// 关键词扫描只匹配词、不看上下文，因此"非投注"中的"投注"同样命中。
const BANNED: Record<Locale, string[]> = {
  zh: [
    "投注", "下注", "押注", "赌", "博彩", "赔率", "庄家", "盘口", "彩票", "竞彩", "体彩",
    // 诱导/承诺类（AI 提示词明令禁止，lint 须强制对齐）
    "推荐", "必赢", "稳赢", "稳赚",
  ],
  en: [
    "bet", "betting", "wager", "odds", "bookmaker", "gamble", "gambling", "casino", "stake",
    // 美式博彩词族（AdSense 分类器文本特征，2026-06 合规审查补充）
    "parlay", "accumulator", "acca", "handicap", "tipster", "payout", "multiplier", "sportsbook",
  ],
};

/** 返回文本中命中的雷词；无命中返回空数组。英文按整词匹配，含复数形式。
 * 仅用于 AI/编辑正文（句子上下文）——整词匹配避免误伤 "mistake" 含 "stake" 之类正常行文。 */
export function findBannedTerms(text: string, locale: Locale): string[] {
  const hay = locale === "en" ? text.toLowerCase() : text;
  return BANNED[locale].filter((term) =>
    locale === "en" ? new RegExp(`\\b${term}s?\\b`).test(hay) : hay.includes(term)
  );
}

// 零宽 / 软连字符 / 不可见连接符 / 填充符——身份字段里常被用来拆开雷词绕过扫描，匹配前先删掉。
const INVISIBLE = /[­​-‏⁠-⁤﻿ㅤﾠ]/g;

/**
 * 严格雷词扫描——仅用于「用户可控的短身份字段」（昵称 / 擂台名 / OG ?by= / ?result=）。
 * 先做对抗性归一化再「子串」匹配，因此以下绕过手法全部命中：
 *   全角 ｂｅｔ、零宽插入 b<zwsp>et、空格/标点拆分 "b e t"/"b.e.t"、驼峰拼接 BetKing、数字拼接 bet365、
 *   全角空格 "投　注"、组合变音符。
 * 注意：子串匹配会误伤含雷词子串的正常词（Betty/Tibet/mistake），对身份短字段可接受（合规红线优先）；
 * 绝不可用于正文——正文请用 findBannedTerms（词边界版）。
 */
export function findBannedTermsStrict(text: string, locale: Locale): string[] {
  const norm = text
    .normalize("NFKC") // 全角→半角、合并兼容字形、U+3000→普通空格
    .toLowerCase()
    .replace(INVISIBLE, "")
    .replace(/\p{M}/gu, "") // 组合记号（变音符等），保留基字符
    .replace(/[^\p{L}\p{N}]+/gu, ""); // 删所有非字母数字分隔（空格/标点）——拆分类绕过随之失效
  return BANNED[locale].filter((term) => norm.includes(term));
}

/** 命中雷词则抛错——用于发布前对公开文案做强制校验。 */
export function assertClean(text: string, locale: Locale): void {
  const hits = findBannedTerms(text, locale);
  if (hits.length) {
    throw new Error(`Banned term(s) in ${locale} copy: ${hits.join(", ")}`);
  }
}
