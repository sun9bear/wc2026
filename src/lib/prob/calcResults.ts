import type { GroupResult } from "./types";

// 出线计算器的纯计算辅助：把"已完赛真实比分 + 用户为剩余场所选比分"合成
// rankGroup/rankThirds 所需的结果集。抽出为纯函数便于单测，组件只负责状态与渲染。

/** 用户为单场所选比分：[主队进球, 客队进球]。 */
export type Pick = [number, number];

/** 胜平负 → 平铺比分约定（默认/快路用）。 */
export const FLAT: Record<"h" | "d" | "a", Pick> = { h: [1, 0], d: [1, 1], a: [0, 1] };

/** 比分 → 赛果（用于高亮活动格）。 */
export function outcomeOf([h, a]: Pick): "h" | "d" | "a" {
  return h > a ? "h" : h < a ? "a" : "d";
}

/** 进球数夹取到 0..9（引擎 SCORE_MAX=8，UI 卡 9 足够覆盖且防离谱输入）。 */
export function clampGoal(n: number): number {
  return Math.max(0, Math.min(9, Math.round(n)));
}

/**
 * 合成结果集：已完赛原样保留，剩余场按 picks 取比分（缺省回退到 fallback）。
 * fallback 一般为 FLAT[m.likely]，保证页面初始与"重置"行为与平铺约定一致。
 */
export function buildCalcResults(
  played: GroupResult[],
  remaining: { id: string; homeId: string; awayId: string }[],
  picks: Record<string, Pick>,
  fallback: Record<string, Pick>
): GroupResult[] {
  return [
    ...played,
    ...remaining.map((m) => {
      const [homeGoals, awayGoals] = picks[m.id] ?? fallback[m.id] ?? FLAT.d;
      return { homeId: m.homeId, awayId: m.awayId, homeGoals, awayGoals };
    }),
  ];
}
