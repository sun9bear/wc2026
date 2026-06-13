import { chat } from "./deepseek";
import { chat as geminiChat } from "./gemini";
import { findBannedTerms } from "../compliance/bannedTerms";

// 合规系统提示词（§9）：纯娱乐、中性措辞、禁止任何博彩/投注字眼与建议。
const PREVIEW_SYSTEM = `你是足球赛事的趣味解说员，为一款【无金钱、纯娱乐】的足球预测游戏撰写"赛前前瞻"。严格规则：
- 风格轻松、有梗，像虎扑/懂球帝的赛前氛围，80-140 字中文。
- 只写趣味看点与轻分析。绝对禁止出现：投注、下注、赌、博彩、赔率、庄家、盘口、彩票、竞彩、体彩、推荐、必赢、稳赢、稳赚 等字眼，也不得给出任何下注/投注建议或暗示。
- 涉及概率请用"倍率/预测/人气"等中性词。
- 不要写免责声明（系统会另行追加）。`;

const RECAP_SYSTEM = `你是足球赛事的趣味解说员，为一款【无金钱、纯娱乐】的足球预测游戏撰写"赛后小结"。严格规则与前瞻相同：轻松有梗、80-140 字中文；绝对禁止任何博彩/投注相关字眼与建议；用中性词；不要写免责声明。`;

const SENTIMENT_SYSTEM = `你是足球赛事的趣味解说员，为一款【无金钱、纯娱乐】的足球预测游戏撰写"冷热门看点"。严格规则：
- 轻松有梗、60-110 字中文，点评一下大家更看好谁、谁可能是潜在冷门。
- 绝对禁止出现：投注、下注、赌、博彩、赔率、庄家、盘口、彩票、竞彩、体彩、推荐、必赢、稳赢、稳赚 等字眼，也不得给出任何下注/投注建议或暗示。
- 用"人气、热门、冷门、倍率、预测"等中性词。不要写免责声明（系统会另行追加）。`;

async function safeGen(
  system: string,
  user: string,
  fallback: string,
  timeoutMs?: number
): Promise<string> {
  let body = await chat(system, user, timeoutMs);
  if (findBannedTerms(body, "zh").length > 0) {
    body = await chat(
      system + "\n注意：上次输出包含了违禁词，请务必彻底避免任何博彩/投注相关字眼。",
      user,
      timeoutMs
    );
  }
  // 仍不合规则用安全兜底文案（§9.1 护栏：公开输出必须过雷词 lint 才发布）
  if (findBannedTerms(body, "zh").length > 0) return fallback;
  return body;
}

export function generatePreview(home: string, away: string, stage: string): Promise<string> {
  return safeGen(
    PREVIEW_SYSTEM,
    `请为这场比赛写一段赛前趣味前瞻：${stage} ${home} vs ${away}。`,
    `${home} 对阵 ${away}，${stage}的一场焦点战，看点十足，快来做出你的趣味预测！`
  );
}

export function generateRecap(
  home: string,
  away: string,
  homeScore: number,
  awayScore: number,
  timeoutMs?: number
): Promise<string> {
  return safeGen(
    RECAP_SYSTEM,
    `请为这场已结束的比赛写一段赛后趣味小结，最终比分 ${home} ${homeScore}:${awayScore} ${away}。`,
    `${home} ${homeScore}:${awayScore} ${away}，一场精彩对决落下帷幕！`,
    timeoutMs
  );
}

// 冷热门解说：hot=人气最高(倍率最低)的预测短语，cold=人气最低(潜在冷门)的预测短语。
export function generateSentiment(
  home: string,
  away: string,
  hot: string,
  cold: string
): Promise<string> {
  return safeGen(
    SENTIMENT_SYSTEM,
    `这场 ${home} vs ${away} 中，目前人气最高（热门）的预测是「${hot}」，人气最低（潜在冷门）的是「${cold}」。请写一段趣味"冷热门看点"。`,
    `${home} vs ${away}：大家更看好「${hot}」，而「${cold}」或许是潜在惊喜，你怎么看？`
  );
}

