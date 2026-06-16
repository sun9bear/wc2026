/**
 * 球员候选灌库（幂等 upsert，按 slug）。
 * 走直连串（与 migrate.ts 同机制，经 154 隧道）——本机无 SUPABASE_SECRET_KEY，故不走 PostgREST。
 * 运行：先起隧道（见记忆 wc2026-supabase-db-tunnel），再
 *   $env:SUPABASE_DB_URL='postgresql://...@127.0.0.1:15432/postgres'; npx tsx scripts/seed-players.ts
 */
import { Client } from "pg";
import { PLAYERS } from "../src/data/players.seed";

process.loadEnvFile(".env.local");

async function main(): Promise<void> {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) throw new Error("缺少 SUPABASE_DB_URL（检查 .env.local 或 $env 覆盖）");

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const p of PLAYERS) {
      await client.query(
        `insert into players (slug, name, team_name, country_iso, position, wiki_title, source, is_active)
         values ($1, $2, $3, $4, $5, $6, 'seed', true)
         on conflict (slug) do update set
           name = excluded.name,
           team_name = excluded.team_name,
           country_iso = excluded.country_iso,
           position = excluded.position,
           wiki_title = excluded.wiki_title,
           is_active = true`,
        [p.slug, p.name, p.teamName, p.countryIso, p.position, p.wikiTitle]
      );
    }
    console.log(`✓ 已灌入/更新 ${PLAYERS.length} 名球员`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("✗ seed-players 失败:", e);
  process.exit(1);
});
