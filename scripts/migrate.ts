/**
 * 迁移运行器：用直连串执行 supabase/migrations 下的 SQL（DDL 必须走直连，PostgREST 不行）。
 * 运行：npx tsx scripts/migrate.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

process.loadEnvFile(".env.local");

async function main(): Promise<void> {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) throw new Error("缺少 SUPABASE_DB_URL（检查 .env.local）");

  const file = path.resolve("supabase/migrations/0001_core.sql");
  const sql = readFileSync(file, "utf8");

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("✓ 已应用 migration: 0001_core.sql");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("✗ migration 失败:", e);
  process.exit(1);
});
