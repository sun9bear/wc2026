/**
 * 赛程 seed 脚本（Foundation 阶段仅编写、未运行）。
 * 运行前提：在 .env.local 配置好 Supabase 服务端密钥后，执行 `npm run seed`。
 * TODO：配置 DB 后实现对 tournaments/teams/matches 的幂等 upsert。
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { getServerSupabase } from "../src/lib/supabase/server";

interface SeedTeam {
  name: string;
  group: string;
  flag: string;
}
interface SeedMatch {
  home: string;
  away: string;
  stage: string;
  group: string;
  kickoffAt: string;
}

async function main(): Promise<void> {
  const db = getServerSupabase();
  void db; // 占位：DB 配置后用于写入
  const teams = JSON.parse(
    readFileSync(path.resolve("supabase/seed/teams.json"), "utf8")
  ) as SeedTeam[];
  const matches = JSON.parse(
    readFileSync(path.resolve("supabase/seed/matches.json"), "utf8")
  ) as SeedMatch[];
  console.log(`待插入 ${teams.length} 支球队、${matches.length} 场比赛`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
