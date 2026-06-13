import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { computeStats } from "@/lib/stats/playerStats";
import { rankTier } from "@/lib/ranks/rankTier";
import { computeStreak } from "@/lib/checkin/streak";
import { computeAchievements } from "@/lib/achievements/achievements";

// 返回当前用户的战绩（服务端用 secret key 读取，凭 access token 鉴别身份）。
export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "服务未配置" }, { status: 500 });

  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
  const { data: userData } = await createClient(url, anon).auth.getUser(token);
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const db = getServerSupabase();
  const { data: profRow } = await db
    .from("profiles")
    .select("points_balance")
    .eq("user_id", user.id)
    .maybeSingle();
  const balance = (profRow as { points_balance: number } | null)?.points_balance ?? 1000;

  const { data: betRows } = await db
    .from("bets")
    .select("status, payout")
    .eq("user_id", user.id);
  const bets = (betRows as { status: string; payout: number | null }[] | null) ?? [];
  const stats = computeStats(bets);
  const biggestPayout = bets.reduce((mx, b) => Math.max(mx, Number(b.payout ?? 0)), 0);

  const { data: dailyRows } = await db
    .from("points_ledger")
    .select("created_at")
    .eq("user_id", user.id)
    .eq("reason", "daily")
    .order("created_at", { ascending: false })
    .limit(90);
  const dailyDates = ((dailyRows as { created_at: string }[] | null) ?? []).map((r) =>
    r.created_at.slice(0, 10)
  );
  const checkinStreak = computeStreak(dailyDates, new Date().toISOString().slice(0, 10));

  const achievements = computeAchievements({
    total: stats.total,
    won: stats.won,
    hitRate: stats.hitRate,
    biggestPayout,
    checkinStreak,
    balance,
  });

  const tier = rankTier(balance);
  // tierCode 供前端按语言渲染段位名（label 仅中文，保留兼容旧客户端）
  return NextResponse.json({ balance, tier: tier.label, tierCode: tier.code, ...stats, achievements });
}
