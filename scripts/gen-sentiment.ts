/**
 * 为即将开赛的比赛批量生成"冷热门看点"并入库（幂等：已有则跳过）。
 * 依据当前倍率：最低倍率=人气最高(热门)，最高倍率=潜在冷门。
 * 用法：npx tsx scripts/gen-sentiment.ts [数量，默认 12]
 */
import { createClient } from "@supabase/supabase-js";
import { generateSentiment } from "../src/lib/ai/content";
import { upsertContent } from "../src/lib/ai/store";
import { teamZh } from "../src/lib/football/teams";

process.loadEnvFile(".env.local");

interface MRow {
  id: string;
  home: { name: string } | null;
  away: { name: string } | null;
}
interface SRow {
  code: string;
  current_multiplier: number;
}

const phrase = (code: string, home: string, away: string): string =>
  code === "home" ? `${home}胜` : code === "away" ? `${away}胜` : "平局";

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const limit = Number(process.argv[2] ?? 12);

  const { data } = await sb
    .from("matches")
    .select("id, home:home_team_id(name), away:away_team_id(name)")
    .eq("status", "scheduled")
    .order("kickoff_at")
    .limit(limit);
  const matches = (data as MRow[] | null) ?? [];

  let n = 0;
  for (const m of matches) {
    const { data: ex } = await sb
      .from("ai_content")
      .select("id")
      .eq("match_id", m.id)
      .eq("type", "sentiment")
      .maybeSingle();
    if (ex) continue;

    const { data: mk } = await sb
      .from("markets")
      .select("id")
      .eq("match_id", m.id)
      .eq("type", "1x2")
      .maybeSingle();
    if (!mk) continue;
    const { data: selData } = await sb
      .from("selections")
      .select("code, current_multiplier")
      .eq("market_id", (mk as { id: string }).id);
    const sels = (selData as SRow[] | null) ?? [];
    if (sels.length === 0) continue;

    const home = teamZh(m.home?.name ?? "?");
    const away = teamZh(m.away?.name ?? "?");
    const sorted = [...sels].sort((a, b) => Number(a.current_multiplier) - Number(b.current_multiplier));
    const hot = phrase(sorted[0].code, home, away);
    const cold = phrase(sorted[sorted.length - 1].code, home, away);

    const body = await generateSentiment(home, away, hot, cold);
    await upsertContent(sb, m.id, "sentiment", body);
    console.log(`✓ ${home} vs ${away} | 热门:${hot} 冷门:${cold}`);
    n++;
  }
  console.log(`✓ 生成 ${n} 条冷热门看点`);
}

main().catch((e) => {
  console.error("✗ 失败:", e?.message ?? e);
  process.exit(1);
});
