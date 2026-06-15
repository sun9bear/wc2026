/**
 * 为即将开赛的比赛批量生成"冷热门看点"并入库（幂等：已有则跳过）。
 * 依据当前倍率：最低倍率=人气最高(热门)，最高倍率=潜在冷门。
 * 用法：npx tsx scripts/gen-sentiment.ts [数量，默认 12]
 */
import { createClient } from "@supabase/supabase-js";
import { generateSentiment } from "../src/lib/ai/content";
import { latestMatchProbs, upsertContent } from "../src/lib/ai/store";
import { teamZh } from "../src/lib/football/teams";

process.loadEnvFile(".env.local");

interface MRow {
  id: string;
  home: { name: string } | null;
  away: { name: string } | null;
}

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const force = process.argv.includes("--force");
  const limit = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 12);

  const { data } = await sb
    .from("matches")
    .select("id, home:home_team_id(name), away:away_team_id(name)")
    .eq("status", "scheduled")
    .order("kickoff_at")
    .limit(limit);
  const matches = (data as MRow[] | null) ?? [];
  // 以模型概率为锚（替代生成时常为默认值的社区倍率，避免热门/冷门判反）。
  const probMap = await latestMatchProbs(sb, matches.map((m) => m.id));

  let n = 0;
  let skipped = 0;
  for (const m of matches) {
    if (!force) {
      const { data: ex } = await sb
        .from("ai_content")
        .select("id")
        .eq("match_id", m.id)
        .eq("type", "sentiment")
        .maybeSingle();
      if (ex) continue;
    }

    const probs = probMap.get(m.id);
    if (!probs) {
      skipped++; // 无模型概率快照：无法判定热门/冷门，留待引擎写快照后再生成
      continue;
    }

    const home = teamZh(m.home?.name ?? "?");
    const away = teamZh(m.away?.name ?? "?");
    const body = await generateSentiment(home, away, probs);
    await upsertContent(sb, m.id, "sentiment", body);
    console.log(`✓ ${home} vs ${away}`);
    n++;
  }
  console.log(`✓ 生成 ${n} 条冷热门看点${skipped ? `（${skipped} 场缺概率快照跳过）` : ""}`);
}

main().catch((e) => {
  console.error("✗ 失败:", e?.message ?? e);
  process.exit(1);
});
