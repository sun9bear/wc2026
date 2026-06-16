import { unstable_cache } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { getScorers, type Scorer } from "@/lib/football/getScorers";
import { buildGoalsMap, normalizeName } from "@/lib/players/perfScore";
import { composeRanking, type RankedPlayer } from "@/lib/players/rankingMath";

export type { RankedPlayer } from "@/lib/players/rankingMath";

// 人气榜读取（服务端 service_role 绕 RLS）。合成「投票55% + 表现30% + 热度15%」。
// 投票=player_vote_counts 视图；热度=player_metrics.buzz_raw；表现=getScorers 进球按名匹配。
interface PlayerRow {
  id: string;
  slug: string;
  name: string;
  team_name: string;
  country_iso: string | null;
  position: string | null;
}
interface CountRow {
  player_id: string;
  votes: number;
}
interface MetricRow {
  player_id: string;
  buzz_raw: number;
  ai_blurb: string | null;
  ai_blurb_en: string | null;
}

async function fetchRanking(): Promise<RankedPlayer[]> {
  const db = getServerSupabase();
  const [pRes, cRes, mRes, scorers] = await Promise.all([
    db.from("players").select("id, slug, name, team_name, country_iso, position").eq("is_active", true),
    db.from("player_vote_counts").select("player_id, votes"),
    db.from("player_metrics").select("player_id, buzz_raw, ai_blurb, ai_blurb_en"),
    getScorers().catch((): Scorer[] => []),
  ]);

  const players = (pRes.data as PlayerRow[] | null) ?? [];
  const counts = (cRes.data as CountRow[] | null) ?? [];
  const metrics = (mRes.data as MetricRow[] | null) ?? [];

  const voteMap = new Map(counts.map((c) => [c.player_id, Number(c.votes)] as const));
  const buzzMap = new Map(metrics.map((m) => [m.player_id, Number(m.buzz_raw)] as const));
  const zhMap = new Map(metrics.map((m) => [m.player_id, m.ai_blurb] as const));
  const enMap = new Map(metrics.map((m) => [m.player_id, m.ai_blurb_en] as const));
  const goalsMap = buildGoalsMap(scorers);

  return composeRanking(
    players.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      teamName: p.team_name,
      countryIso: p.country_iso,
      position: p.position,
      votes: voteMap.get(p.id) ?? 0,
      buzz: buzzMap.get(p.id) ?? 0,
      goals: goalsMap.get(normalizeName(p.name)) ?? 0,
      blurbZh: zhMap.get(p.id) ?? null,
      blurbEn: enMap.get(p.id) ?? null,
    }))
  );
}

// 缓存 60s（v2 综合指数）。投票实时性靠客户端乐观更新，SSR 在 60s 内收敛真值。
export const getRanking = unstable_cache(fetchRanking, ["player-ranking-v2"], { revalidate: 60 });
