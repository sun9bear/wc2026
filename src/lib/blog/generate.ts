// P3c 生成编排：候选 → (en/zh) 生成 → 解析 JSON → 硬闸 → 软闸(异 provider) → 路由 status。
// 双语同一 blog 实体：任一语种硬闸失败 / 题材 sensitive / 软闸不 usable → needs_review（隔离区）；
// 全清且 autoPublish 开 → published；灰度期 autoPublish 关，全清也先进 needs_review（见设计 §14 灰度）。
// LLM 依赖可注入（deps）：生产用 ./llm，测试注入 mock（见 scripts/probe-generate.ts）。

import { buildInputPayload, type BlogCandidate } from "./scoreCandidate";
import { systemPrompt, userPrompt, ARTICLE_KEYS } from "./prompts";
import { hardGate, buildSoftGatePrompt, type GenArticle, type GatePayload, type HardGateResult } from "./gates";

export interface SoftVerdict {
  verdict: "usable" | "needs_fix" | "reject";
  confidence: number;
  notes: string;
}

export interface LocaleDraft {
  locale: "en" | "zh";
  payload: ReturnType<typeof buildInputPayload>;
  article: GenArticle | null;
  parseError: string | null;
  hard: HardGateResult | null;
  soft: SoftVerdict | null;
  repaired: boolean; // 是否经过 1-shot 定向修复
}

export interface BlogDraft {
  matchId: string;
  eventType: string;
  topicSensitive: boolean;
  en: LocaleDraft;
  zh: LocaleDraft;
  status: "published" | "needs_review" | "rejected";
  statusReason: string;
}

export interface GenDeps {
  generate: (locale: "en" | "zh", system: string, user: string) => Promise<string>;
  review: (locale: "en" | "zh", prompt: string) => Promise<string>;
}

const SOFT_MIN_CONF = 0.6;

/** 从模型原始输出里抠出 JSON（取首尾花括号，容忍 ```json 围栏）并校验五键。 */
function parseArticle(raw: string): { article: GenArticle | null; error: string | null } {
  const a = raw.indexOf("{");
  const b = raw.lastIndexOf("}");
  if (a === -1 || b === -1 || b <= a) return { article: null, error: "no json object" };
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(raw.slice(a, b + 1)) as Record<string, unknown>;
  } catch (e) {
    return { article: null, error: "json parse: " + (e as Error).message };
  }
  for (const k of ARTICLE_KEYS) if (!(k in o)) return { article: null, error: `missing key ${k}` };
  const kw = Array.isArray(o.keywords) ? (o.keywords as unknown[]).map(String) : [];
  const tf = o.topic_flag;
  return {
    article: {
      title: String(o.title ?? ""),
      excerpt: String(o.excerpt ?? ""),
      body: String(o.body ?? ""),
      keywords: kw,
      topic_flag: tf == null ? null : String(tf),
    },
    error: null,
  };
}

function parseSoft(raw: string): SoftVerdict | null {
  const a = raw.indexOf("{");
  const b = raw.lastIndexOf("}");
  if (a === -1 || b <= a) return null;
  try {
    const o = JSON.parse(raw.slice(a, b + 1)) as Record<string, unknown>;
    const v = String(o.verdict ?? "needs_fix");
    return {
      verdict: v === "usable" || v === "reject" ? v : "needs_fix",
      confidence: Number(o.confidence ?? 0),
      notes: String(o.notes ?? ""),
    };
  } catch {
    return null;
  }
}

// 机械型硬闸失败（可定向修复）：仅数字/博彩词/外链；format/parse 不修（那是重生成范畴）。
const MECHANICAL = new Set(["numbers", "banned", "external_link"]);
function isMechanical(reasons: string[]): boolean {
  return reasons.length > 0 && reasons.every((r) => MECHANICAL.has(r));
}

