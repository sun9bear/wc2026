// 连胜计算（任务 3）：输入 = 已结算注单按 kickoff 升序的胜负序列。
// 必须按 kickoff 排序而不是 settled_at——批量补结算时 settled_at 相同，顺序不可靠。

export interface WinStreaks {
  streak: number; // 当前连胜（从最近一场往回数，遇负即停）
  bestStreak: number; // 历史最长连胜
}

export function computeWinStreaks(wonByKickoffAsc: boolean[]): WinStreaks {
  let best = 0;
  let run = 0;
  for (const won of wonByKickoffAsc) {
    run = won ? run + 1 : 0;
    if (run > best) best = run;
  }
  let streak = 0;
  for (let i = wonByKickoffAsc.length - 1; i >= 0 && wonByKickoffAsc[i]; i--) streak++;
  return { streak, bestStreak: best };
}
