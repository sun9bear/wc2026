// 球队官方阵容聚合（队页内容加深）：读 CodeX 采集的官方 26 人名单（squad_* 表）。
// squad_* 表 RLS 仅 grant service_role → 必须用 getServerSupabase()（service key 绕过 RLS）。
// 站内英文队名 → squad_teams.team_name：多数同名（ilike 容错大小写），7 个对不上用别名表
//   （取自 docs/SQUAD-DATA-FOR-CONTENT-READINESS.md 的逐条核查）。
// 合规：只取公开事实（号/位/名/俱乐部/年龄/caps/进球/教练/平均年龄·身高）；
//   绝不取队徽 fd_crest_url（版权）、球员照片、0009 的 11 维游戏属性。

import { unstable_cache } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { normalizeNameSorted } from "@/lib/players/perfScore";

// 站内 teams.name → squad_teams.team_name（仅这 7 处与 squad 侧不同名；其余按名 ilike 直配）。
const NAME_ALIAS: Record<string, string> = {
  "Cape Verde Islands": "Cabo Verde",
  Iran: "IR Iran",
  "Ivory Coast": "Côte D'Ivoire",
  "South Korea": "Korea Republic",
  Turkey: "Türkiye",
  "United States": "USA",
  "Bosnia and Herzegovina": "Bosnia And Herzegovina",
};

export type PositionGroup = "GK" | "DF" | "MF" | "FW";

export interface SquadPlayer {
  no: number | null;
  pos: PositionGroup | null;
  name: string;
  nameZh: string | null;
  club: string | null;
  age: number | null;
  caps: number | null;
  goals: number | null; // 国家队生涯进球（international_goals）
  popSlug: string | null; // 若该球员有人气详情页 /player/[slug] 则附 slug，否则 null
}

export interface TeamSquad {
  fifaCode: string;
  teamName: string;
  coach: string | null;
  coachNationality: string | null;
  playerCount: number | null;
  posCounts: Record<PositionGroup, number>;
  avgAge: number | null;
  avgHeightCm: number | null;
  totalCaps: number | null;
  totalGoals: number | null;
  players: SquadPlayer[]; // 按号码升序
}

interface TeamRow {
  id: string;
  fifa_code: string;
  team_name: string;
  player_count: number | null;
  gk_count: number | null;
  df_count: number | null;
  mf_count: number | null;
  fw_count: number | null;
  avg_age: number | null;
  avg_height_cm: number | null;
  total_caps: number | null;
  total_goals: number | null;
  head_coach_name: string | null;
  head_coach_nationality: string | null;
}
interface PlayerRow {
  squad_no: number | null;
  position_group: string | null;
  player_name: string;
  player_name_zh: string | null;
  club: string | null;
  age_at_tournament_start: number | null;
  caps: number | null;
  international_goals: number | null;
}

const num = (v: number | string | null): number | null =>
  v == null ? null : typeof v === "string" ? Number(v) : v;

async function computeTeamSquad(teamName: string): Promise<TeamSquad | null> {
  const resolved = NAME_ALIAS[teamName] ?? teamName;
  const sb = getServerSupabase();

  const { data: t } = await sb
    .from("squad_teams")
    .select(
      "id, fifa_code, team_name, player_count, gk_count, df_count, mf_count, fw_count, avg_age, avg_height_cm, total_caps, total_goals, head_coach_name, head_coach_nationality"
    )
    .eq("source_pool", "wc2026")
    .ilike("team_name", resolved)
    .maybeSingle();
  const team = t as TeamRow | null;
  if (!team) return null;

  const { data: pr } = await sb
    .from("squad_players")
    .select(
      "squad_no, position_group, player_name, player_name_zh, club, age_at_tournament_start, caps, international_goals"
    )
    .eq("squad_team_id", team.id)
    .order("squad_no", { ascending: true });
  const rows = (pr as PlayerRow[] | null) ?? [];
  if (rows.length === 0) return null;

  // 人气榜 slug 映射：41 名精选球星，全局 token 排序名匹配（碰撞风险可忽略）。
  // 有页才链接 → 多数阵容球员 popSlug=null（人气榜仅覆盖明星）。
  const { data: pop } = await sb.from("players").select("slug, name").eq("is_active", true);
  const popMap = new Map<string, string>();
  for (const r of (pop as { slug: string; name: string }[] | null) ?? []) {
    const k = normalizeNameSorted(r.name);
    if (k) popMap.set(k, r.slug);
  }

  const players: SquadPlayer[] = rows.map((p) => ({
    no: p.squad_no,
    pos: (p.position_group as PositionGroup | null) ?? null,
    name: p.player_name,
    nameZh: p.player_name_zh,
    club: p.club,
    age: p.age_at_tournament_start,
    caps: p.caps,
    goals: p.international_goals,
    popSlug: popMap.get(normalizeNameSorted(p.player_name)) ?? null,
  }));

  return {
    fifaCode: team.fifa_code,
    teamName: team.team_name,
    coach: team.head_coach_name,
    coachNationality: team.head_coach_nationality,
    playerCount: team.player_count,
    posCounts: {
      GK: team.gk_count ?? 0,
      DF: team.df_count ?? 0,
      MF: team.mf_count ?? 0,
      FW: team.fw_count ?? 0,
    },
    avgAge: num(team.avg_age),
    avgHeightCm: num(team.avg_height_cm),
    totalCaps: team.total_caps,
    totalGoals: team.total_goals,
    players,
  };
}

/** 球队官方阵容；未匹配或无球员返回 null。teamName 进缓存键；阵容基本静态，缓存 1 天。 */
export const getTeamSquad = unstable_cache(computeTeamSquad, ["team-squad-v1"], {
  revalidate: 86400,
});
