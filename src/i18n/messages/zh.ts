// 中文文案模块（i18n-ready：不在组件里硬编码用户文案）。
// 全部文案须能通过 src/lib/compliance/bannedTerms.ts 的 assertClean(..., "zh")。
export const zh = {
  appName: "环球足球预测 · 2026",
  tagline: "趣味预测 · 冲榜 · 解锁段位",
  disclaimer: "仅供娱乐 · 积分无现实价值 · 不可兑换",
  nav: { predict: "预测", ranking: "排行", record: "战绩", me: "我的" },
} as const;

export type ZhMessages = typeof zh;
