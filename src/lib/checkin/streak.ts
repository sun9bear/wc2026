// 连续签到天数（纯函数，按 UTC 日）。

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 给定 "YYYY-MM-DD" 返回前一天。 */
export function prevDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/**
 * 由签到日期集合算"当前连续天数"。
 * 从今天往回数；若今天还没签，则从昨天起算（连胜仍然有效、今天可续）。
 */
export function computeStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  let cur = set.has(today) ? today : prevDay(today);
  let streak = 0;
  while (set.has(cur)) {
    streak++;
    cur = prevDay(cur);
  }
  return streak;
}
