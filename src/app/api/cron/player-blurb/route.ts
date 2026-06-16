import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generatePlayerBlurbZh, generatePlayerBlurbEn } from "@/lib/players/blurb";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// AI 球员短评生成（安全版，不进排名分）。受 CRON_SECRET 保护（三写法）。
// 每轮最多 CAP 名（控 Gemini 15 RPM）；默认只补缺失，?force=1 全量重生。
// 仅更新 ai_* 列，不动 buzz 列（与 player-buzz cron 互不覆盖）。
const CAP = 6;

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

  const force = new URL(req.url).searchParams.get("force") === "1";

  const [{ data: pData }, { data: mData }] = await Promise.all([
    db.from("players").select("id, name, team_name, position").eq("is_active", true),
    db.from("player_metrics").select("player_id, ai_blurb, ai_blurb_en"),
  ]);
  const players =
    (pData as { id: string; name: string; team_name: string; position: string | null }[] | null) ?? [];
  const have = new Map(
    ((mData as { player_id: string; ai_blurb: string | null; ai_blurb_en: string | null }[] | null) ?? []).map(
      (m) => [m.player_id, m] as const
    )
  );

  const todo = players
    .filter((p) => {
      if (force) return true;
      const m = have.get(p.id);
      // 有任一语种短评即视为已处理：避免某语种（如 Gemini 限流）持续失败时卡在同一批、无法推进到后续球员。
      return !m?.ai_blurb && !m?.ai_blurb_en;
    })
    .slice(0, CAP);

  const now = new Date().toISOString();
  let updated = 0;
  for (const p of todo) {
    const [zh, en] = await Promise.all([
      generatePlayerBlurbZh(p.name, p.team_name, p.position ?? ""),
      generatePlayerBlurbEn(p.name, p.team_name, p.position ?? ""),
    ]);
    if (!zh && !en) continue;
    const patch: Record<string, unknown> = { player_id: p.id, ai_updated_at: now };
    if (zh) patch.ai_blurb = zh;
    if (en) patch.ai_blurb_en = en;
    const { error } = await db.from("player_metrics").upsert(patch, { onConflict: "player_id" });
    if (!error) updated++;
  }

  return NextResponse.json({ ok: true, updated, attempted: todo.length, candidates: players.length });
}
