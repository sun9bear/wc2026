// 积分千分位格式化。
export function fmtPoints(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
