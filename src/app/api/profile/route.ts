import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { validateNickname } from "@/lib/league/nickname";

// 昵称（任务 5）：擂台社交前提——无昵称满屏 "Player-e4b1" 毫无意义，入擂台前必须先起名。
// GET 返回当前昵称；POST 设置（2-20 字符，中英雷词双表校验）。

async function authUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
  const { data } = await createClient(url, anon).auth.getUser(token);
  return data.user;
}

export async function GET(req: NextRequest) {
  const user = await authUser(req);
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const db = getServerSupabase();
  const { data } = await db
    .from("profiles")
    .select("nickname")
    .eq("user_id", user.id)
    .maybeSingle();
  return NextResponse.json({ nickname: (data as { nickname: string | null } | null)?.nickname ?? null });
}

export async function POST(req: NextRequest) {
  const user = await authUser(req);
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = (await req.json()) as { nickname?: unknown };
  const nick = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const err = validateNickname(nick);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const db = getServerSupabase();
  const { data: profRow } = await db
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profRow) {
    const { error } = await db.from("profiles").update({ nickname: nick }).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: "保存失败" }, { status: 500 });
  } else {
    // 首建档与 /api/predict 同口径：赠 1000 起始积分并记账
    const { error } = await db
      .from("profiles")
      .insert({ user_id: user.id, nickname: nick, points_balance: 1000 });
    if (error) return NextResponse.json({ error: "保存失败" }, { status: 500 });
    await db.from("points_ledger").insert({ user_id: user.id, delta: 1000, reason: "signup" });
  }
  return NextResponse.json({ ok: true, nickname: nick });
}