/** 定向修复 prompt：列出确切违规，只修这些、不引入新数字/事实。 */
function repairPrompt(payload: unknown, article: GenArticle, hard: HardGateResult): string {
  const issues: string[] = [];
  if (hard.offendingNumbers.length)
    issues.push(
      `- These numbers are NOT allowed; remove them or restate using ONLY the formats in INPUT (whole-percent strings / "<1%" / words), introducing NO new numbers: ${hard.offendingNumbers.join(", ")}`
    );
  if (hard.bannedTerms.length) issues.push(`- Remove these betting terms from BOTH body and keywords: ${hard.bannedTerms.join(", ")}`);
  if (hard.reasons.includes("external_link")) issues.push(`- The body may use internal relative links only; remove any http(s):// link.`);
  return `Your previous draft broke hard rules. Fix ONLY the issues below, keep everything else unchanged, introduce NO new numbers or facts, and return the corrected full JSON (same five keys title/excerpt/body/keywords/topic_flag):
${issues.join("\n")}

INPUT (the only source of numbers and facts — do not exceed it):
\`\`\`json
${JSON.stringify(payload)}
\`\`\`
Your previous draft:
\`\`\`json
${JSON.stringify(article)}
\`\`\``;
}

async function buildLocaleDraft(cand: BlogCandidate, locale: "en" | "zh", deps: GenDeps): Promise<LocaleDraft> {
  const payload = buildInputPayload(cand, locale);
  let raw: string;
  try {
    raw = await deps.generate(locale, systemPrompt(locale), userPrompt(payload));
  } catch (e) {
    return { locale, payload, article: null, parseError: "generate failed: " + (e as Error).message, hard: null, soft: null, repaired: false };
  }
  const parsed = parseArticle(raw);
  let article = parsed.article;
  if (!article) return { locale, payload, article: null, parseError: parsed.error, hard: null, soft: null, repaired: false };
  let hard = hardGate(article, payload as unknown as GatePayload);

  // 1-shot 定向修复：仅机械型失败，re-gate 校验，封顶 1 次（修坏了也只是回 needs_review）。
  let repaired = false;
  if (!hard.pass && isMechanical(hard.reasons)) {
    try {
      const fixedParsed = parseArticle(await deps.generate(locale, systemPrompt(locale), repairPrompt(payload, article, hard)));
      if (fixedParsed.article) {
        repaired = true;
        article = fixedParsed.article;
        hard = hardGate(article, payload as unknown as GatePayload);
      }
    } catch {
      /* 修复调用失败 → 保留原稿与原 hard，落 needs_review */
    }
  }

  let soft: SoftVerdict | null = null;
  if (hard.pass) {
    try {
      soft = parseSoft(await deps.review(locale, buildSoftGatePrompt(payload, article)));
    } catch {
      soft = null; // 审核调用失败 → 视为不可自动发（下面 softBad 命中）
    }
  }
  return { locale, payload, article, parseError: null, hard, soft, repaired };
}

/** 候选 → BlogDraft（含两语稿 + 闸结果 + 路由 status）。autoPublish 默认 false（灰度：全清也先 needs_review）。 */
export async function generateForCandidate(
  cand: BlogCandidate,
  deps: GenDeps,
  opts: { autoPublish?: boolean } = {}
): Promise<BlogDraft> {
  const [en, zh] = await Promise.all([buildLocaleDraft(cand, "en", deps), buildLocaleDraft(cand, "zh", deps)]);
  const topicSensitive = en.article?.topic_flag === "sensitive" || zh.article?.topic_flag === "sensitive";
  const hardFail = !en.article || !zh.article || !en.hard?.pass || !zh.hard?.pass;
  const softBad = [en.soft, zh.soft].some((s) => !s || s.verdict !== "usable" || s.confidence < SOFT_MIN_CONF);

  let status: BlogDraft["status"];
  let statusReason: string;
  if (hardFail) {
    status = "needs_review";
    statusReason = "hard_gate " + JSON.stringify({ en: en.hard?.reasons ?? en.parseError, zh: zh.hard?.reasons ?? zh.parseError });
  } else if (topicSensitive) {
    status = "needs_review";
    statusReason = "sensitive_topic";
  } else if (softBad) {
    status = "needs_review";
    statusReason = "soft_gate";
  } else {
    status = opts.autoPublish ? "published" : "needs_review";
    statusReason = opts.autoPublish ? "auto" : "gray_rollout";
  }
  return { matchId: cand.matchId, eventType: cand.eventType, topicSensitive, en, zh, status, statusReason };
}
