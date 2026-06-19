// P3c 事件解读 blog 生成 cron：近期已结算比赛 → prob_delta 数据锚 → 材料闸 → 双语生成 + 双闸 → upsert。
// 受 CRON_SECRET 保护（三写法，与 settle 一致）。外部 cron-job.org 定时调用即可。
// 灰度：BLOG_AUTO_PUBLISH=1 才自动发，默认全进 needs_review（人工在管理页放行）。
// 时间预算：cron-job.org 响应超时最高 30s、Vercel Hobby 函数 maxDuration 60s。故 after() 后台化：
// HTTP 秒回 {started}（满足 cron-job.org），生成在后台跑（≤60s）；CAP=1 每次 1 篇；
// 后台若超 60s 被杀，因 upsert 在最后→未落库→下次 cron 自愈重试（不丢稿/不脏库）。

import { NextResponse, after, type NextRequest } from "next/server";
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

// 实际生成（在 after() 后台跑，可吃满 maxDuration；不阻塞 HTTP 响应）。
async function runGenBlog(autoPublish: boolean, cap: number): Promise<void> {
  const nowIso = new Date().toISOString();
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

  let made = 0;
  for (const id of matchIds) {
    if (made >= cap) break;
    if (done.has(id)) continue;
    const delta = await getMatchProbDelta(id);
    if (!delta) continue;
    const cand = buildSettledCandidate(delta, classifyProbDelta(delta), null);
    if (!cand) continue;
    const draft = await generateForCandidate(cand, llm, { autoPublish });
    await upsertBlogEntry(cand, draft, nowIso); // upsert 最后一步：中途超时→未落库→下次自愈重试
    made++;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const autoPublish = process.env.BLOG_AUTO_PUBLISH === "1";
  const cap = Number(process.env.BLOG_GEN_CAP ?? "1");
  // 秒回 {started} 满足 cron-job.org 30s 超时；生成在 after() 后台跑（Hobby maxDuration 60s 内）。
  after(async () => {
    try {
      await runGenBlog(autoPublish, cap);
    } catch (e) {
      console.error("gen-blog after() failed:", e instanceof Error ? e.message : e);
    }
  });
  return NextResponse.json({ started: true, autoPublish, cap });
}
