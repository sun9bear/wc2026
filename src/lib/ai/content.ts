import { chat } from "./deepseek";
import { chat as geminiChat } from "./gemini";
import { findBannedTerms } from "../compliance/bannedTerms";

// 模型胜平负概率（0-1）。用于把"谁是热门/冷门 + 强弱幅度"准确喂给 AI，
// 避免 AI 凭空臆测、把劣势方写成热门（修复 2026-06：前瞻/冷热门与真实概率脱节）。
export interface Win1x2 {
  home: number;
  draw: number;
  away: number;
}

// 把模型概率转成"实力基调"（中文，定性不报数字）：仅供 AI 把握强弱方向与幅度，
// 避免把下风方写成热门；不要求、也不鼓励在正文中引用具体百分比（行文自然为先）。
function probContextZh(home: string, away: string, p: Win1x2): string {
  const ph = Math.round(p.home * 100);
  const pa = Math.round(p.away * 100);
  const favHome = p.home >= p.away;
  const fav = favHome ? home : away;
  const und = favHome ? away : home;
  const favP = Math.max(ph, pa);
  const margin = Math.abs(ph - pa);
  const mag =
    favP >= 55 || margin >= 28
      ? `${fav}是明显大热门，${und}处于明显下风（${und}若取胜即属冷门）`
      : favP >= 45 || margin >= 10
        ? `${fav}略占上风，${und}有一搏之力`
        : `双方实力接近、势均力敌`;
  return `【实力基调·仅供你把握强弱方向，请勿在正文中报出具体概率或百分比】${mag}。据此自然行文即可，只需确保倾向与此一致、不出现与之矛盾的明显错误（例如把下风一方说成热门）。`;
}

// 英文版实力基调（定性不报数字）。
function probContextEn(home: string, away: string, p: Win1x2): string {
  const ph = Math.round(p.home * 100);
  const pa = Math.round(p.away * 100);
  const favHome = p.home >= p.away;
  const fav = favHome ? home : away;
  const und = favHome ? away : home;
  const favP = Math.max(ph, pa);
  const margin = Math.abs(ph - pa);
  const mag =
    favP >= 55 || margin >= 28
      ? `${fav} are clear favorites and ${und} are clear underdogs (a ${und} win would be an upset)`
      : favP >= 45 || margin >= 10
        ? `${fav} are slight favorites; ${und} can cause trouble`
        : `the two sides are evenly matched`;
  return `[Strength read · to calibrate tone only — do NOT quote any percentages or numbers in your text] ${mag}. Write naturally and keep your lean consistent with this, with no contradictions (never frame the underdog as the favorite).`;
}

// 合规系统提示词（§9）：纯娱乐、中性措辞、禁止任何博彩/投注字眼与建议。
const PREVIEW_SYSTEM = `你是足球赛事的趣味解说员，为一款【无金钱、纯娱乐】的足球预测游戏撰写"赛前前瞻"。严格规则：
- 风格轻松、有梗，像虎扑/懂球帝的赛前氛围，80-140 字中文。
- 只写趣味看点与轻分析。绝对禁止出现：投注、下注、赌、博彩、赔率、庄家、盘口、彩票、竞彩、体彩、推荐、必赢、稳赢、稳赚 等字眼，也不得给出任何下注/投注建议或暗示。
- 涉及概率请用"倍率/预测/人气"等中性词。
- 若提供了【实力基调】，前瞻的倾向性必须与之一致，绝不能把下风一方写成热门或大众更看好的一方；这只是你的判断依据，无需在正文中引用具体概率或百分比数字，自然行文即可。
- 不要写免责声明（系统会另行追加）。`;

const RECAP_SYSTEM = `你是足球赛事的趣味解说员，为一款【无金钱、纯娱乐】的足球预测游戏撰写"赛后小结"。严格规则与前瞻相同：轻松有梗、80-140 字中文；绝对禁止任何博彩/投注相关字眼与建议；用中性词；不要写免责声明。`;

