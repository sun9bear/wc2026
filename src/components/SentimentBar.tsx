import type { SelectionView } from "@/lib/markets/getMatchDetail";
import { getDict, type Locale } from "@/i18n";

// 热度参考条：用各选项的累计投入(pooled_stake，公开聚合)算占比。
// 池子含模型先验种子（scripts/seed-pools.ts），故口径标注为"社区与模型综合"而非纯社区。
const BAR: Record<string, string> = { home: "bg-green", draw: "bg-amber", away: "bg-blue" };
const DOT: Record<string, string> = { home: "bg-green", draw: "bg-amber", away: "bg-blue" };

export function SentimentBar({
  selections,
  locale,
}: {
  selections: SelectionView[];
  locale: Locale;
}) {
  const t = getDict(locale);
  const total = selections.reduce((a, s) => a + (s.pooledStake || 0), 0);
  const codeLabel: Record<string, string> = {
    home: t.match.home,
    draw: t.match.draw,
    away: t.match.away,
  };

  if (total <= 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-1 text-[11px] md:text-xs text-muted">{t.match.sentimentTitle}</div>
        <p className="text-sm md:text-base text-muted">{t.match.sentimentEmpty}</p>
      </div>
    );
  }

  const rows = selections.map((s) => ({
    code: s.code,
    label: codeLabel[s.code] ?? s.label,
    pct: Math.round((s.pooledStake / total) * 100),
    stake: s.pooledStake,
  }));
  const maxStake = Math.max(...rows.map((r) => r.stake));
  const minStake = Math.min(...rows.map((r) => r.stake));

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 text-[11px] md:text-xs text-muted">{t.match.sentimentTitle}</div>
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
            {r.stake === maxStake && maxStake > minStake && <span title={t.match.hotMost}>🔥</span>}
            {r.stake === minStake && maxStake > minStake && <span title={t.match.coldMost}>❄️</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
