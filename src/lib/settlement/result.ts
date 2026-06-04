// 由最终比分判定胜平负赛果（纯函数）。
export type Result1x2 = "home" | "draw" | "away";

export function result1x2(homeScore: number, awayScore: number): Result1x2 {
  if (homeScore > awayScore) return "home";
  if (homeScore < awayScore) return "away";
  return "draw";
}
