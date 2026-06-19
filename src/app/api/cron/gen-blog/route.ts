// P3c 事件解读 blog 生成 cron：近期已结算比赛 → prob_delta 数据锚 → 材料闸 → 双语生成 + 双闸 → upsert。
// 受 CRON_SECRET 保护（三写法，与 settle 一致）。外部 cron-job.org 定时调用即可。
// 灰度：BLOG_AUTO_PUBLISH=1 才自动发，默认全进 needs_review（人工在管理页放行）。
// 时间预算：DeepSeek V4 Pro 较慢 → BLOG_GEN_CAP 控制每次条数（默认 2）；不够则提频或调大 maxDuration。

import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { getServerSupabase } from "@/lib/supabase/server";
import { getMatchProbDelta, classifyProbDelta } from "@/lib/blog/getProbDelta";
import { buildSettledCandidate } from "@/lib/blog/scoreCandidate";
import { generateForCandidate } from "@/lib/blog/generate";
import * as llm from "@/lib/blog/llm";
import { upsertBlogEntry } from "@/lib/blog/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authed(req: NextRequest): boolean {
  const s = process.env.CRON_SECRET;
  if (!s) return false;
  return (
    req.headers.get("authorization") === `Bearer ${s}` ||
    req.headers.get("cron_secret") === s ||
    req.headers.get("x-cron-secret") === s
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const autoPublish = process.env.BLOG_AUTO_PUBLISH === "1";
  const cap = Number(process.env.BLOG_GEN_CAP ?? "2");
  const nowIso = new Date().toISOString();

  // 近期已结算比赛
  const { data: ms } = await supabase
    .from("matches")
    .select("id")
    .eq("status", "settled")
    .order("settled_at", { ascending: false })
    .limit(30);
  const matchIds = ((ms as { id: string }[] | null) ?? []).map((m) => m.id);

  // 去重：已有 blog_entries 的 match_id（service_role 看全状态，含 needs_review）
  const db = getServerSupabase();
  const { data: existing } = await db.from("blog_entries").select("match_id");
  const done = new Set(((existing as { match_id: string | null }[] | null) ?? []).map((e) => e.match_id).filter(Boolean));

  const entries: { slug: string; status: string; reason: string; error: string | null }[] = [];
  const skipped = { not_material: 0, no_delta: 0, already: 0 };

  for (const id of matchIds) {
    if (entries.length >= cap) break;
    if (done.has(id)) {
      skipped.already++;
      continue;
    }
    const delta = await getMatchProbDelta(id);
    if (!delta) {
      skipped.no_delta++;
      continue;
    }
    const cand = buildSettledCandidate(delta, classifyProbDelta(delta), null);
    if (!cand) {
      skipped.not_material++;
      continue;
    }
    const draft = await generateForCandidate(cand, llm, { autoPublish });
    const r = await upsertBlogEntry(cand, draft, nowIso);
    entries.push({ slug: r.slug, status: draft.status, reason: draft.statusReason, error: r.error });
  }

  return NextResponse.json({ ok: true, autoPublish, generated: entries.length, skipped, entries });
}
