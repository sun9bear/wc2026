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