const SENTIMENT_SYSTEM = `你是足球赛事的趣味解说员，为一款【无金钱、纯娱乐】的足球预测游戏撰写"冷热门看点"。严格规则：
- 轻松有梗、60-110 字中文，点评一下大家更看好谁、谁可能是潜在冷门。
- 绝对禁止出现：投注、下注、赌、博彩、赔率、庄家、盘口、彩票、竞彩、体彩、推荐、必赢、稳赢、稳赚 等字眼，也不得给出任何下注/投注建议或暗示。
- 若提供了【实力基调】，热门/冷门判断必须与之一致（更被看好的一方是热门，明显下风的一方才是潜在冷门），绝不能说反；这是判断依据，无需在正文中报出具体概率数字。
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

export function generatePreview(
  home: string,
  away: string,
  stage: string,
  probs?: Win1x2
): Promise<string> {
  const ctx = probs ? `\n${probContextZh(home, away, probs)}` : "";
  return safeGen(
    PREVIEW_SYSTEM,
    `请为这场比赛写一段赛前趣味前瞻：${stage} ${home} vs ${away}。${ctx}`,
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

// 冷热门解说：以【模型概率】为锚，概率高者为热门、概率明显低者为潜在冷门。
// 之前依赖社区倍率（生成时常为默认值→热门冷门判反），改用模型概率从一开始就正确。
export function generateSentiment(home: string, away: string, probs: Win1x2): Promise<string> {
  const favHome = probs.home >= probs.away;
  const fav = favHome ? home : away;
  const und = favHome ? away : home;
  return safeGen(
    SENTIMENT_SYSTEM,
    `这场 ${home} vs ${away}。${probContextZh(home, away, probs)} 请据此写一段趣味"冷热门看点"：点出谁是热门、谁是潜在冷门，倾向与上面的概率一致。`,
    `${home} vs ${away}：大家更看好「${fav}」，而「${und}」或许是潜在冷门，你怎么看？`
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
${EN_RULES}
- If a [Strength read] is provided, your lean MUST match it; never frame the underdog as the favorite. It is only your reference — do not quote any percentages or numbers; write naturally.`;

const RECAP_SYSTEM_EN = `You write fun post-match recaps for a free, points-only football prediction game (no real money). Voice: the witty banter of the r/soccer comment section — playful, meme-aware, a little irreverent. React to the scoreline like a fan would. Length: 80-120 words of English.
${EN_RULES}`;

const SENTIMENT_SYSTEM_EN = `You write a short "crowd favorite vs dark horse" blurb for a free, points-only football prediction game (no real money). Voice: r/soccer comment-section banter. Tease who the crowd is backing and what the spicy upset pick would be. Length: 60-100 words of English.
${EN_RULES}
- If a [Strength read] is provided, the favorite/dark-horse call MUST match it (the more-favored side is the favorite, the clear underdog is the dark horse), never swapped — but do not quote specific numbers.`;

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

export function generatePreviewEn(
  home: string,
  away: string,
  stage: string,
  probs?: Win1x2
): Promise<string> {
  const ctx = probs ? `\n${probContextEn(home, away, probs)}` : "";
  return safeGenEn(
    PREVIEW_SYSTEM_EN,
    `Write a fun pre-match preview: ${stage}, ${home} vs ${away} at the 2026 World Cup.${ctx}`,
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

export function generateSentimentEn(home: string, away: string, probs: Win1x2): Promise<string> {
  const favHome = probs.home >= probs.away;
  const fav = favHome ? home : away;
  const und = favHome ? away : home;
  return safeGenEn(
    SENTIMENT_SYSTEM_EN,
    `${home} vs ${away}. ${probContextEn(home, away, probs)} Write the crowd-favorite-vs-dark-horse blurb, consistent with those chances.`,
    `${home} vs ${away}: most are backing ${fav}, while ${und} are the dark-horse call. Which way are you leaning?`
  );
}
