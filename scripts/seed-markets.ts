/**
 * 为每场比赛创建"胜平负(1x2)"市场 + 三个选项（主胜/平局/客胜）。
 * 用 secret key 走 HTTPS 写入（service_role 绕过 RLS）。幂等：已存在则跳过。
 * 运行：npx tsx scripts/seed-markets.ts
 */
import { createClient } from "@supabase/supabase-js";
import { computeMultipliers } from "../src/lib/odds/pooledOdds";

process.loadEnvFile(".env.local");

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("缺少 Supabase 环境变量（检查 .env.local）");
  const sb = createClient(url, key);

  const { data: matches, error: me } = await sb.from("matches").select("id");
  if (me) throw me;

  const init = computeMultipliers([0, 0, 0]); // 空池 → [3,3,3]
  let created = 0;

  for (const m of matches ?? []) {
    const { data: existing, error: ee } = await sb
      .from("markets")
      .select("id")
      .eq("match_id", m.id)
      .eq("type", "1x2");
    if (ee) throw ee;
    if (existing && existing.length) continue;

    const { data: market, error: e1 } = await sb
      .from("markets")
      .insert({ match_id: m.id, type: "1x2", status: "open" })
      .select("id")
      .single();
    if (e1) throw e1;

    const { error: e2 } = await sb.from("selections").insert([
      { market_id: market.id, code: "home", label: "主胜", pooled_stake: 0, current_multiplier: init[0] },
      { market_id: market.id, code: "draw", label: "平局", pooled_stake: 0, current_multiplier: init[1] },
      { market_id: market.id, code: "away", label: "客胜", pooled_stake: 0, current_multiplier: init[2] },
    ]);
    if (e2) throw e2;
    created++;
  }

  console.log(`✓ 为 ${created} 场比赛创建了 1x2 市场（已存在的跳过）`);
}

main().catch((e) => {
  console.error("✗ 失败:", e?.message ?? e);
  process.exit(1);
});
