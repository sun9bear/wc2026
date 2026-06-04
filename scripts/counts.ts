import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env.local");
async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  for (const t of ["tournaments", "teams", "matches", "markets", "selections"]) {
    const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
    console.log(t, error ? `ERR ${error.message}` : count);
  }
  const { data: sample } = await sb.from("matches").select("id, external_id, kickoff_at").limit(3);
  console.log("matches sample:", sample);
}
main().catch((e) => { console.error(e?.message ?? e); process.exit(1); });
