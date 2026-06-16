import { chat as deepseekChat } from "@/lib/ai/deepseek";
import { chat as geminiChat } from "@/lib/ai/gemini";
import { findBannedTerms } from "@/lib/compliance/bannedTerms";

// 球员一句话"看点短评"（安全版，设计 §6.3 / §9）。
// 红线：只谈球风/球场特质，**绝不评价外貌/颜值**；禁博彩词；过雷词 lint，违规则放弃（返回 null，不展示）。

const RETRY_ZH = "\n注意：上次输出含违禁词或越界内容，请重写，彻底避免博彩字眼，且只谈球风、绝不提外貌。";
const RETRY_EN =
  "\nYour previous attempt broke a rule. Rewrite: no forbidden words, on-pitch playing style only, never mention appearance.";

const SYSTEM_ZH = `你为一款【无金钱、纯娱乐】的足球应用写球员一句话"看点短评"。严格规则：
- 只描述球风、踢法、看他踢球的乐趣或高光特质（速度、组织、终结、防守、领袖气质等）。30-60 字中文。
- 绝对禁止评价或提及外貌/长相/颜值/身材/帅；只谈球场上的表现与影响力。
- 绝对禁止任何博彩/投注字眼（投注、下注、赌、博彩、赔率、庄家、盘口、彩票、竞彩、体彩、推荐、必赢、稳赢、稳赚）。
- 不写免责声明，最多 1 个 emoji。`;

const SYSTEM_EN = `Write a one-line "what to watch" blurb about a footballer for a free, fun (no real money) app. Hard rules:
- Describe ONLY playing style / on-pitch traits / why they're fun to watch (pace, vision, finishing, defending, leadership). 20-40 words of English.
- NEVER mention or rate appearance / looks / physique / how attractive they are. On-pitch only.
- NEVER use: odds, bet, betting, wager, stake, payout, multiplier, bookmaker, sportsbook, parlay, accumulator, acca, handicap, tipster, gamble, gambling, casino.
- No disclaimers, at most one emoji, plain prose.`;

type ChatFn = (system: string, user: string, timeoutMs?: number) => Promise<string>;

async function safe(
  chatFn: ChatFn,
  system: string,
  retryNote: string,
  user: string,
  locale: "zh" | "en"
): Promise<string | null> {
  try {
    let body = (await chatFn(system, user, 12000)).trim();
    if (findBannedTerms(body, locale).length > 0) {
      body = (await chatFn(system + retryNote, user, 12000)).trim();
    }
    if (!body || findBannedTerms(body, locale).length > 0) return null;
    return body;
  } catch {
    return null; // 无 key / 网络 / 超时 → 放弃，本轮不写（下轮重试）
  }
}

export function generatePlayerBlurbZh(
  name: string,
  teamName: string,
  position: string
): Promise<string | null> {
  return safe(
    deepseekChat,
    SYSTEM_ZH,
    RETRY_ZH,
    `球员：${name}（${teamName}，位置 ${position || "未知"}）。写一句看点短评。`,
    "zh"
  );
}

export function generatePlayerBlurbEn(
  name: string,
  teamName: string,
  position: string
): Promise<string | null> {
  return safe(
    geminiChat,
    SYSTEM_EN,
    RETRY_EN,
    `Player: ${name} (${teamName}, position ${position || "unknown"}). Write a one-line what-to-watch blurb.`,
    "en"
  );
}
