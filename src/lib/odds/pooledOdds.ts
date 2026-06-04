// 池式（众包）倍率引擎 —— 设计方案 §8.1。
// 倍率由"大家怎么押"实时算出，营造动态盘感；因积分无价值，无需资金池守恒。

export interface OddsConfig {
  /** 平滑系数：给每个选项一个虚拟底注，避免除零与早期极端值。 */
  k?: number;
  /** 倍率下限。 */
  floor?: number;
  /** 倍率上限。 */
  cap?: number;
}

const DEFAULTS = { k: 100, floor: 1.1, cap: 50 } as const;

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/**
 * 单个选项的池式倍率：
 *   multiplier = clamp( (P + k·N) / (S_s + k), floor, cap )
 * 其中 P=总投入, S_s=该选项投入, N=选项数, k=平滑系数。
 * 特性：均分时各选项=N；无人下注时各选项=N；冷门选项倍率高、热门选项倍率低。
 */
export function pooledMultiplier(
  selectionStake: number,
  totalStake: number,
  numSelections: number,
  cfg: OddsConfig = {}
): number {
  if (numSelections <= 0) throw new Error("numSelections 必须 > 0");
  if (selectionStake < 0 || totalStake < 0) throw new Error("投入不能为负");
  const k = cfg.k ?? DEFAULTS.k;
  const floor = cfg.floor ?? DEFAULTS.floor;
  const cap = cfg.cap ?? DEFAULTS.cap;
  const raw = (totalStake + k * numSelections) / (selectionStake + k);
  return clamp(round2(raw), floor, cap);
}

/** 给定各选项的累计投入，返回各自当前倍率。 */
export function computeMultipliers(stakes: number[], cfg: OddsConfig = {}): number[] {
  const total = stakes.reduce((a, b) => a + b, 0);
  return stakes.map((s) => pooledMultiplier(s, total, stakes.length, cfg));
}

/** 串关连乘倍率 = 各腿倍率之积（保留两位小数）。 */
export function combinedMultiplier(multipliers: number[]): number {
  const p = multipliers.reduce((a, b) => a * b, 1);
  return Math.round(p * 100) / 100;
}
