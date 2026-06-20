// P6 blog 管理后台数据/鉴权层：service_role 读写（绕 RLS）+ token 鉴权。
// 仅服务端使用（/admin/blog 页 + /api/admin/blog 路由）。口令 = ADMIN_TOKEN，回落 CRON_SECRET（已配，开箱即用）。

import "server-only";
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";
import { getServerSupabase } from "@/lib/supabase/server";
import { getMatchProbDelta, classifyProbDelta } from "@/lib/blog/getProbDelta";
import { buildSettledCandidate } from "@/lib/blog/scoreCandidate";
import { generateForCandidate } from "@/lib/blog/generate";
import * as llm from "@/lib/blog/llm";
import { upsertBlogEntry, upsertManualEntry } from "@/lib/blog/store";
import { generateManualDraft, type ManualInput } from "@/lib/blog/manual";
import { slugify, ensureUniqueSlug } from "@/lib/blog/slug";

export const ADMIN_COOKIE = "wc_admin";
export const ADMIN_STATUSES = ["draft", "needs_review", "published", "hidden", "rejected"] as const;
export type AdminStatus = (typeof ADMIN_STATUSES)[number];

/** 管理口令：优先 ADMIN_TOKEN，回落 CRON_SECRET。未配置（或太短）→ null（后台禁用）。 */
export function adminSecret(): string | null {
  const s = (process.env.ADMIN_TOKEN || process.env.CRON_SECRET || "").trim();
  return s.length >= 8 ? s : null;
}

/** 时序安全比较：先 SHA-256 定长摘要再 timingSafeEqual，避免长度泄漏与时序侧信道。 */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** cookie 是否等于口令（鉴权判定）。 */
export async function isAuthed(): Promise<boolean> {
  const secret = adminSecret();
  if (!secret) return false;
  const c = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!c && safeEqual(c, secret);
}

export interface AdminEntry {
  slug: string;
  status: string;
  eventType: string | null;
  titleEn: string | null;
  titleZh: string | null;
  matchId: string | null;
  reason: string | null;
  hardEn: string[] | null;
  hardZh: string[] | null;
  publishedAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
}

interface AdminRow {
  slug_en: string;
  status: string;
  event_type: string | null;
  title_en: string | null;
  title_zh: string | null;
  match_id: string | null;
  review: { reason?: string; en?: { hard?: string[] | null }; zh?: { hard?: string[] | null } } | null;
  published_at: string | null;
  updated_at: string | null;
  created_at: string | null;
}

/** 列出全部条目（含未发布；service_role 绕 RLS，按创建时间倒序）。 */
export async function listAllBlog(limit = 200): Promise<AdminEntry[]> {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("blog_entries")
    .select("slug_en, status, event_type, title_en, title_zh, match_id, review, published_at, updated_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data as AdminRow[] | null) ?? []).map((r) => ({
    slug: r.slug_en,
    status: r.status,
    eventType: r.event_type,
    titleEn: r.title_en,
    titleZh: r.title_zh,
    matchId: r.match_id,
    reason: r.review?.reason ?? null,
    hardEn: r.review?.en?.hard ?? null,
    hardZh: r.review?.zh?.hard ?? null,
    publishedAt: r.published_at,
    updatedAt: r.updated_at,
    createdAt: r.created_at,
  }));
}

/** 批量改状态（published 时盖 published_at）。返回受影响行数。 */
export async function setStatus(slugs: string[], status: AdminStatus): Promise<number> {
  if (!slugs.length) return 0;
  const db = getServerSupabase();
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = { status, updated_at: nowIso };
  if (status === "published") patch.published_at = nowIso;
  const { data, error } = await db.from("blog_entries").update(patch).in("slug_en", slugs).select("slug_en");
  if (error) throw new Error(error.message);
  return (data as unknown[] | null)?.length ?? 0;
}

/** 批量删除。返回受影响行数。 */
export async function deleteEntries(slugs: string[]): Promise<number> {
  if (!slugs.length) return 0;
  const db = getServerSupabase();
  const { data, error } = await db.from("blog_entries").delete().in("slug_en", slugs).select("slug_en");
  if (error) throw new Error(error.message);
  return (data as unknown[] | null)?.length ?? 0;
}

/**
 * 重新生成单篇（"返回发给模型修改"）：按 slug 取 match_id → 复用生成管线（双语+双闸+内链强制）→ upsert 覆盖。
 * status 按 BLOG_AUTO_PUBLISH：干净→published、有问题→needs_review。慢操作（LLM，~30s），同步等待。
 * 注：已结算场次分类稳定（比分/快照已冻结）→ slug 不变、原样覆盖。
 */
export async function regenerateBySlug(slug: string): Promise<{ ok: boolean; status?: string; error?: string }> {
  const db = getServerSupabase();
  const { data } = await db.from("blog_entries").select("match_id").eq("slug_en", slug).maybeSingle();
  const matchId = (data as { match_id: string | null } | null)?.match_id;
  if (!matchId) return { ok: false, error: "该文章无 match_id，无法重生" };
  const delta = await getMatchProbDelta(matchId);
  if (!delta) return { ok: false, error: "拿不到 prob_delta" };
  const cand = buildSettledCandidate(delta, classifyProbDelta(delta), null);
  if (!cand) return { ok: false, error: "无法构建候选（事件已不满足材料闸）" };
  const autoPublish = process.env.BLOG_AUTO_PUBLISH?.trim() === "1";
  const draft = await generateForCandidate(cand, llm, { autoPublish });
  const { error } = await upsertBlogEntry(cand, draft, new Date().toISOString());
  if (error) return { ok: false, error };
  return { ok: true, status: draft.status };
}

/**
 * 手动「热点解读」撰写：角度 + 素材 → 双语生成（manual generator）→ en 标题 slugify 去重 → 落 needs_review 草稿。
 * 慢操作（LLM，~30-60s 同步）。返回 slug + reason（供后台预览/发布）。
 */
export async function composeManual(input: ManualInput): Promise<{ ok: boolean; slug?: string; reason?: string; error?: string }> {
  if (!input.angle?.trim()) return { ok: false, error: "缺角度" };
  const draft = await generateManualDraft(input, llm);
  const en = draft.en?.article;
  const zh = draft.zh?.article;
  if (!en && !zh) return { ok: false, error: "生成失败: " + draft.reason };
  const db = getServerSupabase();
  const { data } = await db.from("blog_entries").select("slug_en");
  const taken = new Set(((data as { slug_en: string }[] | null) ?? []).map((r) => r.slug_en));
  const base = slugify(en?.title || zh?.title || input.titleHint || "post");
  const slug = ensureUniqueSlug(base, taken);
  const r = await upsertManualEntry({
    slug,
    titleEn: en?.title ?? null,
    titleZh: zh?.title ?? null,
    excerptEn: en?.excerpt ?? null,
    excerptZh: zh?.excerpt ?? null,
    bodyEn: en?.body ?? null,
    bodyZh: zh?.body ?? null,
    assets: input.assets,
    topicSensitive: draft.topicSensitive,
    review: {
      reason: draft.reason,
      en: draft.en ? { soft: draft.en.soft, markerOk: draft.en.markerOk, markerNote: draft.en.markerNote } : null,
      zh: draft.zh ? { soft: draft.zh.soft, markerOk: draft.zh.markerOk, markerNote: draft.zh.markerNote } : null,
    },
  });
  if (r.error) return { ok: false, error: r.error };
  return { ok: true, slug, reason: draft.reason };
}
