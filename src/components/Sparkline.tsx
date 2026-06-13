// 纯 SSR 迷你走势图（无客户端 JS）：多条折线共用一套自动纵向缩放，突出相对走势。
// 用于 /forecast 出线概率异动、/match 单场胜平负走势（任务 6 / 概率显形）。

interface Line {
  values: number[];
  color: string;
}

export function Sparkline({
  lines,
  width = 132,
  height = 32,
  yMin,
  yMax,
  strokeWidth = 2,
  showLastDot = true,
}: {
  lines: Line[];
  width?: number;
  height?: number;
  yMin?: number;
  yMax?: number;
  strokeWidth?: number;
  showLastDot?: boolean;
}) {
  const all = lines.flatMap((l) => l.values).filter((v) => Number.isFinite(v));
  if (all.length === 0) return null;

  // 自动缩放（带 12% 余白），让 0.1–0.9 区间的波动也看得见；可显式覆盖。
  const lo = yMin ?? Math.min(...all);
  const hi = yMax ?? Math.max(...all);
  const pad = (hi - lo) * 0.12 || 0.02;
  const min = Math.max(0, lo - pad);
  const max = Math.min(1, hi + pad);
  const span = max - min || 1;

  const p = strokeWidth + 1;
  const w = width - p * 2;
  const h = height - p * 2;
  const project = (vals: number[]) =>
    vals.map((v, i) => {
      const x = p + (vals.length === 1 ? w / 2 : (i / (vals.length - 1)) * w);
      const y = p + h - ((v - min) / span) * h;
      return [x, y] as const;
    });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      {lines.map((l, li) => {
        const pts = project(l.values);
        if (pts.length === 0) return null;
        const d = pts
          .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
          .join(" ");
        const last = pts[pts.length - 1];
        return (
          <g key={li}>
            <path
              d={d}
              fill="none"
              stroke={l.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {showLastDot && <circle cx={last[0]} cy={last[1]} r={strokeWidth} fill={l.color} />}
          </g>
        );
      })}
    </svg>
  );
}
