// 概率数据管道（无状态 v1）：按需计算 + Next.js 数据缓存（1 小时），不依赖新建表。
// 数据源：库内赛程比分（anon 只读）→ football-data 最新完赛比分合并（有 key 时）
//        → The Odds API 多机构共识（有 key 时，单次 1 credit）→ eloratings.net 实力评分
// 输出：纯 JSON（unstable_cache 要求可序列化）。任何外部源失败都降级，绝不抛给页面。

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase/client";
import { getServerSupabase } from "@/lib/supabase/server";
import { teamZh, flagUrl } from "@/lib/football/teams";
import { chat } from "@/lib/ai/deepseek";
import { findBannedTerms } from "@/lib/compliance/bannedTerms";
import { consensus, fuse } from "./devig";
import { lambdasFromElo, scoreMatrix, matrixTo1x2, topScores, calibrateToTarget } from "./poisson";
import { parseWorldTsv, parseTeamsTsv, eloFor } from "./elo";
import { normalizeTeamName } from "./names";
import { simulateTournament, matrixToCdf, type SimMatch } from "./simulate";
import { rankGroup, rankThirds, mulberry32 } from "./standings";
import type { GroupResult, Probs1x2 } from "./types";

const RUNS = 10000;
const HOSTS = new Set(["united states", "mexico", "canada"]);

export interface TeamView {
  id: string;
  name: string;
  zh: string;
  flag: string | null;
  pts: number;
  played: number;
  gd: number;
  gf: number;
  pAdvance: number;
  pChampion: number;
}
export interface MatchView {
  id: string;
  kickoff: string;
  homeId: string;
  awayId: string;
  home: { name: string; zh: string; flag: string | null };
  away: { name: string; zh: string; flag: string | null };
  p: Probs1x2;
  market: Probs1x2 | null;
  model: Probs1x2;
  books: number;
  topScores: { h: number; a: number; p: number }[];
  likely: "h" | "d" | "a";
}
export interface ForecastData {
  updatedAt: string;
  oddsOk: boolean;
  eloOk: boolean;
  simOk: boolean;
  groups: { letter: string; table: TeamView[] }[];
  champions: { id: string; name: string; zh: string; flag: string | null; p: number; pFinal: number }[];
  thirds: { id: string; name: string; zh: string; flag: string | null; letter: string; pts: number; gd: number; gf: number; rank: number }[];
  matches: MatchView[];
  played: GroupResult[];
  rating: Record<string, number>;
  groupTeams: Record<string, string[]>;
  noteZh: string | null;
  noteEn: string | null;
}

interface TeamRow {
  id: string;
  name: string;
  grp: string | null;
  flag: string | null;
}
interface MatchRow {
  id: string;
  kickoff_at: string;
  status: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  external_id: number | null;
}

async function safeFetchText(url: string, ms = 10000): Promise<string | null> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    const r = await fetch(url, { signal: c.signal, next: { revalidate: 3600 } });
    clearTimeout(t);
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
}

