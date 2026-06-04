import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { combinedMultiplier } from "@/lib/odds/pooledOdds";
import { validateStake } from "@/lib/bets/quote";

export const dynamic = "force-dynamic";

// 串关下注：选 2-10 场（每场一个结果），锁定连乘倍率。全中才赢。
// 服务端用 secret key 写入；串关不改动盘口池（仅锁定当前倍率）。
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "服务未配置" }, { status: 500 });

  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
  const { data: userData } = await createClient(url, anon).auth.getUser(token);
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "请先进入游戏（未登录）" }, { status: 401 });

  const body = (await req.json()) as { selectionIds?: string[]; stake?: number };
  const selectionIds = body.selectionIds ?? [];
  const stake = body.stake;
  if (!Array.isArray(selectionIds) || selectionIds.length < 2) {
    return NextResponse.json({ error: "串关至少选 2 场" }, { status: 400 });
  }
  if (selectionIds.length > 10) {
    return NextResponse.json({ error: "串关最多 10 场" }, { status: 400 });
  }
  if (typeof stake !== "number") {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  const db = getServerSupabase();

  const { data: profRow } = await db
    .from("profiles")
    .select("points_balance")
    .eq("user_id", user.id)
    .maybeSingle();
  let balance = (profRow as { points_balance: number } | null)?.points_balance ?? null;
  if (balance === null) {
    await db.from("profiles").insert({ user_id: user.id, points_balance: 1000 });
    await db.from("points_ledger").insert({ user_id: user.id, delta: 1000, reason: "signup" });
    balance = 1000;
  }

  const stakeErr = validateStake(stake, balance);
  if (stakeErr) return NextResponse.json({ error: stakeErr }, { status: 400 });

  const { data: selData } = await db
    .from("selections")
    .select("id, market_id, current_multiplier")
    .in("id", selectionIds);
  const sels = (selData as { id: string; market_id: string; current_multiplier: number }[] | null) ?? [];
  if (sels.length !== selectionIds.length) {
    return NextResponse.json({ error: "选项不存在" }, { status: 404 });
  }
  if (new Set(sels.map((s) => s.market_id)).size !== sels.length) {
    return NextResponse.json({ error: "同一场只能选一个结果" }, { status: 400 });
  }

  const combined = combinedMultiplier(sels.map((s) => Number(s.current_multiplier)));

  const { data: betRow, error: betErr } = await db
    .from("bets")
    .insert({
      user_id: user.id,
      type: "parlay",
      total_stake: stake,
      total_multiplier: combined,
      status: "pending",
    })
    .select("id")
    .single();
  if (betErr || !betRow) {
    return NextResponse.json({ error: "下注写入失败" }, { status: 500 });
  }
  const betId = (betRow as { id: string }).id;

  await db.from("bet_selections").insert(
    sels.map((s) => ({
      bet_id: betId,
      selection_id: s.id,
      multiplier_at_bet: Number(s.current_multiplier),
    }))
  );

  await db
    .from("points_ledger")
    .insert({ user_id: user.id, delta: -stake, reason: "bet_stake", ref_id: betId });
  const newBalance = balance - stake;
  await db.from("profiles").update({ points_balance: newBalance }).eq("user_id", user.id);

  return NextResponse.json({ ok: true, balance: newBalance, combined, legs: sels.length, betId });
}
