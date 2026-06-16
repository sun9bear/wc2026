import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimit";

// 球员人气投票（积分经济）：每用户每球员每天 第1票免费、第2-5票各扣 10 积分、每天最多 5 票。
// 核心逻辑在 DB RPC cast_player_vote（advisory lock 下原子 计数→收费→落票，杜绝并发刷免费/超额）。
// 投票不可撤、积分不退；"每天"= UTC 日。排名票数=累计总票（player_vote_counts 视图）。
// 路由层：同源 + IP/用户限速 + 匿名 auth 身份校验。

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

function todayStartISO(): string {
  return new Date().toISOString().slice(0, 10) + "T00:00:00.000Z"; // 当日 UTC 0 点
}

// GET ?mine=1 → 当前用户今日各球员已投票数 + 积分余额（未登录返回空）。
export async function GET(req: NextRequest) {
  if (!rateLimit(`vote_get:${getIp(req)}`, 30, 60_000)) {
    return NextResponse.json({ mine: {}, balance: null }, { status: 429 });
  }
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ mine: {}, balance: null });
  const db = getServerSupabase();
  const [vRes, pRes] = await Promise.all([
    db.from("player_votes").select("player_id").eq("user_id", userId).gte("created_at", todayStartISO()),
    db.from("profiles").select("points_balance").eq("user_id", userId).maybeSingle(),
  ]);
  const mine: Record<string, number> = {};
  for (const v of (vRes.data as { player_id: string }[] | null) ?? []) {
    mine[v.player_id] = (mine[v.player_id] ?? 0) + 1;
  }
  const balance = (pRes.data as { points_balance: number } | null)?.points_balance ?? null;
  return NextResponse.json({ mine, balance });
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

  const body = (await req.json().catch(() => null)) as { playerId?: string } | null;
  const playerId = body?.playerId;
  if (!playerId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerId)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const db = getServerSupabase();

  // 候选必须存在且在榜（清晰的 404，且避免对任意 UUID 起锁）。
  const { data: pRow } = await db
    .from("players")
    .select("id")
    .eq("id", playerId)
    .eq("is_active", true)
    .maybeSingle();
  if (!pRow) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // 原子投票（计数+收费+落票，advisory lock 串行化）。
  const { data: result, error: rpcErr } = await db.rpc("cast_player_vote", {
    p_user: userId,
    p_player: playerId,
  });
  if (rpcErr) {
    console.error("cast_player_vote failed:", rpcErr.message);
    return NextResponse.json({ error: "write_failed" }, { status: 500 });
  }
  const r = (result ?? {}) as {
    error?: string;
    votes?: number;
    today_count?: number;
    cost?: number;
    balance?: number | null;
  };
  if (r.error === "daily_limit") return NextResponse.json({ error: "daily_limit" }, { status: 409 });
  if (r.error === "insufficient_points") {
    return NextResponse.json({ error: "insufficient_points" }, { status: 402 });
  }

  return NextResponse.json({
    ok: true,
    playerId,
    votes: r.votes ?? 0,
    todayCount: r.today_count ?? 0,
    cost: r.cost ?? 0,
    balance: r.balance ?? null,
  });
}