async function computeForecast(): Promise<ForecastData> {
  // 1) 库内队伍与赛程
  const { data: teamData } = await supabase.from("teams").select("id, name, grp, flag");
  const { data: matchData } = await supabase
    .from("matches")
    .select(
      "id, kickoff_at, status, home_team_id, away_team_id, home_score, away_score, external_id"
    )
    .order("kickoff_at");
  const teams = (teamData as TeamRow[] | null) ?? [];
  const matches = (matchData as MatchRow[] | null) ?? [];
  const tById = new Map(teams.map((t) => [t.id, t]));

  // grp 库内格式如 "A 组"——归一化为裸字母（淘汰赛结构与 Annex C 查表都用 A-L）
  const groupTeams: Record<string, string[]> = {};
  for (const t of teams) {
    const letter = t.grp?.match(/[A-L]/)?.[0];
    if (!letter) continue;
    (groupTeams[letter] ??= []).push(t.id);
  }

  // 2) football-data 最新完赛比分（修补每日结算 cron 之间的窗口；无 key/失败则跳过）
  const freshScores = new Map<number, { h: number; a: number }>();
  const fdKey = process.env.FOOTBALL_API_KEY;
  if (fdKey) {
    try {
      const r = await fetch(
        "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
        { headers: { "X-Auth-Token": fdKey }, next: { revalidate: 3600 } }
      );
      if (r.ok) {
        const j = (await r.json()) as {
          matches: { id: number; score?: { fullTime?: { home: number | null; away: number | null } } }[];
        };
        for (const m of j.matches ?? []) {
          const ft = m.score?.fullTime;
          if (ft?.home != null && ft?.away != null) freshScores.set(m.id, { h: ft.home, a: ft.away });
        }
      }
    } catch {
      /* 降级 */
    }
  }

  const letterOf = (id: string) => tById.get(id)?.grp?.match(/[A-L]/)?.[0] ?? null;
  const isGroupMatch = (m: MatchRow) => {
    const g1 = letterOf(m.home_team_id);
    return g1 !== null && g1 === letterOf(m.away_team_id);
  };
  const played: GroupResult[] = [];
  const remainingRows: MatchRow[] = [];
  for (const m of matches) {
    if (!isGroupMatch(m)) continue;
    let hs = m.home_score;
    let as = m.away_score;
    if ((hs == null || as == null) && m.external_id != null) {
      const f = freshScores.get(m.external_id);
      if (f) {
        hs = f.h;
        as = f.a;
      }
    }
    if (hs != null && as != null) {
      played.push({ homeId: m.home_team_id, awayId: m.away_team_id, homeGoals: hs, awayGoals: as });
    } else {
      remainingRows.push(m);
    }
  }

  // 3) Elo 实力评分
  const [worldTsv, teamsTsv] = await Promise.all([
    safeFetchText("https://www.eloratings.net/World.tsv"),
    safeFetchText("https://www.eloratings.net/en.teams.tsv"),
  ]);
  const eloOk = !!(worldTsv && teamsTsv);
  const codeToElo = worldTsv ? parseWorldTsv(worldTsv) : new Map<string, number>();
  const nameToCode = teamsTsv ? parseTeamsTsv(teamsTsv) : new Map<string, string>();
  const rating = new Map<string, number>();
  for (const t of teams) {
    rating.set(t.id, (eloOk ? eloFor(t.name, nameToCode, codeToElo) : null) ?? 1600);
  }

  // 4) 多机构报价共识（The Odds API；无 key/失败则纯模型）
  type Prices = { home: number; draw: number; away: number }[];
  const oddsIdx = new Map<string, Prices>();
  let oddsOk = false;
  const oddsKey = process.env.THE_ODDS_API_KEY;
  if (oddsKey) {
    try {
      const r = await fetch(
        `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/?apiKey=${oddsKey}&regions=eu&markets=h2h&oddsFormat=decimal`,
        { next: { revalidate: 3600 } }
      );
      if (r.ok) {
        const events = (await r.json()) as {
          home_team: string;
          away_team: string;
          bookmakers: { markets: { key: string; outcomes: { name: string; price: number }[] }[] }[];
        }[];
        for (const e of events) {
          const prices: Prices = [];
          for (const b of e.bookmakers ?? []) {
            const m = b.markets?.find((x) => x.key === "h2h");
            if (!m) continue;
            let home = 0;
            let draw = 0;
            let away = 0;
            for (const o of m.outcomes ?? []) {
              if (o.name === e.home_team) home = o.price;
              else if (o.name === e.away_team) away = o.price;
              else draw = o.price;
            }
            if (home > 1 && draw > 1 && away > 1) prices.push({ home, draw, away });
          }
          if (prices.length) {
            oddsIdx.set(
              `${normalizeTeamName(e.home_team)}|${normalizeTeamName(e.away_team)}`,
              prices
            );
          }
        }
        oddsOk = true;
      }
    } catch {
      /* 降级 */
    }
  }

  // 5) 每场剩余小组赛的概率（市场共识 + Elo 模型 → 融合 → 比分矩阵校准）
  const simMatches: SimMatch[] = [];
  const matchViews: MatchView[] = [];
  for (const m of remainingRows) {
    const home = tById.get(m.home_team_id);
    const away = tById.get(m.away_team_id);
    if (!home || !away) continue;
    const hostAdv = HOSTS.has(normalizeTeamName(home.name)) ? 100 : 0;
    const seed = lambdasFromElo(rating.get(home.id)!, rating.get(away.id)!, hostAdv);
    const model = matrixTo1x2(scoreMatrix(seed.home, seed.away));

    const key = `${normalizeTeamName(home.name)}|${normalizeTeamName(away.name)}`;
    const rkey = `${normalizeTeamName(away.name)}|${normalizeTeamName(home.name)}`;
    let prices = oddsIdx.get(key) ?? null;
    let swapped = false;
    if (!prices && oddsIdx.has(rkey)) {
      prices = oddsIdx.get(rkey)!;
      swapped = true;
    }
    let market: Probs1x2 | null = null;
    let books = 0;
    if (prices) {
      const c = consensus(prices);
      books = c.books;
      market = c.p && swapped ? { home: c.p.away, draw: c.p.draw, away: c.p.home } : c.p;
    }
    const fused = fuse(market, model, books);
    const cal = calibrateToTarget(seed.home, seed.away, fused);

    simMatches.push({ homeId: home.id, awayId: away.id, cdf: matrixToCdf(cal.matrix) });
    const likely: "h" | "d" | "a" =
      fused.home >= fused.draw && fused.home >= fused.away
        ? "h"
        : fused.away >= fused.draw
          ? "a"
          : "d";
    matchViews.push({
      id: m.id,
      kickoff: m.kickoff_at,
      homeId: home.id,
      awayId: away.id,
      home: { name: home.name, zh: teamZh(home.name), flag: flagUrl(home.name) },
      away: { name: away.name, zh: teamZh(away.name), flag: flagUrl(away.name) },
      p: fused,
      market,
      model,
      books,
      topScores: topScores(cal.matrix, 5),
      likely,
    });
  }

  // 6) 蒙特卡洛（结构完整才跑：12 组 × 4 队）
  const letters = Object.keys(groupTeams).sort();
  let simOk = letters.length === 12 && letters.every((g) => groupTeams[g].length === 4);
  let teamProbs = new Map<string, import("./types").TeamProb>();
  if (simOk) {
    try {
      teamProbs = simulateTournament({
        groups: groupTeams,
        played,
        remaining: simMatches,
        rating,
        runs: RUNS,
      });
    } catch {
      simOk = false; // 模拟失败只降级该板块，不影响积分榜/单场概率
    }
  }

  // 7) 当前积分榜与第三名表（仅真实结果，确定性）
  const rng = mulberry32(1);
  const groupsOut: { letter: string; table: TeamView[] }[] = [];
  const thirdRowsNow: { row: ReturnType<typeof rankGroup>[number]; letter: string }[] = [];
  for (const g of letters) {
    const order = rankGroup(groupTeams[g], played, rng, rating);
    groupsOut.push({
      letter: g,
      table: order.map((r) => {
        const t = tById.get(r.teamId)!;
        const tp = teamProbs.get(r.teamId);
        return {
          id: r.teamId,
          name: t.name,
          zh: teamZh(t.name),
          flag: flagUrl(t.name),
          pts: r.pts,
          played: r.played,
          gd: r.gd,
          gf: r.gf,
          pAdvance: tp?.pAdvance ?? 0,
          pChampion: tp?.pChampion ?? 0,
        };
      }),
    });
    if (order[2]) thirdRowsNow.push({ row: order[2], letter: g });
  }
  const thirdsRanked = rankThirds(
    thirdRowsNow.map((x) => x.row),
    rng,
    rating
  );
  const thirds = thirdsRanked.map((teamId, i) => {
    const t = tById.get(teamId)!;
    const info = thirdRowsNow.find((x) => x.row.teamId === teamId)!;
    return {
      id: teamId,
      name: t.name,
      zh: teamZh(t.name),
      flag: flagUrl(t.name),
      letter: info.letter,
      pts: info.row.pts,
      gd: info.row.gd,
      gf: info.row.gf,
      rank: i + 1,
    };
  });

  const champions = [...teamProbs.values()]
    .sort((a, b) => b.pChampion - a.pChampion)
    .slice(0, 12)
    .map((tp) => {
      const t = tById.get(tp.teamId)!;
      return {
        id: tp.teamId,
        name: t.name,
        zh: teamZh(t.name),
        flag: flagUrl(t.name),
        p: tp.pChampion,
        pFinal: tp.pFinal,
      };
    });

  // 8) AI 双语短评（可选；任何失败都返回 null，雷词 fail-closed）
  let noteZh: string | null = null;
  let noteEn: string | null = null;
  if (process.env.DEEPSEEK_API_KEY && champions.length >= 3) {
    const top3 = champions
      .slice(0, 3)
      .map((c) => `${c.zh} ${(c.p * 100).toFixed(1)}%`)
      .join("、");
    try {
      const zh = await chat(
        "你是足球数据解说员，为一款纯娱乐预测游戏写一句话点评（40-80字中文）。禁止出现任何博彩相关字眼（投注/下注/赌/赔率/盘口等），只谈概率与看点，语气轻松。",
        `当前模型测算的夺冠概率前三：${top3}。写一句话点评。`,
        8000
      );
      if (findBannedTerms(zh, "zh").length === 0) noteZh = zh;
    } catch {
      /* 降级 */
    }
    try {
      const top3en = champions
        .slice(0, 3)
        .map((c) => `${c.name} ${(c.p * 100).toFixed(1)}%`)
        .join(", ");
      const en = await chat(
        "You write one playful sentence (20-40 words, English) for a free football prediction game. Strictly avoid any betting vocabulary (bet, odds, wager, bookmaker, parlay, stake, payout). Talk only about win probability and storylines.",
        `Model title chances right now: ${top3en}. One sentence.`,
        8000
      );
      if (findBannedTerms(en, "en").length === 0) noteEn = en;
    } catch {
      /* 降级 */
    }
  }

  // 9) 历史快照写入（表已建且有 service key 时生效；任何失败都不影响页面）
  if (process.env.SUPABASE_SECRET_KEY && simOk) {
    try {
      const db = getServerSupabase();
      await db.from("prob_team_snapshots").insert(
        [...teamProbs.values()].map((t) => ({
          team_id: t.teamId,
          p_advance: t.pAdvance,
          p_r16: t.pR16,
          p_qf: t.pQF,
          p_sf: t.pSF,
          p_final: t.pFinal,
          p_champion: t.pChampion,
          runs: RUNS,
        }))
      );
      await db.from("prob_match_snapshots").insert(
        matchViews.map((m) => ({
          match_id: m.id,
          p_home: m.p.home,
          p_draw: m.p.draw,
          p_away: m.p.away,
          market: m.market,
          model: m.model,
          books: m.books,
          top_scores: m.topScores,
        }))
      );
    } catch {
      /* 表未建或瞬时故障：静默降级 */
    }
  }

  return {
    updatedAt: new Date().toISOString(),
    oddsOk,
    eloOk,
    simOk,
    groups: groupsOut,
    champions,
    thirds,
    matches: matchViews,
    played,
    rating: Object.fromEntries(rating),
    groupTeams,
    noteZh,
    noteEn,
  };
}

/** 缓存入口：每小时最多重算一次（也即 The Odds API 最多 24 credits/天）。 */
export const getForecast = unstable_cache(computeForecast, ["forecast-v1"], {
  revalidate: 3600,
});
