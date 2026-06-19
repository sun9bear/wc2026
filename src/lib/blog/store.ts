// P3c 落库：BlogDraft → blog_entries 行（service_role 写，绕 RLS）。slug 由 队-队-事件 生成（稳定、可去重）。
// prob_delta 存引擎原值（审计/展示）；demand_signal/review 存信号与闸结果；published 时盖 published_at。

import { getServerSupabase } from "@/lib/supabase/server";
import { teamSlug } from "@/lib/prob/findTeam";
import type { BlogCandidate } from "./scoreCandidate";
import type { BlogDraft } from "./generate";

export interface BlogRow {
  slug_en: string;
  slug_zh: string;
  title_en: string | null;
  title_zh: string | null;
  excerpt_en: string | null;
  excerpt_zh: string | null;
  body_en: string | null;
  body_zh: string | null;
  match_id: string | null;
  team_ids: string[];
  event_type: string;
  prob_delta: unknown;
  demand_signal: unknown;
  review: unknown;
  status: string;
  topic_flag: string | null;
  published_at: string | null;
  updated_at: string;
}

/** 纯函数：候选 + 草稿 → blog_entries 行（便于单测，不触网）。 */
export function buildBlogRow(cand: BlogCandidate, draft: BlogDraft, nowIso: string): BlogRow {
  const slug = `${teamSlug(cand.delta.match.home)}-${teamSlug(cand.delta.match.away)}-${draft.eventType}`;
  const en = draft.en.article;
  const zh = draft.zh.article;
  return {
    slug_en: slug,
    slug_zh: slug, // 双语共用拉丁 slug：/blog/<slug> 与 /zh/blog/<slug>
    title_en: en?.title ?? null,
    title_zh: zh?.title ?? null,
    excerpt_en: en?.excerpt ?? null,
    excerpt_zh: zh?.excerpt ?? null,
    body_en: en?.body ?? null,
    body_zh: zh?.body ?? null,
    match_id: cand.matchId,
    team_ids: cand.delta.teams.map((t) => t.teamId),
    event_type: draft.eventType,
    prob_delta: cand.delta,
    demand_signal: draft.en.payload.demand,
    review: {
      reason: draft.statusReason,
      en: { hard: draft.en.hard?.reasons ?? null, soft: draft.en.soft, parseError: draft.en.parseError },
      zh: { hard: draft.zh.hard?.reasons ?? null, soft: draft.zh.soft, parseError: draft.zh.parseError },
    },
    status: draft.status,
    topic_flag: draft.topicSensitive ? "sensitive" : null,
    published_at: draft.status === "published" ? nowIso : null,
    updated_at: nowIso,
  };
}

/** upsert（按 slug_en 去重）。返回 slug + error。 */
export async function upsertBlogEntry(
  cand: BlogCandidate,
  draft: BlogDraft,
  nowIso: string
): Promise<{ slug: string; error: string | null }> {
  const row = buildBlogRow(cand, draft, nowIso);
  const db = getServerSupabase();
  const { error } = await db.from("blog_entries").upsert(row, { onConflict: "slug_en" });
  return { slug: row.slug_en, error: error?.message ?? null };
}
