// 蒙特卡洛锦标赛模拟：剩余小组赛按各场比分矩阵采样 → 2026 规则排名+第三名分配
// → 完整淘汰赛（90 分钟泊松采样 → 加时(λ/3) → 点球按 Elo 期望）→ 聚合各队各阶段概率。

import type { GroupResult, TeamProb } from "./types";
import { rankGroup, rankThirds, mulberry32, type Rng } from "./standings";
import { lambdasFromElo, poissonPmf, SCORE_MAX } from "./poisson";
import { R32, R16, QF, SF, FINAL, allocateThirds } from "./bracket";

export interface SimMatch {
  homeId: string;
  awayId: string;
  cdf: Float64Array; // 81 格累积分布（matrixToCdf 产物）
}

export interface SimInput {
  groups: Record<string, string[]>; // 组字母 → 4 个 teamId
  played: GroupResult[]; // 已完赛真实结果
  remaining: SimMatch[]; // 未赛小组赛（带采样 CDF）
  rating: Map<string, number>; // teamId → Elo（淘汰赛与末位判据）
  runs: number;
  seed?: number;
}

/** 比分矩阵 → 扁平 CDF（行主序 h*9+a）。 */
export function matrixToCdf(matrix: number[][]): Float64Array {
  const cdf = new Float64Array((SCORE_MAX + 1) * (SCORE_MAX + 1));
  let acc = 0;
  let i = 0;
  for (let h = 0; h <= SCORE_MAX; h++) {
    for (let a = 0; a <= SCORE_MAX; a++) {
      acc += matrix[h][a];
      cdf[i++] = acc;
    }
  }
  return cdf;
}

function sampleScore(cdf: Float64Array, rng: Rng): { h: number; a: number } {
  const u = rng() * cdf[cdf.length - 1];
  let lo = 0;
  let hi = cdf.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cdf[mid] < u) lo = mid + 1;
    else hi = mid;
  }
  return { h: Math.floor(lo / (SCORE_MAX + 1)), a: lo % (SCORE_MAX + 1) };
}

function samplePoisson(lambda: number, rng: Rng): number {
  const u = rng();
  let acc = 0;
  for (let k = 0; k <= SCORE_MAX + 4; k++) {
    acc += poissonPmf(k, lambda);
    if (u < acc) return k;
  }
  return SCORE_MAX;
}

/** 淘汰赛单场胜者：90 分钟泊松 → 加时 λ/3 → 点球按 Elo 期望（截断 0.35-0.65）。 */
function koWinner(aId: string, bId: string, rating: Map<string, number>, rng: Rng): string {
  const ra = rating.get(aId) ?? 1600;
  const rb = rating.get(bId) ?? 1600;
  const { home: la, away: lb } = lambdasFromElo(ra, rb);
  let ga = samplePoisson(la, rng);
  let gb = samplePoisson(lb, rng);
  if (ga !== gb) return ga > gb ? aId : bId;
  ga = samplePoisson(la / 3, rng);
  gb = samplePoisson(lb / 3, rng);
  if (ga !== gb) return ga > gb ? aId : bId;
  const e = 1 / (1 + Math.pow(10, -(ra - rb) / 400));
  return rng() < Math.min(0.65, Math.max(0.35, e)) ? aId : bId;
}

/** 主入口：聚合 runs 次模拟，输出每队各阶段概率。 */
export function simulateTournament(input: SimInput): Map<string, TeamProb> {
  const { groups, played, remaining, rating, runs } = input;
  const rng = mulberry32(input.seed ?? 20260613);
  const letters = Object.keys(groups).sort();
  const teamGroup = new Map<string, string>();
  for (const g of letters) for (const id of groups[g]) teamGroup.set(id, g);

  // 已赛/未赛按组分桶（每 run 复用）
  const playedByGroup = new Map<string, GroupResult[]>(letters.map((g) => [g, []]));
  for (const r of played) {
    const g = teamGroup.get(r.homeId);
    if (g) playedByGroup.get(g)!.push(r);
  }
  const remainingByGroup = new Map<string, SimMatch[]>(letters.map((g) => [g, []]));
  for (const m of remaining) {
    const g = teamGroup.get(m.homeId);
    if (g) remainingByGroup.get(g)!.push(m);
  }

  const counts = new Map<
    string,
    { advance: number; r16: number; qf: number; sf: number; final: number; champion: number }
  >();
  for (const id of teamGroup.keys())
    counts.set(id, { advance: 0, r16: 0, qf: 0, sf: 0, final: 0, champion: 0 });

  for (let run = 0; run < runs; run++) {
    const firsts: Record<string, string> = {};
    const runners: Record<string, string> = {};
    const thirdRows = [];
    for (const g of letters) {
      const results = [...playedByGroup.get(g)!];
      for (const m of remainingByGroup.get(g)!) {
        const s = sampleScore(m.cdf, rng);
        results.push({ homeId: m.homeId, awayId: m.awayId, homeGoals: s.h, awayGoals: s.a });
      }
      const order = rankGroup(groups[g], results, rng, rating);
      firsts[g] = order[0].teamId;
      runners[g] = order[1].teamId;
      thirdRows.push(order[2]);
    }
    const thirdsRanked = rankThirds(thirdRows, rng, rating);
    const qualThirds = thirdsRanked.slice(0, 8);
    const thirdTeamByGroup = new Map(qualThirds.map((id) => [teamGroup.get(id)!, id]));
    const alloc = allocateThirds([...thirdTeamByGroup.keys()]);

    // R32 解析对阵 → 逐轮打完
    const winners = new Map<number, string>();
    const inR32 = new Set<string>();
    for (const m of R32) {
      const resolve = (s: Src2): string =>
        s.kind === "winner"
          ? firsts[s.group]
          : s.kind === "runner"
            ? runners[s.group]
            : thirdTeamByGroup.get(alloc[s.slot])!;
      const a = resolve(m.home);
      const b = resolve(m.away);
      inR32.add(a);
      inR32.add(b);
      winners.set(m.match, koWinner(a, b, rating, rng));
    }
    for (const id of inR32) counts.get(id)!.advance++;
    const playRound = (round: Record<number, [number, number]>) => {
      for (const [match, [x, y]] of Object.entries(round)) {
        const a = winners.get(x)!;
        const b = winners.get(y)!;
        counts.get(a)![roundStage]++;
        counts.get(b)![roundStage]++;
        winners.set(Number(match), koWinner(a, b, rating, rng));
      }
    };
    let roundStage: "r16" | "qf" | "sf" = "r16";
    playRound(R16);
    roundStage = "qf";
    playRound(QF);
    roundStage = "sf";
    playRound(SF);
    const fa = winners.get(FINAL[0])!;
    const fb = winners.get(FINAL[1])!;
    counts.get(fa)!.final++;
    counts.get(fb)!.final++;
    counts.get(koWinner(fa, fb, rating, rng))!.champion++;
  }

  const out = new Map<string, TeamProb>();
  for (const [id, c] of counts) {
    out.set(id, {
      teamId: id,
      pAdvance: c.advance / runs,
      pR16: c.r16 / runs,
      pQF: c.qf / runs,
      pSF: c.sf / runs,
      pFinal: c.final / runs,
      pChampion: c.champion / runs,
    });
  }
  return out;
}

type Src2 = (typeof R32)[number]["home"];
