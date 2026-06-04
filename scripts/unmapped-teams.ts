// 列出数据库里"未映射中文名"的球队（teamZh 原样返回的），便于一次补全。
import { createClient } from "@supabase/supabase-js";
import { teamZh } from "../src/lib/football/teams";
process.loadEnvFile(".env.local");
async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const { data } = await sb.from("teams").select("name");
  const names = ((data as { name: string }[] | null) ?? []).map((t) => t.name).sort();
  const unmapped = names.filter((n) => teamZh(n) === n);
  console.log(`总队数 ${names.length}，未映射 ${unmapped.length}:`);
  console.log(unmapped);
}
main().catch((e) => { console.error(e?.message ?? e); process.exit(1); });
