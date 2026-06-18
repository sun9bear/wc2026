import { chat as deepseekChat } from "@/lib/ai/deepseek";
import { chat as geminiChat } from "@/lib/ai/gemini";
import { findBannedTerms } from "@/lib/compliance/bannedTerms";

// 球员一句话"看点短评"（安全版，设计 §6.3 / §9）——内容营销资产，主打「有梗·带感·可分享」。
// 红线：只谈球风/球场特质，**绝不评价外貌/颜值**；禁博彩词；过雷词 lint，违规则放弃（返回 null，不展示）。
// 英文走 Gemini 3.1 Flash-Lite（更带感的 banter）；中文走 DeepSeek。

const EN_MODEL = "gemini-3.1-flash-lite";

const RETRY_ZH = "\n注意：上次输出含违禁词或越界内容，请重写，彻底避免博彩字眼，且只谈球风、绝不提外貌。";
const RETRY_EN =
  "\nYour previous attempt broke a rule. Rewrite: no forbidden words, on-pitch playing style only, never mention appearance.";

const SYSTEM_ZH = `为一款【无金钱、纯娱乐】足球应用写一句"看点短评"——要有梗、带感、像球迷在看台喊话，用一个生动比喻或适度夸张写他「怎么踢、看着多上头」。严格规则：
- 只写球风/踢法/看他踢球的爽点（速度、盘带、组织、终结、防守、领袖气质、灵气、想象力）。25-45 字中文。
- 绝对禁止评价或提及外貌/长相/颜值/身材/帅；只谈球场上的表现与影响力。
- 绝对禁止任何博彩/投注字眼（投注、下注、赌、博彩、赔率、庄家、盘口、彩票、竞彩、体彩、推荐、必赢、稳赢、稳赚）。
- 不写免责声明，最多 1 个 emoji，一句话，不加引号，别用套话陈词。`;

const SYSTEM_EN = `Write ONE punchy, witty "what to watch" line about a footballer for a free, fun (no real money) app. Make it vivid and shareable — terrace-chant energy, a fresh metaphor or playful exaggeration about HOW they play. Hard rules:
- ONLY on-pitch style / traits / why they're electric to watch (pace, dribbling, vision, finishing, defending, leadership, flair, imagination). 18-32 words of English.
- NEVER mention or rate appearance / looks / physique / how attractive they are. On-pitch only.
- NEVER use: odds, bet, betting, wager, stake, payout, multiplier, bookmaker, sportsbook, parlay, accumulator, acca, handicap, tipster, gamble, gambling, casino.
- No disclaimers, at most one emoji, one sentence, no quotation marks, no clichés.`;

type ChatFn = (system: string, user: string, timeoutMs?: number, model?: string) => Promise<string>;

async function safe(
  chatFn: ChatFn,
  system: string,
  retryNote: string,
  user: string,
  locale: "zh" | "en",
  model?: string
): Promise<string | null> {
  try {
    let body = (await chatFn(system, user, 15000, model)).trim();
    if (findBannedTerms(body, locale).length > 0) {
      body = (await chatFn(system + retryNote, user, 15000, model)).trim();
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
    `球员：${name}（${teamName}，位置 ${position || "未知"}）。写一句有梗带感的看点短评。`,
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
    `Player: ${name} (${teamName}, position ${position || "unknown"}). Write a witty one-line what-to-watch blurb.`,
    "en",
    EN_MODEL
  );
}
