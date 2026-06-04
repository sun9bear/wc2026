import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { computeStats } from "@/lib/stats/playerStats";
import { rankTier } from "@/lib/ranks/rankTier";

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

  const { data: betRows } = await db.from("bets").select("status").eq("user_id", user.id);
  const stats = computeStats((betRows as { status: string }[] | null) ?? []);

  return NextResponse.json({ balance, tier: rankTier(balance).label, ...stats });
}
