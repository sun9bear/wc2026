/**
 * 为已结算的比赛批量补录"赛后小结"并入库（幂等：已有则跳过）。
 * 正常情况下 cron 结算时已自动生成；本脚本用于补录或失败重跑。
 * 用法：npx tsx scripts/gen-recaps.ts [数量，默认 20]
 */
import { createClient } from "@supabase/supabase-js";
import { generateRecap } from "../src/lib/ai/content";
import { upsertContent } from "../src/lib/ai/store";
import { teamZh } from "../src/lib/football/teams";

process.loadEnvFile(".env.local");

interface MRow {
  id: string;
  home_score: number | null;
  away_score: number | null;
  home: { name: string } | null;
  away: { name: string } | null;
}

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const limit = Number(process.argv[2] ?? 20);

  const { data } = await sb
    .from("matches")
    .select("id, home_score, away_score, home:home_team_id(name), away:away_team_id(name)")
    .eq("status", "settled")
    .order("kickoff_at", { ascending: false })
    .limit(limit);
  const matches = (data as MRow[] | null) ?? [];

  let n = 0;
  for (const m of matches) {
    if (m.home_score == null || m.away_score == null) continue;
    const { data: ex } = await sb
      .from("ai_content")
      .select("id")
      .eq("match_id", m.id)
      .eq("type", "recap")
      .maybeSingle();
    if (ex) continue;

    const home = teamZh(m.home?.name ?? "?");
    const away = teamZh(m.away?.name ?? "?");
    const body = await generateRecap(home, away, m.home_score, m.away_score);
    await upsertContent(sb, m.id, "recap", body);
    console.log(`✓ ${home} ${m.home_score}:${m.away_score} ${away}`);
    n++;
  }
  console.log(`✓ 生成 ${n} 条赛后小结`);
}

main().catch((e) => {
  console.error("✗ 失败:", e?.message ?? e);
  process.exit(1);
});
