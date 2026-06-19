// P6 blog 管理后台数据/鉴权层：service_role 读写（绕 RLS）+ token 鉴权。
// 仅服务端使用（/me/blog 页 + /api/admin/blog 路由）。口令 = ADMIN_TOKEN，回落 CRON_SECRET（已配，开箱即用）。

import "server-only";
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "crypto";
import { getServerSupabase } from "@/lib/supabase/server";

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
