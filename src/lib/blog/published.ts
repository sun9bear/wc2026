// P4 公开 blog 读取层：只读 status='published'（anon 客户端，RLS 已限 published）。
// blog 仅 en/zh：locale=zh→中文，其余→英文（fallback）。slug_en===slug_zh（同 latin slug），按 slug_en 匹配。

import type { Metadata } from "next";
import type { Locale } from "@/i18n";
import { localeHref } from "@/i18n";
import { HREFLANG, SITE_ORIGIN } from "@/lib/seo/canonical";
import { supabase } from "@/lib/supabase/client";

export type BlogLocale = "en" | "zh";
export const toBlogLocale = (l: Locale): BlogLocale => (l === "zh" ? "zh" : "en");

export interface BlogListItem {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string | null;
  eventType: string | null;
}
export interface BlogPost extends BlogListItem {
  body: string;
  updatedAt: string;
  matchId: string | null;
  eventType: string | null;
}

interface Row {
  slug_en: string;
  title_en: string | null;
  title_zh: string | null;
  excerpt_en: string | null;
  excerpt_zh: string | null;
  body_en?: string | null;
  body_zh?: string | null;
  published_at: string | null;
  updated_at?: string;
  match_id?: string | null;
  event_type?: string | null;
}

const LIST_COLS = "slug_en, title_en, title_zh, excerpt_en, excerpt_zh, published_at, event_type";

function mapList(data: unknown, bl: BlogLocale): BlogListItem[] {
  return ((data as Row[] | null) ?? [])
    .map((r) => ({
      slug: r.slug_en,
      title: (bl === "zh" ? r.title_zh : r.title_en) ?? "",
      excerpt: (bl === "zh" ? r.excerpt_zh : r.excerpt_en) ?? "",
      publishedAt: r.published_at,
      eventType: r.event_type ?? null,
    }))
    .filter((x) => x.slug && x.title);
}

/** 已发布文章列表（按发布时间倒序）。 */
export async function listPublishedBlog(bl: BlogLocale, limit = 50): Promise<BlogListItem[]> {
  const { data } = await supabase
    .from("blog_entries")
    .select(LIST_COLS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  return mapList(data, bl);
}

/** P5：某场比赛相关的已发布解读（match 详情页入口）。 */
export async function getRelatedBlogByMatch(matchId: string, bl: BlogLocale, limit = 3): Promise<BlogListItem[]> {
  const { data } = await supabase
    .from("blog_entries")
    .select(LIST_COLS)
    .eq("status", "published")
    .eq("match_id", matchId)
    .order("published_at", { ascending: false })
    .limit(limit);
  return mapList(data, bl);
}

/** P5：某球队相关的已发布解读（team 详情页入口；team_ids uuid[] 含该队）。 */
export async function getRelatedBlogByTeam(teamId: string, bl: BlogLocale, limit = 3): Promise<BlogListItem[]> {
  const { data } = await supabase
    .from("blog_entries")
    .select(LIST_COLS)
    .eq("status", "published")
    .contains("team_ids", [teamId])
    .order("published_at", { ascending: false })
    .limit(limit);
  return mapList(data, bl);
}

/** 按 slug 取已发布文章；该语种无内容则返回 null。 */
export async function getPublishedBlogBySlug(slug: string, bl: BlogLocale): Promise<BlogPost | null> {
  const { data } = await supabase
    .from("blog_entries")
    .select(
      "slug_en, title_en, title_zh, excerpt_en, excerpt_zh, body_en, body_zh, published_at, updated_at, match_id, event_type"
    )
    .eq("status", "published")
    .eq("slug_en", slug)
    .maybeSingle();
  const r = data as Row | null;
  if (!r) return null;
  const title = (bl === "zh" ? r.title_zh : r.title_en) ?? "";
  const body = (bl === "zh" ? r.body_zh : r.body_en) ?? "";
  if (!title || !body) return null;
  return {
    slug: r.slug_en,
    title,
    excerpt: (bl === "zh" ? r.excerpt_zh : r.excerpt_en) ?? "",
    body,
    publishedAt: r.published_at,
    updatedAt: r.updated_at ?? r.published_at ?? "",
    matchId: r.match_id ?? null,
    eventType: r.event_type ?? null,
  };
}

/** blog 专用 hreflang：只输出 en + zh（fail-closed，不吐 es/pt/de/fr 假 alternate）。 */
export function blogAlternates(path: string, bl: BlogLocale): Metadata["alternates"] {
  const languages: Record<string, string> = {
    [HREFLANG.en]: SITE_ORIGIN + localeHref("en", path),
    [HREFLANG.zh]: SITE_ORIGIN + localeHref("zh", path),
    "x-default": SITE_ORIGIN + localeHref("en", path),
  };
  return { canonical: SITE_ORIGIN + localeHref(bl, path), languages };
}
