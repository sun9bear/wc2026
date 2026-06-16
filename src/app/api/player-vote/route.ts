import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimit";

// 球员人气投票：投票 / 撤票 / 查询「我投过谁」。
// 防滥用（对齐 src/app/api/track/route.ts）：同源校验 + IP/用户双限速 + unique(player_id,user_id) 去重 + 匿名 auth 身份。
// 写只走 service_role（绕 RLS）；读自己的票按 user_id 过滤。
// 未接 Turnstile：与现有写端点（predict/checkin/combo）一致，避免 fail-closed 误杀；遇刷量再加（见设计 §10）。

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

async function getUserId(req: NextRequest): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const authz = req.headers.get("authorization") ?? "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return null;
  const { data } = await createClient(url, anon).auth.getUser(token);
  return data.user?.id ?? null;
}

// GET ?mine=1 → 当前用户投过的 player_id 列表（未登录返回空）。
export async function GET(req: NextRequest) {
  // 限速读路径（防认证读端点被高速刷库；GET 同源 Origin 可缺失，故只限速不校同源）。
  if (!rateLimit(`vote_get:${getIp(req)}`, 30, 60_000)) {
    return NextResponse.json({ voted: [] }, { status: 429 });
  }
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ voted: [] });
  const db = getServerSupabase();
  const { data } = await db.from("player_votes").select("player_id").eq("user_id", userId);
  const voted = ((data as { player_id: string }[] | null) ?? []).map((r) => r.player_id);
  return NextResponse.json({ voted });
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const ip = getIp(req);
  if (!rateLimit(`vote:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!rateLimit(`vote_u:${userId}`, 20, 60_000)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { playerId?: string; action?: string } | null;
  const playerId = body?.playerId;
  const action = body?.action === "unvote" ? "unvote" : "vote";
  if (!playerId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerId)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const db = getServerSupabase();

  // 候选必须存在且在榜（防对任意 UUID 灌票）。
  const { data: pRow } = await db
    .from("players")
    .select("id")
    .eq("id", playerId)
    .eq("is_active", true)
    .maybeSingle();
  if (!pRow) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (action === "vote") {
    const { error } = await db
      .from("player_votes")
      .upsert({ player_id: playerId, user_id: userId }, { onConflict: "player_id,user_id" });
    if (error) return NextResponse.json({ error: "write_failed" }, { status: 500 });
  } else {
    const { error } = await db
      .from("player_votes")
      .delete()
      .eq("player_id", playerId)
      .eq("user_id", userId);
    if (error) return NextResponse.json({ error: "write_failed" }, { status: 500 });
  }

  const { count } = await db
    .from("player_votes")
    .select("*", { count: "exact", head: true })
    .eq("player_id", playerId);

  return NextResponse.json({ ok: true, playerId, voted: action === "vote", votes: count ?? 0 });
}
