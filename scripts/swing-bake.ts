/**
 * 爆冷摆动卡预烘焙（任务 6）：终场哨响后 15 分钟内发卡用的 URL 生成器。
 * 用法：npx tsx scripts/swing-bake.ts --match "Japan vs Sweden"
 *
 * baseline：prob_team_snapshots 最新一期两队 p_advance（= 用户赛前看到的公开预测值）；
 * 条件值：把该场强制注入 胜/平/负（比分约定 1-0/1-1/0-1），用导出的 rankGroup/rankThirds +
 *         simulateTournament 跑缩减蒙特卡洛（RUNS=2000，纯 Elo 模型盘口）得三种情景 p_advance。
 * 输出：三种结局 × 两队 × 中英 = 12 条 /api/og swing URL，运营按实际赛果挑对应一条打开另存图。
 * 注意：条件值是模型口径（无市场融合），与快照基线方法略有差异——卡上是趋势对比，可接受。
 */
import { createClient } from "@supabase/supabase-js";
import { lambdasFromElo, scoreMatrix } from "../src/lib/prob/poisson";
import { parseWorldTsv, parseTeamsTsv, eloFor } from "../src/lib/prob/elo";
import { normalizeTeamName } from "../src/lib/prob/names";
import { simulateTournament, matrixToCdf, type SimMatch } from "../src/lib/prob/simulate";
import { teamZh } from "../src/lib/football/teams";
import { teamSlug } from "../src/lib/prob/findTeam";
import type { GroupResult } from "../src/lib/prob/types";

process.loadEnvFile(".env.local");

const RUNS = 2000;
const HOSTS = new Set(["united states", "mexico", "canada"]);
const SITE = "https://www.wc2026.cool";

interface TeamRow {
  id: string;
  name: string;
  grp: string | null;
}
interface MatchRow {
  id: string;
  kickoff_at: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
}

async function safeFetchText(url: string, ms = 10000): Promise<string | null> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    const r = await fetch(url, { signal: c.signal });
    clearTimeout(t);
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
}

function pct(x: number): string {
  return (x * 100).toFixed(0);
}

