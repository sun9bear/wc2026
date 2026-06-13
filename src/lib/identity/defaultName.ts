// 趣味默认名（确定性，零注册身份的兜底显示名）：匿名 user_id → 稳定友好的昵称，
// 替换丑陋的「玩家3f2a / Player-xxxx」。纯函数、双端可用（渲染期不可用 Math.random）。
// 词表预先筛过中英雷词；defaultName 输出恒满足 validateNickname（见 defaultName.test.ts）。

const ADJ = {
  zh: ["神算", "闪电", "铁血", "黑马", "草根", "冷静", "疯狂", "无敌", "沉默", "飞驰", "老练", "钢铁", "火热", "王者", "传奇", "不败"],
  en: ["Lucky", "Bold", "Swift", "Iron", "Silent", "Wild", "Sharp", "Clutch", "Cosmic", "Mighty", "Rapid", "Brave", "Cool", "Epic", "Royal", "Sly"],
} as const;
const NOUN = {
  zh: ["预言家", "门神", "前锋", "中场", "队长", "球探", "教练", "老炮", "后卫", "射手", "解说", "看台", "守门员", "中卫"],
  en: ["Fox", "Striker", "Oracle", "Keeper", "Pundit", "Scout", "Captain", "Hawk", "Comet", "Maestro", "Wolf", "Falcon", "Tiger", "Ranger"],
} as const;

// FNV-1a：稳定、分布好、无依赖。
function fnv1a(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 匿名 user_id → 确定性趣味默认名（同 id 同名）。形容词+名词+两位数，恒合法。 */
export function defaultName(userId: string, locale: "zh" | "en"): string {
  const h = fnv1a(userId || "anon");
  const adj = ADJ[locale][h % ADJ[locale].length];
  const noun = NOUN[locale][(h >>> 8) % NOUN[locale].length];
  const num = 10 + ((h >>> 16) % 90); // 10–99
  return `${adj}${noun}${num}`;
}
