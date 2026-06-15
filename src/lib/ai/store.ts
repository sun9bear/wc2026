import type { SupabaseClient } from "@supabase/supabase-js";
import type { Win1x2 } from "./content";

// 取一批比赛各自最新一张快照的模型胜平负概率（与 /api/live 同源 prob_match_snapshots）。
// 供 AI 前瞻/冷热门以真实概率为锚（替代生成时常为默认值的社区倍率）。缺快照的场次不入表，调用方降级。
export async function latestMatchProbs(
  db: SupabaseClient,
  matchIds: string[]
): Promise<Map<string, Win1x2>> {
  const out = new Map<string, Win1x2>();
  if (matchIds.length === 0) return out;
  const { data } = await db
    .from("prob_match_snapshots")
    .select("match_id, p_home, p_draw, p_away, created_at")
    .in("match_id", matchIds)
    .order("created_at", { ascending: false });
  const rows =
    (data as { match_id: string; p_home: number; p_draw: number; p_away: number }[] | null) ?? [];
  for (const r of rows) {
    if (out.has(r.match_id)) continue; // created_at desc → 首次命中即最新
    out.set(r.match_id, {
      home: Number(r.p_home),
      draw: Number(r.p_draw),
      away: Number(r.p_away),
    });
  }
  return out;
}

// 幂等写入一条 AI 内容（preview / recap / sentiment）。依赖 ai_content 的 unique(match_id,type)。
export async function upsertContent(
  db: SupabaseClient,
  matchId: string,
  type: string,
  body: string
): Promise<void> {
  // 显式刷新 updated_at：upsert 冲突更新时不会自动更新该列，否则 staleBefore 重生判据永远命中旧值、
  // 导致同几场被反复重生、无法推进（2026-06 修复）。
  const { error } = await db
    .from("ai_content")
    .upsert(
      { match_id: matchId, type, body, updated_at: new Date().toISOString() },
      { onConflict: "match_id,type" }
    );
  if (error) throw error;
}