// ---------------------------------------------------------------------------
// 英文管线（底层 Gemini Flash，2026-06-13 决策）：风格对标 r/soccer 评论区，
// 轻松带梗、80-120 词。合规红线与中文同级：fail-closed，违规先重试再兜底。
// 概率措辞只允许 chances / likely / favorite / dark horse / underdog story。
// ---------------------------------------------------------------------------

const EN_RULES = `Hard rules:
- NEVER use any of these words (or their plurals/variants): odds, bet, betting, wager, stake, payout, multiplier, bookmaker, sportsbook, parlay, accumulator, acca, handicap, tipster, gamble, gambling, casino.
- When talking about probability, use only: chances, likely, unlikely, crowd favorite, dark horse, underdog story.
- No disclaimers — the site appends its own.
- Output plain prose only: no markdown, no headings, no emoji spam (one emoji max).`;

const PREVIEW_SYSTEM_EN = `You write fun match previews for a free, points-only football prediction game (no real money). Voice: the witty banter of the r/soccer comment section — playful, meme-aware, a little irreverent, but informed. Length: 80-120 words of English.
${EN_RULES}`;

const RECAP_SYSTEM_EN = `You write fun post-match recaps for a free, points-only football prediction game (no real money). Voice: the witty banter of the r/soccer comment section — playful, meme-aware, a little irreverent. React to the scoreline like a fan would. Length: 80-120 words of English.
${EN_RULES}`;

const SENTIMENT_SYSTEM_EN = `You write a short "crowd favorite vs dark horse" blurb for a free, points-only football prediction game (no real money). Voice: r/soccer comment-section banter. Tease who the crowd is backing and what the spicy upset pick would be. Length: 60-100 words of English.
${EN_RULES}`;

async function safeGenEn(
  system: string,
  user: string,
  fallback: string,
  timeoutMs?: number
): Promise<string> {
  let body = await geminiChat(system, user, timeoutMs);
  if (findBannedTerms(body, "en").length > 0) {
    body = await geminiChat(
      system + "\nYour previous attempt contained a forbidden word. Rewrite and strictly avoid the entire forbidden list.",
      user,
      timeoutMs
    );
  }
  // 仍不合规则用安全兜底文案（与中文管线同级 fail-closed 护栏）
  if (findBannedTerms(body, "en").length > 0) return fallback;
  return body;
}

export function generatePreviewEn(home: string, away: string, stage: string): Promise<string> {
  return safeGenEn(
    PREVIEW_SYSTEM_EN,
    `Write a fun pre-match preview: ${stage}, ${home} vs ${away} at the 2026 World Cup.`,
    `${home} take on ${away} in the ${stage} — plenty of storylines, plenty of chances for chaos. Lock in your call!`
  );
}

export function generateRecapEn(
  home: string,
  away: string,
  homeScore: number,
  awayScore: number,
  timeoutMs?: number
): Promise<string> {
  return safeGenEn(
    RECAP_SYSTEM_EN,
    `Write a fun post-match recap. Final score: ${home} ${homeScore}-${awayScore} ${away} at the 2026 World Cup.`,
    `${home} ${homeScore}-${awayScore} ${away} — full time, and another chapter of World Cup drama in the books.`,
    timeoutMs
  );
}

export function generateSentimentEn(
  home: string,
  away: string,
  hot: string,
  cold: string
): Promise<string> {
  return safeGenEn(
    SENTIMENT_SYSTEM_EN,
    `${home} vs ${away}: the crowd favorite pick right now is "${hot}", while the least-picked (potential dark horse) is "${cold}". Write the crowd-favorite-vs-dark-horse blurb.`,
    `${home} vs ${away}: most players are backing "${hot}", while "${cold}" is the dark horse call. Which way are you leaning?`
  );
}
