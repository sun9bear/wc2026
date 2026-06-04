import { chat } from "./deepseek";
import { findBannedTerms } from "../compliance/bannedTerms";

// 合规系统提示词（§9）：纯娱乐、中性措辞、禁止任何博彩/投注字眼与建议。
const PREVIEW_SYSTEM = `你是足球赛事的趣味解说员，为一款【无金钱、纯娱乐】的足球预测游戏撰写"赛前前瞻"。严格规则：
- 风格轻松、有梗，像虎扑/懂球帝的赛前氛围，80-140 字中文。
- 只写趣味看点与轻分析。绝对禁止出现：投注、下注、赌、博彩、赔率、庄家、盘口、彩票、竞彩、体彩、推荐、必赢、稳赢、稳赚 等字眼，也不得给出任何下注/投注建议或暗示。
- 涉及概率请用"倍率/预测/人气"等中性词。
- 不要写免责声明（系统会另行追加）。`;

const RECAP_SYSTEM = `你是足球赛事的趣味解说员，为一款【无金钱、纯娱乐】的足球预测游戏撰写"赛后小结"。严格规则与前瞻相同：轻松有梗、80-140 字中文；绝对禁止任何博彩/投注相关字眼与建议；用中性词；不要写免责声明。`;

async function safeGen(system: string, user: string, fallback: string): Promise<string> {
  let body = await chat(system, user);
  if (findBannedTerms(body, "zh").length > 0) {
    body = await chat(
      system + "\n注意：上次输出包含了违禁词，请务必彻底避免任何博彩/投注相关字眼。",
      user
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
  awayScore: number
): Promise<string> {
  return safeGen(
    RECAP_SYSTEM,
    `请为这场已结束的比赛写一段赛后趣味小结，最终比分 ${home} ${homeScore}:${awayScore} ${away}。`,
    `${home} ${homeScore}:${awayScore} ${away}，一场精彩对决落下帷幕！`
  );
}
