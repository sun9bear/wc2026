// 球队详情聚合（任务 B）：出线/夺冠概率 + 模型实力评分(Elo) + 最近 5 场战绩 + 下一场。
// 概率/评分来自 getForecast()（万次蒙特卡洛 + Elo）；战绩/下一场直接读 matches 表（anon 只读）。
// 合规：实力评分对外标「模型实力评分」，绝不写「官方 FIFA 排名/身价」（见 NEXT-SESSION 数据源结论）。

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase/client";
import { getForecast } from "./pipeline";
import { findTeam, teamSlug, normalizeSlug } from "./findTeam";
import { teamZh, flagUrl } from "@/lib/football/teams";

export interface TeamResult {
  matchId: string;
  kickoff: string;
  oppName: string;
  oppZh: string;
  oppFlag: string | null;
  gf: number; // 本队进球
  ga: number; // 对手进球
  outcome: "W" | "D" | "L";
  home: boolean; // 本队是否主场
}
export interface TeamNext {
  matchId: string;
  kickoff: string;
  oppName: string;
  oppZh: string;
  oppFlag: string | null;
  home: boolean;
}
export interface TeamDetail {
  id: string;
  name: string;
  zh: string;
  slug: string;
  flag: string | null;
  letter: string;
  rank: number;
  pts: number;
  played: number;
  gd: number;
  gf: number;
  pAdvance: number; // 0-1
  pChampion: number; // 0-1
  rating: number; // Elo 模型实力评分
  recent: TeamResult[];
  next: TeamNext | null;
  updatedAt: string;
}

interface MatchRow {
  id: string;
  kickoff_at: string;
  status: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  home: { name: string } | null;
  away: { name: string } | null;
}

async function computeTeamDetail(slug: string): Promise<TeamDetail | null> {
  const data = await getForecast();
  const hit = findTeam(data, slug);
  if (!hit) return null;
  const t = hit.team;

  // 该队所有相关比赛（主或客），按开球时间倒序。
  const { data: rows } = await supabase
    .from("matches")
    .select(
      "id, kickoff_at, status, home_team_id, away_team_id, home_score, away_score, home:home_team_id(name), away:away_team_id(name)"
    )
    .or(`home_team_id.eq.${t.id},away_team_id.eq.${t.id}`)
    .order("kickoff_at", { ascending: false });
  const matches = (rows as unknown as MatchRow[] | null) ?? [];

  const recent: TeamResult[] = [];
  const upcoming: TeamNext[] = [];
  const now = Date.now();
  for (const m of matches) {
    const isHome = m.home_team_id === t.id;
    const opp = isHome ? m.away : m.home;
    const oppName = opp?.name ?? "?";
    const base = {
      matchId: m.id,
      kickoff: m.kickoff_at,
      oppName,
      oppZh: teamZh(oppName),
      oppFlag: flagUrl(oppName),
      home: isHome,
    };
    if (m.status === "settled" && m.home_score != null && m.away_score != null) {
      const gf = isHome ? m.home_score : m.away_score;
      const ga = isHome ? m.away_score : m.home_score;
      if (recent.length < 5) {
        recent.push({
          ...base,
          gf,
          ga,
          outcome: gf > ga ? "W" : gf < ga ? "L" : "D",
        });
      }
    } else if (new Date(m.kickoff_at).getTime() >= now) {
      upcoming.push(base);
    }
  }
  // upcoming 取最近一场（倒序里最后一个未来场 = 时间最早的）。
  const next = upcoming.length ? upcoming[upcoming.length - 1] : null;

  return {
    id: t.id,
    name: t.name,
    zh: t.zh,
    slug: teamSlug(t.name),
    flag: t.flag,
    letter: hit.letter,
    rank: hit.rank,
    pts: t.pts,
    played: t.played,
    gd: t.gd,
    gf: t.gf,
    pAdvance: t.pAdvance,
    pChampion: t.pChampion,
    rating: Math.round(data.rating[t.id] ?? 1600),
    recent,
    next,
    updatedAt: data.updatedAt,
  };
}

// v2：findTeam 改 NFC 归一匹配后 bump 缓存键，作废 pre-fix 旧逻辑缓存的 ç 队名空结果（否则
// 部署后仍可能 revalidate 窗口内回放旧的 null → 软 404 复发）。
const cachedTeamDetail = unstable_cache(computeTeamDetail, ["team-detail-v2"], {
  revalidate: 600,
});

/**
 * 球队详情；slug 未匹配返回 null。缓存 600s（与引擎写入节奏匹配）。
 * slug 先解码 + NFC 归一再进缓存键：Next 对非 ASCII 段（Curaçao）在 page/generateMetadata 间
 * 解码不一致（"curaçao" vs 原始 "cura%C3%A7ao"），不归一会生成错配缓存键 + 软 404。见 normalizeSlug。
 */
export function getTeamDetail(slug: string): Promise<TeamDetail | null> {
  return cachedTeamDetail(normalizeSlug(slug));
}
