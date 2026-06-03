/**
 * 连通性 + 数据自检：用 supabase-js（HTTPS/443）查 matches。
 * 运行：npx tsx scripts/check-db.ts
 */
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("缺少 Supabase 环境变量（检查 .env.local）");

  const sb = createClient(url, key);
  const { data, error } = await sb
    .from("matches")
    .select(
      "id, kickoff_at, stage, home:home_team_id(name, flag, grp), away:away_team_id(name, flag)"
    )
    .order("kickoff_at");

  if (error) {
    console.log("⚠️ 查询返回错误（若提示表不存在，说明连接 OK 但还没建表）:");
    console.log("   ", error.message);
    return;
  }
  console.log(`✓ HTTPS 连接 OK，matches 行数: ${data?.length ?? 0}`);
  console.log(data);
}

main().catch((e) => {
  console.error("✗ 连接失败:", e?.message ?? e);
  process.exit(1);
});
