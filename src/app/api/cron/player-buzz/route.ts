import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchPageviews } from "@/lib/players/buzz";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 热度同步：每 ~12h 抓各候选维基 pageviews 近 7 日合计 → player_metrics.buzz_raw。
// 受 CRON_SECRET 保护（与 cron/settle 同三写法）。外部 cron-job.org 调用即可。
// 软降级：单条抓不到记 0，不影响整体；仅更新 buzz_* 列，不动 ai_blurb 列。
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET 未配置" }, { status: 500 });
  const bearer = req.headers.get("authorization") === `Bearer ${secret}`;
  const plain =
    req.headers.get("cron_secret") === secret || req.headers.get("x-cron-secret") === secret;
  if (!bearer && !plain) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sk = process.env.SUPABASE_SECRET_KEY;
  if (!url || !sk) return NextResponse.json({ error: "服务未配置" }, { status: 500 });
  const db = createClient(url, sk, { auth: { persistSession: false } });

  const { data } = await db.from("players").select("id, wiki_title").eq("is_active", true);
  const players = (data as { id: string; wiki_title: string | null }[] | null) ?? [];

  const now = new Date().toISOString();
  let updated = 0;
  for (const p of players) {
    if (!p.wiki_title) continue;
    const views = await fetchPageviews(p.wiki_title);
    const { error } = await db
      .from("player_metrics")
      .upsert(
        { player_id: p.id, buzz_raw: views, buzz_updated_at: now },
        { onConflict: "player_id" }
      );
    if (!error) updated++;
  }

  return NextResponse.json({ ok: true, updated, total: players.length });
}
