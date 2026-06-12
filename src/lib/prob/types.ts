// 概率引擎共享类型。全部为纯数据结构，不依赖运行环境。

/** 胜平负概率（和恒为 1）。 */
export interface Probs1x2 {
  home: number;
  draw: number;
  away: number;
}

/** 一场比赛的概率快照（引擎输出）。 */
export interface MatchProb {
  matchId: string;
  p: Probs1x2; // 融合后（展示与模拟采样目标）
  market: Probs1x2 | null; // 多机构共识去水概率（无盘口为 null）
  model: Probs1x2; // Elo+泊松 模型概率
  books: number; // 参与共识的机构数
  topScores: { h: number; a: number; p: number }[]; // 最可能比分 Top N
  lambdas: { home: number; away: number }; // 校准后的期望进球（模拟采样用）
}

/** 一支球队的锦标赛概率（蒙特卡洛输出）。 */
export interface TeamProb {
  teamId: string;
  pAdvance: number; // 小组出线（进 32 强）
  pR16: number;
  pQF: number;
  pSF: number;
  pFinal: number;
  pChampion: number;
}

/** 小组赛一场已知或模拟出的结果。 */
export interface GroupResult {
  homeId: string;
  awayId: string;
  homeGoals: number;
  awayGoals: number;
}

/** 积分榜行。 */
export interface TableRow {
  teamId: string;
  played: number;
  pts: number;
  gf: number;
  ga: number;
  gd: number;
}
