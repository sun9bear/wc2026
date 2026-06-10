import type { SelectionView } from "@/lib/markets/getMatchDetail";

// 实时社区人气条：用各选项的累计投入(pooled_stake，公开聚合)算占比。
// 纯展示、服务端渲染;无人下注时给友好空状态。
const BAR: Record<string, string> = { home: "bg-green", draw: "bg-amber", away: "bg-blue" };
const DOT: Record<string, string> = { home: "bg-green", draw: "bg-amber", away: "bg-blue" };

export function SentimentBar({ selections }: { selections: SelectionView[] }) {
  const total = selections.reduce((a, s) => a + (s.pooledStake || 0), 0);

  if (total <= 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-1 text-[11px] text-muted">🔥 社区人气</div>
        <p className="text-sm text-muted">还没有人预测这场，来当第一个！</p>
      </div>
    );
  }

  const rows = selections.map((s) => ({
    code: s.code,
    label: s.label,
    pct: Math.round((s.pooledStake / total) * 100),
    stake: s.pooledStake,
  }));
  const maxStake = Math.max(...rows.map((r) => r.stake));
  const minStake = Math.min(...rows.map((r) => r.stake));

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 text-[11px] text-muted">🔥 社区人气 · 实时</div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        {rows.map((r) => (
          <div
            key={r.code}
            className={BAR[r.code] ?? "bg-muted"}
            style={{ width: `${r.pct}%` }}
            aria-label={`${r.label} ${r.pct}%`}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        {rows.map((r) => (
          <span key={r.code} className="flex items-center gap-1 text-muted">
            <i className={`inline-block h-2 w-2 rounded-full ${DOT[r.code] ?? "bg-muted"}`} />
            <span className="text-text">{r.label}</span>
            <span className="font-head">{r.pct}%</span>
            {r.stake === maxStake && maxStake > minStake && <span title="人气最高">🔥</span>}
            {r.stake === minStake && maxStake > minStake && <span title="潜在冷门">❄️</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
