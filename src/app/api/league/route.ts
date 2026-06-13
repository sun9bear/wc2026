import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { genLeagueCode } from "@/lib/league/code";
import { findBannedTermsStrict } from "@/lib/compliance/bannedTerms";

// 擂台（任务 5）：POST 创建（要求已有昵称）；GET 列出我加入的擂台。
// 全部 service key 操作，客户端不直读表。

async function authUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
  const { data } = await createClient(url, anon).auth.getUser(token);
  return data.user;
}

async function hasNickname(db: ReturnType<typeof getServerSupabase>, userId: string) {
  const { data } = await db
    .from("profiles")
    .select("nickname")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean((data as { nickname: string | null } | null)?.nickname);
}

export async function GET(req: NextRequest) {
  const user = await authUser(req);
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const db = getServerSupabase();
  const { data: memRows } = await db
    .from("league_members")
    .select("league:leagues(code, name)")
    .eq("user_id", user.id)
    .limit(20);
  const leagues = (((memRows as unknown) as { league: { code: string; name: string } | null }[] | null) ?? [])
    .map((r) => r.league)
    .filter((l): l is { code: string; name: string } => l !== null);
  return NextResponse.json({ leagues });
}

export async function POST(req: NextRequest) {
  const user = await authUser(req);
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = (await req.json()) as { name?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const len = Array.from(name).length;
  if (len < 2 || len > 24 || /[\n\r\t<>]/.test(name)) {
    return NextResponse.json({ error: "league_name_invalid" }, { status: 400 });
  }
  if (findBannedTermsStrict(name, "zh").length > 0 || findBannedTermsStrict(name, "en").length > 0) {
    return NextResponse.json({ error: "league_name_banned" }, { status: 400 });
  }

  const db = getServerSupabase();
  if (!(await hasNickname(db, user.id))) {
    return NextResponse.json({ error: "nickname_required" }, { status: 409 });
  }

  // unique(code) 冲突重试；32^4 组合空间下 5 次必中
  for (let i = 0; i < 5; i++) {
    const code = genLeagueCode();
    const { data: lgRow, error } = await db
      .from("leagues")
      .insert({ code, name, owner_id: user.id })
      .select("id, code")
      .single();
    if (error) {
      if (error.code === "23505") continue; // 撞码重试
      return NextResponse.json({ error: "创建失败" }, { status: 500 });
    }
    const lg = lgRow as { id: string; code: string };
    await db.from("league_members").insert({ league_id: lg.id, user_id: user.id });
    return NextResponse.json({ ok: true, code: lg.code, name });
  }
  return NextResponse.json({ error: "创建失败" }, { status: 500 });
}
