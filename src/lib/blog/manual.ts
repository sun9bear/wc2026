// 手动「热点解读」生成编排：角度 + 素材清单 → 双语生成 → 解析 → 软闸 → marker 校验。
// 无 prob_delta 数据锚 → 无数字硬闸；靠提示词「只用素材/禁臆造」+ 软闸 + 人工预览兜底。
// 恒落 needs_review（手动文章一律人工发布，不自动发）。

import { localeHref } from "@/i18n";
import type { GenDeps, SoftVerdict } from "./generate";
import type { BlogAsset } from "./assets";
import { manualSystemPrompt, manualUserPrompt, buildManualSoftPrompt } from "./manualPrompts";

export interface ManualArticle {
  title: string;
  excerpt: string;
  body: string;
  keywords: string[];
  topicFlag: string | null;
}
export interface ManualInput {
  titleHint?: string;
  angle: string;
  locales: ("en" | "zh")[];
  assets: BlogAsset[];
}
export interface ManualLocaleDraft {
  article: ManualArticle | null;
  soft: SoftVerdict | null;
  markerOk: boolean;
  markerNote: string;
}
export interface ManualDraft {
  en: ManualLocaleDraft | null;
  zh: ManualLocaleDraft | null;
  status: "needs_review";
  reason: string;
  topicSensitive: boolean;
}

const KEYS = ["title", "excerpt", "body", "keywords", "topic_flag"] as const;

function parseArticle(raw: string): ManualArticle | null {
  const a = raw.indexOf("{");
  const b = raw.lastIndexOf("}");
  if (a === -1 || b <= a) return null;
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(raw.slice(a, b + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
  for (const k of KEYS) if (!(k in o)) return null;
  return {
    title: String(o.title ?? ""),
    excerpt: String(o.excerpt ?? ""),
    body: String(o.body ?? ""),
    keywords: Array.isArray(o.keywords) ? (o.keywords as unknown[]).map(String) : [],
    topicFlag: o.topic_flag == null ? null : String(o.topic_flag),
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

// 校验正文里 [[asset:N]]：1..m 每个恰好引用、无越界。
function checkMarkers(body: string, m: number): { ok: boolean; note: string } {
  const ns = [...body.matchAll(/\[\[asset:(\d+)\]\]/g)].map((x) => Number(x[1]));
  const outOfRange = [...new Set(ns.filter((n) => n < 1 || n > m))];
  const missing: number[] = [];
  for (let i = 1; i <= m; i++) if (!ns.includes(i)) missing.push(i);
  const ok = outOfRange.length === 0 && missing.length === 0;
  const note = ok
    ? ""
    : [outOfRange.length ? `越界 asset:${outOfRange.join(",")}` : "", missing.length ? `缺失 asset:${missing.join(",")}` : ""]
        .filter(Boolean)
        .join("; ");
  return { ok, note };
}

const genericLinks = (locale: "en" | "zh") => ({
  forecast: localeHref(locale, "/forecast"),
  calculator: localeHref(locale, "/calculator"),
  scorers: localeHref(locale, "/scorers"),
  popularity: localeHref(locale, "/popularity"),
});

function buildManualPayload(input: ManualInput, locale: "en" | "zh") {
  return {
    angle: input.angle,
    title_hint: input.titleHint ?? null,
    assets: input.assets.map((a, i) => ({ n: i + 1, type: a.type, desc: a.desc ?? "" })),
    links: genericLinks(locale),
  };
}

async function buildLocale(input: ManualInput, locale: "en" | "zh", deps: GenDeps): Promise<ManualLocaleDraft> {
  const payload = buildManualPayload(input, locale);
  let article: ManualArticle | null = null;
  try {
    article = parseArticle(await deps.generate(locale, manualSystemPrompt(locale), manualUserPrompt(payload)));
  } catch {
    article = null;
  }
  if (!article) return { article: null, soft: null, markerOk: false, markerNote: "生成/解析失败" };
  const { ok, note } = checkMarkers(article.body, input.assets.length);
  let soft: SoftVerdict | null = null;
  try {
    soft = parseSoft(await deps.review(locale, buildManualSoftPrompt(payload, article)));
  } catch {
    soft = null;
  }
  return { article, soft, markerOk: ok, markerNote: note };
}

/** 手动文章生成：双语（或单语）→ 解析 → 软闸 → marker 校验。恒 needs_review。 */
export async function generateManualDraft(input: ManualInput, deps: GenDeps): Promise<ManualDraft> {
  const want: ("en" | "zh")[] = input.locales.length ? input.locales : ["en", "zh"];
  const results = await Promise.all(want.map((l) => buildLocale(input, l, deps).then((d) => [l, d] as const)));
  const map = new Map<"en" | "zh", ManualLocaleDraft>(results);
  const en = map.get("en") ?? null;
  const zh = map.get("zh") ?? null;
  const topicSensitive = [en, zh].some((d) => d?.article?.topicFlag === "sensitive");
  const reasons: string[] = [];
  for (const [l, d] of results) {
    if (!d.article) reasons.push(`${l}:生成失败`);
    else if (!d.markerOk) reasons.push(`${l}:${d.markerNote}`);
    else if (d.soft && d.soft.verdict !== "usable") reasons.push(`${l} 软闸:${d.soft.verdict}`);
  }
  return { en, zh, status: "needs_review", reason: reasons.length ? reasons.join(" | ") : "manual_review", topicSensitive };
}
