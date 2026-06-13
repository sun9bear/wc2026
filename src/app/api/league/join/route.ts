import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { normalizeLeagueCode } from "@/lib/league/code";

// 输码入擂台（任务 5）：幂等（重复加入 = 直接成功）；要求已有昵称。
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "服务未配置" }, { status: 500 });
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
  const { data: userData } = await createClient(url, anon).auth.getUser(token);
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = (await req.json()) as { code?: unknown };
  const code = typeof body.code === "string" ? normalizeLeagueCode(body.code) : "";
  if (!/^WC-[A-Z2-9]{4}$/.test(code)) {
    return NextResponse.json({ error: "code_invalid" }, { status: 400 });
  }

  const db = getServerSupabase();
  const { data: profRow } = await db
    .from("profiles")
    .select("nickname")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!(profRow as { nickname: string | null } | null)?.nickname) {
    return NextResponse.json({ error: "nickname_required" }, { status: 409 });
  }

  const { data: lgRow } = await db
    .from("leagues")
    .select("id, code, name")
    .eq("code", code)
    .maybeSingle();
  const lg = lgRow as { id: string; code: string; name: string } | null;
  if (!lg) return NextResponse.json({ error: "league_not_found" }, { status: 404 });

  const { error } = await db
    .from("league_members")
    .upsert({ league_id: lg.id, user_id: user.id }, { onConflict: "league_id,user_id" });
  if (error) return NextResponse.json({ error: "加入失败" }, { status: 500 });

  return NextResponse.json({ ok: true, code: lg.code, name: lg.name });
}
