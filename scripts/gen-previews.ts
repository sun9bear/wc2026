/**
 * 为即将开赛的比赛批量生成 AI 赛前前瞻并入库（幂等：已有则跳过）。
 * 用法：npx tsx scripts/gen-previews.ts [数量，默认 12]
 * 前提：已跑 supabase/setup-4-ai.sql；.env.local 含 DEEPSEEK_API_KEY。
 */
import { createClient } from "@supabase/supabase-js";
import { generatePreview } from "../src/lib/ai/content";
import { latestMatchProbs, upsertContent } from "../src/lib/ai/store";
import { teamZh } from "../src/lib/football/teams";

process.loadEnvFile(".env.local");

interface MRow {
  id: string;
  stage: string | null;
  home: { name: string } | null;
  away: { name: string } | null;
}

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const force = process.argv.includes("--force");
  const limit = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 12);

  const { data } = await sb
    .from("matches")
    .select("id, stage, home:home_team_id(name), away:away_team_id(name)")
    .eq("status", "scheduled")
    .order("kickoff_at")
    .limit(limit);
  const matches = (data as MRow[] | null) ?? [];
  const probMap = await latestMatchProbs(sb, matches.map((m) => m.id));

  let n = 0;
  for (const m of matches) {
    if (!force) {
      const { data: ex } = await sb
        .from("ai_content")
        .select("id")
        .eq("match_id", m.id)
        .eq("type", "preview")
        .maybeSingle();
      if (ex) continue;
    }

    const home = teamZh(m.home?.name ?? "?");
    const away = teamZh(m.away?.name ?? "?");
    const probs = probMap.get(m.id);
    const body = await generatePreview(home, away, m.stage ?? "小组赛", probs);
    await upsertContent(sb, m.id, "preview", body);
    console.log(`✓ ${home} vs ${away}${probs ? "" : " (无概率快照·降级)"}`);
    n++;
  }
  console.log(`✓ 生成 ${n} 条前瞻`);
}

main().catch((e) => {
  console.error("✗ 失败:", e?.message ?? e);
  process.exit(1);
});
