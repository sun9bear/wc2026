import type { Probs1x2 } from "./types";

// 泊松 + Dixon-Coles 比分模型。
// λ 由 Elo 差映射（形状先验），再经一维搜索校准到目标胜平负概率（市场融合值）。
// 参数取值依据文献惯例：ρ=-0.08（低比分相关修正）、总期望进球 2.6（近几届国际大赛均值）。

export const SCORE_MAX = 8; // 0..8 共 9 档，覆盖 >99.5% 概率质量
const RHO = -0.08;
const TOTAL_GOALS = 2.6;

/** 泊松 PMF（迭代式，避免阶乘溢出）。 */
export function poissonPmf(k: number, lambda: number): number {
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p = (p * lambda) / i;
  return p;
}

/** Elo 差 → 双方期望进球（形状先验）。hostAdv 为主队 Elo 加成（东道主用 +100）。 */
export function lambdasFromElo(
  eloHome: number,
  eloAway: number,
  hostAdv = 0
): { home: number; away: number } {
  const dr = eloHome - eloAway + hostAdv;
  const e = 1 / (1 + Math.pow(10, -dr / 400)); // 主队胜率期望（Elo 定义）
  const share = Math.min(0.85, Math.max(0.15, 0.5 + 0.6 * (e - 0.5)));
  return { home: TOTAL_GOALS * share, away: TOTAL_GOALS * (1 - share) };
}

/** Dixon-Coles 修正后的比分概率矩阵（归一化，[h][a]）。 */
export function scoreMatrix(lh: number, la: number, rho = RHO): number[][] {
  const m: number[][] = [];
  let sum = 0;
  for (let h = 0; h <= SCORE_MAX; h++) {
    m[h] = [];
    for (let a = 0; a <= SCORE_MAX; a++) {
      let p = poissonPmf(h, lh) * poissonPmf(a, la);
      if (h === 0 && a === 0) p *= 1 - lh * la * rho;
      else if (h === 0 && a === 1) p *= 1 + lh * rho;
      else if (h === 1 && a === 0) p *= 1 + la * rho;
      else if (h === 1 && a === 1) p *= 1 - rho;
      m[h][a] = p;
      sum += p;
    }
  }
  for (let h = 0; h <= SCORE_MAX; h++) for (let a = 0; a <= SCORE_MAX; a++) m[h][a] /= sum;
  return m;
}

/** 矩阵聚合出胜平负概率。 */
export function matrixTo1x2(m: number[][]): Probs1x2 {
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let h = 0; h <= SCORE_MAX; h++) {
    for (let a = 0; a <= SCORE_MAX; a++) {
      if (h > a) home += m[h][a];
      else if (h === a) draw += m[h][a];
      else away += m[h][a];
    }
  }
  return { home, draw, away };
}

/** 最可能比分 Top N。 */
export function topScores(m: number[][], n = 6): { h: number; a: number; p: number }[] {
  const all: { h: number; a: number; p: number }[] = [];
  for (let h = 0; h <= SCORE_MAX; h++)
    for (let a = 0; a <= SCORE_MAX; a++) all.push({ h, a, p: m[h][a] });
  return all.sort((x, y) => y.p - x.p).slice(0, n);
}

/**
 * λ 校准：在保持总进球的前提下平移 λ 差（一维网格搜索），
 * 使矩阵的主胜/客胜概率尽量贴合目标（融合后的胜平负）。
 * 返回校准后的 λ 与矩阵——模拟采样与比分展示都用它，保证三层概率自洽。
 */