async function main(): Promise<void> {
  const argIdx = process.argv.indexOf("--match");
  const matchArg = argIdx >= 0 ? process.argv[argIdx + 1] : process.argv[2];
  if (!matchArg || !/\svs?\s/i.test(matchArg)) {
    console.error('用法：npx tsx scripts/swing-bake.ts --match "Japan vs Sweden"');
    process.exit(1);
  }
  const [qHome, qAway] = matchArg.split(/\svs?\s/i).map((s) => s.trim().toLowerCase());

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const db = createClient(url, anon);

  // 1) 队伍与赛程（与 pipeline 同口径：grp 提取裸字母，只看小组赛）
  const { data: teamData } = await db.from("teams").select("id, name, grp");
  const teams = (teamData as TeamRow[] | null) ?? [];
  const tById = new Map(teams.map((t) => [t.id, t]));
  const findId = (q: string) =>
    teams.find((t) => t.name.toLowerCase() === q || teamZh(t.name) === q)?.id ??
    teams.find((t) => t.name.toLowerCase().includes(q))?.id ?? null;
  const homeId = findId(qHome);
  const awayId = findId(qAway);
  if (!homeId || !awayId) {
    console.error(`找不到球队：${!homeId ? qHome : ""} ${!awayId ? qAway : ""}`.trim());
    process.exit(1);
  }

  const groupTeams: Record<string, string[]> = {};
  for (const t of teams) {
    const letter = t.grp?.match(/[A-L]/)?.[0];
    if (letter) (groupTeams[letter] ??= []).push(t.id);
  }

  const { data: matchData } = await db
    .from("matches")
    .select("id, kickoff_at, home_team_id, away_team_id, home_score, away_score")
    .order("kickoff_at");
  const matches = (matchData as MatchRow[] | null) ?? [];
  const letterOf = (id: string) => tById.get(id)?.grp?.match(/[A-L]/)?.[0] ?? null;

  const played: GroupResult[] = [];
  const remainingRows: MatchRow[] = [];
  for (const m of matches) {
    const g = letterOf(m.home_team_id);
    if (g === null || g !== letterOf(m.away_team_id)) continue; // 只看小组赛
    if (m.home_score != null && m.away_score != null) {
      played.push({ homeId: m.home_team_id, awayId: m.away_team_id, homeGoals: m.home_score, awayGoals: m.away_score });
    } else {
      remainingRows.push(m);
    }
  }

  const target = remainingRows.find(
    (m) =>
      (m.home_team_id === homeId && m.away_team_id === awayId) ||
      (m.home_team_id === awayId && m.away_team_id === homeId)
  );
  if (!target) {
    console.error("两队之间没有未赛的小组赛（已完赛或非同组）。");
    process.exit(1);
  }
  // 以 DB 中实际主客为准（输入顺序可能反了）
  const tHome = target.home_team_id;
  const tAway = target.away_team_id;

  // 2) Elo（eloratings.net；失败回退 1600——基线来自快照，条件值仅用于相对摆动）
  const [worldTsv, teamsTsv] = await Promise.all([
    safeFetchText("https://www.eloratings.net/World.tsv"),
    safeFetchText("https://www.eloratings.net/en.teams.tsv"),
  ]);
  const codeToElo = worldTsv ? parseWorldTsv(worldTsv) : new Map<string, number>();
  const nameToCode = teamsTsv ? parseTeamsTsv(teamsTsv) : new Map<string, string>();
  const rating = new Map<string, number>();
  for (const t of teams) {
    rating.set(t.id, eloFor(t.name, nameToCode, codeToElo) ?? 1600);
  }
  if (!worldTsv || !teamsTsv) console.warn("⚠ Elo 抓取失败，全部回退 1600（摆动幅度会偏保守）");

  // 3) 剩余赛事 → 采样 CDF（纯 Elo 模型；不调 Odds API，省 credit）
  const toSim = (rows: MatchRow[]): SimMatch[] =>
    rows.map((m) => {
      const hostAdv = HOSTS.has(normalizeTeamName(tById.get(m.home_team_id)!.name)) ? 100 : 0;
      const seed = lambdasFromElo(rating.get(m.home_team_id)!, rating.get(m.away_team_id)!, hostAdv);
      return { homeId: m.home_team_id, awayId: m.away_team_id, cdf: matrixToCdf(scoreMatrix(seed.home, seed.away)) };
    });

  // 4) baseline：快照（公开预测值）+ 本地未强制模拟（方法学一致的参考值）
  const snap = new Map<string, number>();
  for (const id of [tHome, tAway]) {
    const { data } = await db
      .from("prob_team_snapshots")
      .select("p_advance, created_at")
      .eq("team_id", id)
      .order("created_at", { ascending: false })
      .limit(1);
    const row = (data as { p_advance: number; created_at: string }[] | null)?.[0];
    if (row) snap.set(id, Number(row.p_advance));
  }
  const baseSim = simulateTournament({ groups: groupTeams, played, remaining: toSim(remainingRows), rating, runs: RUNS });

  // 5) 三种结局各跑一次
  const scenarios = [
    { key: "homeWin", hs: 1, as: 0 },
    { key: "draw", hs: 1, as: 1 },
    { key: "awayWin", hs: 0, as: 1 },
  ] as const;

  const hN = tById.get(tHome)!.name;
  const aN = tById.get(tAway)!.name;
  console.log(`\n=== 摆动卡预烘焙：${hN} vs ${aN}（${target.kickoff_at}）===`);
  console.log(`快照基线 p_advance：${hN} ${snap.has(tHome) ? pct(snap.get(tHome)!) + "%" : "无快照"} ｜ ${aN} ${snap.has(tAway) ? pct(snap.get(tAway)!) + "%" : "无快照"}`);
  console.log(`本地模型基线（RUNS=${RUNS}）：${hN} ${pct(baseSim.get(tHome)?.pAdvance ?? 0)}% ｜ ${aN} ${pct(baseSim.get(tAway)?.pAdvance ?? 0)}%`);
  console.log(`（卡片 before 用快照值；无快照时用本地基线）\n`);

  for (const sc of scenarios) {
    const forcedPlayed = [...played, { homeId: tHome, awayId: tAway, homeGoals: sc.hs, awayGoals: sc.as }];
    const forcedRemaining = toSim(remainingRows.filter((m) => m.id !== target.id));
    const probs = simulateTournament({ groups: groupTeams, played: forcedPlayed, remaining: forcedRemaining, rating, runs: RUNS });

    const resZh =
      sc.key === "homeWin" ? `若${teamZh(hN)} ${sc.hs}-${sc.as} 胜${teamZh(aN)}`
      : sc.key === "draw" ? `若${teamZh(hN)} ${sc.hs}-${sc.as} 战平${teamZh(aN)}`
      : `若${teamZh(aN)} ${sc.as}-${sc.hs} 胜${teamZh(hN)}`;
    const resEn =
      sc.key === "homeWin" ? `If ${hN} beat ${aN} ${sc.hs}-${sc.as}`
      : sc.key === "draw" ? `If ${hN} and ${aN} draw ${sc.hs}-${sc.as}`
      : `If ${aN} beat ${hN} ${sc.as}-${sc.hs}`;

    console.log(`--- ${sc.key}（${sc.hs}-${sc.as}）---`);
    for (const id of [tHome, tAway]) {
      const name = tById.get(id)!.name;
      const before = snap.get(id) ?? baseSim.get(id)?.pAdvance ?? 0;
      const after = probs.get(id)?.pAdvance ?? 0;
      const slug = teamSlug(name);
      const mk = (loc: string, res: string) =>
        `${SITE}/api/og?mode=swing&team=${slug}&before=${pct(before)}&after=${pct(after)}&result=${encodeURIComponent(res)}&locale=${loc}`;
      console.log(`  ${name}: ${pct(before)}% → ${pct(after)}%`);
      console.log(`    zh: ${mk("zh", resZh)}`);
      console.log(`    en: ${mk("en", resEn)}`);
    }
  }
  console.log("\n发卡前自查：/forecast 已吸收最新赛果（结算链路正常即可信）。");
}

main().catch((e) => {
  console.error("✗ swing-bake 失败:", e);
  process.exit(1);
});
