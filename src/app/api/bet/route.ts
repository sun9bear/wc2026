import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { pooledMultiplier } from "@/lib/odds/pooledOdds";
import { validateStake } from "@/lib/bets/quote";

// 下注写入：服务端用 secret key（service_role）把关与落库。
// 注：MVP 采用顺序写入，未做单事务原子化；后续可用 Postgres 函数(RPC)硬化。
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "服务未配置" }, { status: 500 });
  }

  // 校验用户身份（匿名登录的 access token）
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
  const { data: userData } = await createClient(url, anon).auth.getUser(token);
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "请先进入游戏（未登录）" }, { status: 401 });

  const body = (await req.json()) as { selectionId?: string; stake?: number };
  const selectionId = body.selectionId;
  const stake = body.stake;
  if (!selectionId || typeof stake !== "number") {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  const db = getServerSupabase();

  // 确保用户档案存在（注册赠送 1000 积分；红线1：不可购买）
  const { data: profileRow } = await db
    .from("profiles")
    .select("points_balance")
    .eq("user_id", user.id)
    .maybeSingle();
  let balance = (profileRow as { points_balance: number } | null)?.points_balance ?? null;
  if (balance === null) {
    await db.from("profiles").insert({ user_id: user.id, points_balance: 1000 });
    await db.from("points_ledger").insert({ user_id: user.id, delta: 1000, reason: "signup" });
    balance = 1000;
  }

  const stakeErr = validateStake(stake, balance);
  if (stakeErr) return NextResponse.json({ error: stakeErr }, { status: 400 });

  // 读取选项 + 同盘口其它选项（用于计算倍率与刷新池）
  const { data: selRow } = await db
    .from("selections")
    .select("id, market_id, pooled_stake")
    .eq("id", selectionId)
    .maybeSingle();
  const sel = selRow as { id: string; market_id: string; pooled_stake: number } | null;
  if (!sel) return NextResponse.json({ error: "选项不存在" }, { status: 404 });

  const { data: sibData } = await db
    .from("selections")
    .select("id, pooled_stake")
    .eq("market_id", sel.market_id);
  const siblings = (sibData as { id: string; pooled_stake: number }[] | null) ?? [];
  const n = siblings.length;
  const total = siblings.reduce((a, s) => a + Number(s.pooled_stake), 0);
  const mult = pooledMultiplier(Number(sel.pooled_stake), total, n);

  // 落库：bet + bet_selections
  const { data: betRow, error: betErr } = await db
    .from("bets")
    .insert({
      user_id: user.id,
      type: "single",
      total_stake: stake,
      total_multiplier: mult,
      status: "pending",
    })
    .select("id")
    .single();
  if (betErr || !betRow) {
    return NextResponse.json({ error: "下注写入失败" }, { status: 500 });
  }
  const betId = (betRow as { id: string }).id;
  await db
    .from("bet_selections")
    .insert({ bet_id: betId, selection_id: selectionId, multiplier_at_bet: mult });

  // 刷新池与各选项倍率
  const newTotal = total + stake;
  for (const s of siblings) {
    const ps = s.id === selectionId ? Number(sel.pooled_stake) + stake : Number(s.pooled_stake);
    const m = pooledMultiplier(ps, newTotal, n);
    await db.from("selections").update({ pooled_stake: ps, current_multiplier: m }).eq("id", s.id);
  }

  // 积分流水 + 扣除余额
  await db
    .from("points_ledger")
    .insert({ user_id: user.id, delta: -stake, reason: "bet_stake", ref_id: betId });
  const newBalance = balance - stake;
  await db.from("profiles").update({ points_balance: newBalance }).eq("user_id", user.id);

  return NextResponse.json({ ok: true, balance: newBalance, multiplier: mult, betId });
}