export function calibrateToTarget(
  lh0: number,
  la0: number,
  target: Probs1x2
): { home: number; away: number; matrix: number[][] } {
  let best = { home: lh0, away: la0, matrix: scoreMatrix(lh0, la0), err: Infinity };
  for (let delta = -2; delta <= 2.0001; delta += 0.04) {
    const lh = Math.max(0.05, lh0 + delta / 2);
    const la = Math.max(0.05, la0 - delta / 2);
    const m = scoreMatrix(lh, la);
    const p = matrixTo1x2(m);
    const err = (p.home - target.home) ** 2 + (p.away - target.away) ** 2;
    if (err < best.err) best = { home: lh, away: la, matrix: m, err };
  }
  return { home: best.home, away: best.away, matrix: best.matrix };
}

const REMAIN_MAX = 7; // 剩余时间内单队再进球数上限（覆盖 >99.9% 质量）

/**
 * 进行中比赛的「最终比分」分布（in-play 重算）。
 * 思路：剩余时间内双方各自再进球数 ~ 泊松(λ_全场 × 剩余比例 r)，叠加 Dixon-Coles 低比分修正，
 * 再加上当前比分 (hNow, aNow) 得到最终比分分布。lh0/la0 为校准后的全场期望进球（与赛前同源，
 * 故开赛即时(0-0,0')的 in-play 分布与赛前分布自洽）。minutesPlayed 达 90 则 r→0、最终比分锁定当前比分。
 * 返回最可能的最终比分 Top N 与聚合胜平负——比分前端与 1X2 复用同一分布，保持自洽。
 */
export function liveScoreline(
  lh0: number,
  la0: number,
  hNow: number,
  aNow: number,
  minutesPlayed: number,
  rho = RHO
): { top: { h: number; a: number; p: number }[]; p: Probs1x2 } {
  const r = Math.max(0, Math.min(1, (90 - minutesPlayed) / 90));
  // 终场/补时尾声：剩余进球期望→0，最终比分确定为当前比分。
  if (r <= 0) {
    return {
      top: [{ h: hNow, a: aNow, p: 1 }],
      p: { home: hNow > aNow ? 1 : 0, draw: hNow === aNow ? 1 : 0, away: hNow < aNow ? 1 : 0 },
    };
  }
  const lh = lh0 * r;
  const la = la0 * r;

  // 剩余进球矩阵（Dixon-Coles 修正后归一化）。
  const rm: number[][] = [];
  let sum = 0;
  for (let i = 0; i <= REMAIN_MAX; i++) {
    rm[i] = [];
    for (let j = 0; j <= REMAIN_MAX; j++) {
      let p = poissonPmf(i, lh) * poissonPmf(j, la);
      if (i === 0 && j === 0) p *= 1 - lh * la * rho;
      else if (i === 0 && j === 1) p *= 1 + lh * rho;
      else if (i === 1 && j === 0) p *= 1 + la * rho;
      else if (i === 1 && j === 1) p *= 1 - rho;
      rm[i][j] = p;
      sum += p;
    }
  }

  // 叠加当前比分 → 最终比分分布；同步聚合胜平负。
  const cells: { h: number; a: number; p: number }[] = [];
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let i = 0; i <= REMAIN_MAX; i++) {
    for (let j = 0; j <= REMAIN_MAX; j++) {
      const p = rm[i][j] / sum;
      const fh = hNow + i;
      const fa = aNow + j;
      cells.push({ h: fh, a: fa, p });
      if (fh > fa) home += p;
      else if (fh === fa) draw += p;
      else away += p;
    }
  }
  cells.sort((x, y) => y.p - x.p);
  return { top: cells.slice(0, 5), p: { home, draw, away } };
}

/**
 * 从已持久化的赛前胜平负概率反推全场期望进球 λ（in-play 重算用）。
 * 复用 calibrateToTarget：以总进球 2.6（1.3/1.3）为先验、搜索 λ 差使矩阵胜平负贴合 target——
 * 即引擎赛前所用的同一套校准，故无需重抓 Elo/盘口，也无需新增 λ 持久化字段。
 */
export function lambdasFrom1x2(target: Probs1x2): { home: number; away: number } {
  const c = calibrateToTarget(1.3, 1.3, target);
  return { home: c.home, away: c.away };
}
