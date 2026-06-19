// P3 确定性硬闸（纯逻辑，无 LLM）：数字对账 + 博彩词 + 无外链 + 格式。任一不过 → 打回。
// 数字对账是头号防线：正文/标题/keywords 的每个数字必须可由 payload 派生
// （整数百分比 + 其精确差 + 补数 + 比分数字 + stage 数字；禁小数）。见 BLOG-PROMPTS §2/§8。

import { findBannedTerms } from "@/lib/compliance/bannedTerms";

export interface GenArticle {
  title: string;
  excerpt: string;
  body: string;
  keywords: string[];
  topic_flag: string | null;
}

export interface GatePayload {
  match: { score: string | null; stage: string | null };
  prob_delta: {
    match_1x2: { before: { home: number; draw: number; away: number } | null } | null;
    teams: {
      pAdvance: { before: number | null; after: number | null };
      pChampion: { before: number | null; after: number | null };
    }[];
  } | null;
}

export interface HardGateResult {
  pass: boolean;
  reasons: string[]; // 失败原因码：format|numbers|banned|external_link
  offendingNumbers: string[]; // 不在允许集合的数字片段
  bannedTerms: string[]; // 命中的博彩词
}

interface Allowed {
  percents: Set<number>;
  diffs: Set<number>;
  bare: Set<number>; // 允许的裸整数（percents ∪ diffs ∪ score 数字 ∪ stage 数字）
  scorelines: Set<string>; // "2-1" / "1-2"
}

function addNeighborhood(v: number | null | undefined, set: Set<number>): void {
  if (v == null || !Number.isFinite(v)) return;
  const x = v * 100;
  set.add(Math.round(x));
  set.add(Math.floor(x));
  set.add(Math.ceil(x));
}

function deriveAllowed(p: GatePayload): Allowed {
  const percents = new Set<number>();
  const diffs = new Set<number>();
  const scorelines = new Set<string>();
  const pd = p.prob_delta;
  if (pd?.match_1x2?.before) {
    addNeighborhood(pd.match_1x2.before.home, percents);
    addNeighborhood(pd.match_1x2.before.draw, percents);
    addNeighborhood(pd.match_1x2.before.away, percents);
  }
  for (const t of pd?.teams ?? []) {
    for (const pair of [t.pAdvance, t.pChampion]) {
      addNeighborhood(pair.before, percents);
      addNeighborhood(pair.after, percents);
      if (pair.before != null && pair.after != null) {
        const d = Math.abs(pair.after - pair.before) * 100;
        diffs.add(Math.round(d));
        diffs.add(Math.floor(d));
        diffs.add(Math.ceil(d));
      }
    }
  }
  for (const v of [...percents]) percents.add(100 - v); // 补数
  const scoreDigits = new Set<number>();
  if (p.match.score) {
    const mm = p.match.score.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (mm) {
      scoreDigits.add(Number(mm[1]));
      scoreDigits.add(Number(mm[2]));
      scorelines.add(`${mm[1]}-${mm[2]}`);
      scorelines.add(`${mm[2]}-${mm[1]}`);
    }
  }
  const stageDigits = new Set<number>();
  for (const m of (p.match.stage ?? "").matchAll(/\d+/g)) stageDigits.add(Number(m[0]));
  // 锦标赛年份 2026 是 "World Cup 2026" 这类品牌/搜索词的固有数字，恒允许（否则几乎每篇都因 keywords 被误拒）。
  const bare = new Set<number>([2026, ...percents, ...diffs, ...scoreDigits, ...stageDigits]);
  return { percents, diffs, bare, scorelines };
}

const PP = /(\d+)\s*(?:percentage points?|pp|个百分点)/gi;

function checkNumbers(article: GenArticle, allowed: Allowed): string[] {
  const offending: string[] = [];
  let text = [article.title, article.excerpt, article.body, article.keywords.join(" ")].join("  ");
  text = text.replace(/\]\([^)]*\)/g, "]"); // 去 markdown 链接 URL（含 /match/<uuid> 等数字）
  // 0 小数：一律禁（整数百分比规则）
  for (const m of text.matchAll(/\d+\.\d+/g)) offending.push(m[0]);
  text = text.replace(/\d+\.\d+/g, " ");
  // 1 比分
  text = text.replace(/(\d+)\s*[-–]\s*(\d+)/g, (full, a, b) => {
    if (!allowed.scorelines.has(`${a}-${b}`)) offending.push(full.trim());
    return " ";
  });
  // 2 百分点变化
  text = text.replace(PP, (full, n) => {
    if (!allowed.diffs.has(Number(n))) offending.push(full.trim());
    return " ";
  });
  // 3 百分比
  text = text.replace(/(\d+)\s*%/g, (full, n) => {
    if (!allowed.percents.has(Number(n))) offending.push(full.trim());
    return " ";
  });
  // 4 剩余裸整数
  for (const m of text.matchAll(/\d+/g)) {
    if (!allowed.bare.has(Number(m[0]))) offending.push(m[0]);
  }
  return [...new Set(offending)];
}

/** 确定性硬闸：数字对账 + 博彩词 + 无外链 + 基本格式。 */
export function hardGate(article: GenArticle, payload: GatePayload): HardGateResult {
  const reasons: string[] = [];
  if (!article.title?.trim() || !article.excerpt?.trim() || !article.body?.trim() || !Array.isArray(article.keywords)) {
    reasons.push("format");
  }
  const offendingNumbers = checkNumbers(article, deriveAllowed(payload));
  if (offendingNumbers.length) reasons.push("numbers");
  const allText = [article.title, article.excerpt, article.body, article.keywords.join(" ")].join("  ");
  const bannedTerms = [...new Set([...findBannedTerms(allText, "en"), ...findBannedTerms(allText, "zh")])];
  if (bannedTerms.length) reasons.push("banned");
  if (/\bhttps?:\/\//i.test(article.body)) reasons.push("external_link");
  return { pass: reasons.length === 0, reasons, offendingNumbers, bannedTerms };
}

/** 软闸（LLM，异于生成器）的审核提示词——P3c 生成编排调用。 */
export function buildSoftGatePrompt(payload: unknown, article: GenArticle): string {
  return `You are an adversarial reviewer for an automated football-commentary publishing gate. Given the INPUT the article was generated from and the ARTICLE, be strict. Return ONLY JSON {"verdict":"usable"|"needs_fix"|"reject","confidence":0-1,"flagged_spans":[],"notes":""}.
- unsupported_claims: any fact NOT in INPUT (goalscorer, who took/converted a penalty, minute, record, history, quote, lineup)?
- defamation/insult of a real person?
- topic_flag should be "sensitive" if INPUT involves refereeing / red card / discipline / injury / politics — is it set correctly?
- tone witty but not cruel?
verdict = reject if unsupported_claims or defamation; needs_fix if topic_flag wrong or tone off; else usable.

INPUT:
\`\`\`json
${JSON.stringify(payload)}
\`\`\`
ARTICLE:
\`\`\`json
${JSON.stringify(article)}
\`\`\``;
}
