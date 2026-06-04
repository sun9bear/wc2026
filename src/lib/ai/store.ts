import type { SupabaseClient } from "@supabase/supabase-js";

// 幂等写入一条 AI 内容（preview / recap / sentiment）。依赖 ai_content 的 unique(match_id,type)。
export async function upsertContent(
  db: SupabaseClient,
  matchId: string,
  type: string,
  body: string
): Promise<void> {
  const { error } = await db
    .from("ai_content")
    .upsert({ match_id: matchId, type, body }, { onConflict: "match_id,type" });
  if (error) throw error;
}
