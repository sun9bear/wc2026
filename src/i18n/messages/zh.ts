// 中文文案模块（i18n-ready：不在组件里硬编码用户文案）。
// 全部文案须能通过 src/lib/compliance/bannedTerms.ts 的 assertClean(..., "zh")。
export const zh = {
  appName: "环球足球预测 · 2026",
  tagline: "趣味预测 · 冲榜 · 解锁段位",
  disclaimer: "仅供娱乐 · 积分无现实价值 · 不可兑换",
  nav: { predict: "预测", combo: "串关", ranking: "排行", me: "我的" },
  filter: { all: "全部", upcoming: "未开赛", done: "已结束", empty: "该筛选下暂无比赛。" },
  footer: {
    about: "关于 & 玩法",
    privacy: "隐私政策",
    terms: "免责声明",
    note: "仅供娱乐 · 积分无现实价值 · 不可兑换 · 与 FIFA／世界杯等官方组织无关",
  },
  langLabel: "EN",
} as const;

export type ZhMessages = typeof zh;
