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
  linkOk: boolean; // 正文是否含站内链接 [文字](/路径)
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
  generate: (locale: "en" | "zh", system: string, user: string, images?: { label: string; url: string }[]) => Promise<string>;
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

/** 软闸 needs_fix 重写 prompt：按审核反馈改文笔/结构，数字与上稿完全一致（不破硬闸），不超 INPUT。 */
function softRepairPrompt(payload: unknown, article: GenArticle, soft: SoftVerdict): string {
  return `A reviewer found your previous draft factually fine but flagged quality issues. Revise to address the feedback below. Keep ALL numbers EXACTLY as in your previous draft, introduce NO new numbers or facts beyond INPUT, and return the corrected full JSON (same five keys title/excerpt/body/keywords/topic_flag).
Reviewer feedback: ${soft.notes || "Improve clarity, flow and headline; remove redundancy and awkward phrasing."}

INPUT (the only source of numbers and facts — do not exceed it):
\`\`\`json
${JSON.stringify(payload)}
\`\`\`
Your previous draft:
\`\`\`json
${JSON.stringify(article)}
\`\`\``;
}

/** 正文是否含站内链接 [文字](/路径)（markdown 内链的签名）。 */
function hasInternalLink(body: string): boolean {
  return body.includes("](/");
}

/** 缺站内链接重写 prompt：只补 1-2 个 INPUT.links 里的站内链接，其余（尤其数字/事实）原样不动。 */
function linkRepairPrompt(payload: unknown, article: GenArticle): string {
  return `Your previous draft is good but is MISSING the required internal links. Add 1-2 relevant internal links near the end of the body using markdown [text](/path), with paths taken ONLY from INPUT.links (relative internal paths, never external URLs). Keep everything else — especially ALL numbers and facts — exactly the same. Return the corrected full JSON (same five keys title/excerpt/body/keywords/topic_flag).

INPUT (use paths from INPUT.links):
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

  // 生成→解析（一次尝试）。
  const genParse = async (user: string): Promise<{ article: GenArticle | null; error: string | null }> => {
    try {
      return parseArticle(await deps.generate(locale, systemPrompt(locale), user));
    } catch (e) {
      return { article: null, error: "generate failed: " + (e as Error).message };
    }
  };
  // 评估：硬闸；过则跑软闸（异 provider）。
  const evaluate = async (a: GenArticle): Promise<{ hard: HardGateResult; soft: SoftVerdict | null }> => {
    const h = hardGate(a, payload as unknown as GatePayload);
    let s: SoftVerdict | null = null;
    if (h.pass) {
      try {
        s = parseSoft(await deps.review(locale, buildSoftGatePrompt(payload, a)));
      } catch {
        s = null; // 审核调用失败 → 视为不可自动发（softBad 命中）
      }
    }
    return { hard: h, soft: s };
  };

  // 初次生成 + 评估。
  const first = await genParse(userPrompt(payload));
  let article = first.article;
  let parseError = article ? null : first.error;
  let hard: HardGateResult | null = null;
  let soft: SoftVerdict | null = null;
  if (article) ({ hard, soft } = await evaluate(article));

  // 大模型重写（封顶 1 次/语种，重写后必须再过双闸才发；软闸 reject / 题材 sensitive 不重写 → 直接人工）：
  //  · 无 article（parse 失败/没吐 JSON）→ 重新生成
  //  · 机械型硬闸失败（数字/博彩词/外链）→ 定向修复
  //  · 硬闸过但软闸 needs_fix（质量问题）→ 带审核反馈重写
  let repairUser: string | null = null;
  if (!article) repairUser = userPrompt(payload);
  else if (hard && !hard.pass && isMechanical(hard.reasons)) repairUser = repairPrompt(payload, article, hard);
  else if (hard && hard.pass && soft && soft.verdict === "needs_fix") repairUser = softRepairPrompt(payload, article, soft);
  // 硬+软都过但缺站内链接 → 定向补链（提示词要求 1-2 个内链，zh 偶发漏；en 100% 有）。
  else if (hard && hard.pass && soft?.verdict === "usable" && !hasInternalLink(article.body)) repairUser = linkRepairPrompt(payload, article);

  let repaired = false;
  if (repairUser) {
    const r2 = await genParse(repairUser);
    if (r2.article) {
      repaired = true;
      article = r2.article;
      parseError = null;
      ({ hard, soft } = await evaluate(article));
    }
    // r2 仍无有效 article → 保留首轮失败状态（article 可能仍 null → needs_review）
  }

  const linkOk = !!article && hasInternalLink(article.body);
  return { locale, payload, article, parseError, hard, soft, repaired, linkOk };
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
  // 任一语种正文缺站内链接（重写后仍缺）→ 不自动发，留人工（强制内链）。
  const linkMissing = (!!en.article && !en.linkOk) || (!!zh.article && !zh.linkOk);

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
  } else if (linkMissing) {
    status = "needs_review";
    statusReason = "no_internal_link";
  } else {
    status = opts.autoPublish ? "published" : "needs_review";
    statusReason = opts.autoPublish ? "auto" : "gray_rollout";
  }
  return { matchId: cand.matchId, eventType: cand.eventType, topicSensitive, en, zh, status, statusReason };
}
