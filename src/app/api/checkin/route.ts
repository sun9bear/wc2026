import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { computeStreak } from "@/lib/checkin/streak";

export const dynamic = "force-dynamic";

const DAILY_AWARD = 50;

async function getUserId(req: NextRequest): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
  const { data } = await createClient(url, anon).auth.getUser(token);
  return data.user?.id ?? null;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

async function dailyDates(db: SupabaseClient, userId: string): Promise<string[]> {
  const { data } = await db
    .from("points_ledger")
    .select("created_at")
    .eq("user_id", userId)
    .eq("reason", "daily")
    .order("created_at", { ascending: false })
    .limit(90);
  return ((data as { created_at: string }[] | null) ?? []).map((r) => r.created_at.slice(0, 10));
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const db = getServerSupabase();
  const { data: prof } = await db
    .from("profiles")
    .select("points_balance")
    .eq("user_id", userId)
    .maybeSingle();
  const balance = (prof as { points_balance: number } | null)?.points_balance ?? 1000;
  const dates = await dailyDates(db, userId);
  const today = todayUTC();
  return NextResponse.json({
    balance,
    streak: computeStreak(dates, today),
    checkedInToday: dates.includes(today),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const db = getServerSupabase();

  const { data: prof } = await db
    .from("profiles")
    .select("points_balance")
    .eq("user_id", userId)
    .maybeSingle();
  let balance = (prof as { points_balance: number } | null)?.points_balance ?? null;
  if (balance === null) {
    await db.from("profiles").insert({ user_id: userId, points_balance: 1000 });
    await db.from("points_ledger").insert({ user_id: userId, delta: 1000, reason: "signup" });
    balance = 1000;
  }

  const today = todayUTC();
  // H4：原子领取（DB 内唯一 (user, day) 主键 + 同事务发奖）；当天已领则返回 null。
  const { data: newBal, error: claimErr } = await db.rpc("claim_daily", {
    p_user: userId,
    p_award: DAILY_AWARD,
    p_day: today,
  });
  if (claimErr) return NextResponse.json({ error: "签到失败" }, { status: 500 });

  const dates = await dailyDates(db, userId);
  if (newBal === null || newBal === undefined) {
    return NextResponse.json({
      alreadyCheckedIn: true,
      balance,
      streak: computeStreak(dates, today),
      checkedInToday: true,
    });
  }
  return NextResponse.json({
    awarded: DAILY_AWARD,
    balance: Number(newBal),
    streak: computeStreak(dates, today),
    checkedInToday: true,
  });
}
