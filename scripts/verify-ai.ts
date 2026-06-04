/** 安全闸：把 ai_content 里所有内容重新过雷词 lint，报告任何违规；并抽样打印。 */
import { createClient } from "@supabase/supabase-js";
import { findBannedTerms } from "../src/lib/compliance/bannedTerms";

process.loadEnvFile(".env.local");

interface Row {
  type: string;
  body: string;
}

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const { data } = await sb.from("ai_content").select("type, body");
  const rows = (data as Row[] | null) ?? [];

  let bad = 0;
  const byType: Record<string, number> = {};
  for (const r of rows) {
    byType[r.type] = (byType[r.type] ?? 0) + 1;
    const hits = findBannedTerms(r.body, "zh");
    if (hits.length > 0) {
      bad++;
      console.log(`✗ [${r.type}] 命中雷词 ${JSON.stringify(hits)}: ${r.body}`);
    }
  }

  console.log(`总计 ${rows.length} 条`, byType);
  console.log(bad === 0 ? "✓ 全部通过合规雷词检查" : `✗ ${bad} 条违规`);

  // 各类型抽一条样例
  for (const t of ["preview", "sentiment", "recap"]) {
    const sample = rows.find((r) => r.type === t);
    if (sample) console.log(`\n【${t} 样例】\n${sample.body}`);
  }
}

main().catch((e) => {
  console.error("✗", e?.message ?? e);
  process.exit(1);
});
