// 单场「最可能的比分」分布（展示用）：读该场最新一张 prob_match_snapshots 的 top_scores。
// 数据由概率引擎（pipeline.ts step 9）每小时写入；本文件只读最新一张，不重算。
// 未开赛/进行中的小组赛有快照；淘汰赛（队伍未定）或无历史的场次返回 null（前端降级不渲染）。
// 合规：对外措辞一律「最可能的比分 / Most likely results」，绝不用 correct score/赔率 等博彩词。

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase/client";

export interface ScoreCell {
  h: number;
  a: number;
  p: number; // 0-1
}
export interface MatchScoreline {
  top: ScoreCell[]; // 概率降序的最可能比分（引擎存 Top 5）
  otherP: number; // 其余所有比分的概率合计（1 - Σtop，钳到 [0,1]）
  updatedAt: string; // 快照时间（ISO）
}

interface SnapRow {
  created_at: string;
  top_scores: ScoreCell[] | null;
}

async function computeMatchScoreline(matchId: string): Promise<MatchScoreline | null> {
  const { data } = await supabase
    .from("prob_match_snapshots")
    .select("created_at, top_scores")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(1);
  const row = (data as SnapRow[] | null)?.[0];
  const top = row?.top_scores;
  if (!row || !Array.isArray(top) || top.length === 0) return null;

  // 防御：归一化字段并按概率降序（引擎已排序，这里再保一手）。
  const cells = top
    .filter((c) => Number.isFinite(c?.h) && Number.isFinite(c?.a) && Number.isFinite(c?.p))
    .map((c) => ({ h: c.h, a: c.a, p: Number(c.p) }))
    .sort((x, y) => y.p - x.p);
  if (cells.length === 0) return null;

  const sum = cells.reduce((s, c) => s + c.p, 0);
  const otherP = Math.min(1, Math.max(0, 1 - sum));
  return { top: cells, otherP, updatedAt: row.created_at };
}

/** 单场比分分布；无快照返回 null。matchId 进缓存键，缓存 600s（与引擎写入节奏匹配）。 */
export const getMatchScoreline = unstable_cache(computeMatchScoreline, ["match-scoreline-v1"], {
  revalidate: 600,
});
