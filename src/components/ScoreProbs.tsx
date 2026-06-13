// 「最可能的比分」展示模块（SSR，纯展示）：把引擎已算好的 Top-5 比分概率渲染成概率条。
// 合规：标题/文案只用「最可能的比分 / Most likely results · 模型概率」，绝不出现 correct score/赔率/odds。
// 条宽按"相对最高项"缩放（最高项占满）便于阅读，数字标注的是真实概率%。

import { teamZh } from "@/lib/football/teams";
import type { MatchScoreline } from "@/lib/prob/getMatchScoreline";

const COPY = {
  zh: {
    title: "最可能的比分",
    sub: "模型概率 · 仅供娱乐参考",
    other: "其他比分",
    note: "基于实力评分与公开预测数据的泊松比分模型，每小时更新。",
  },
  en: {
    title: "Most likely results",
    sub: "model probability · for fun",
    other: "Other scores",
    note: "Poisson score model from strength ratings and public forecast data, updated hourly.",
  },
} as const;

function Side({
  name,
  flag,
  locale,
}: {
  name: string;
  flag: string | null;
  locale: "zh" | "en";
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {flag && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flag} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
      )}
      <span className="truncate">{locale === "zh" ? teamZh(name) : name}</span>
    </span>
  );
}

export function ScoreProbs({
  data,
  locale,
  home,
  away,
}: {
  data: MatchScoreline;
  locale: "zh" | "en";
  home: { name: string; flag: string | null };
  away: { name: string; flag: string | null };
}) {
  const c = COPY[locale];
  const max = data.top[0]?.p ?? 1;
  const pct = (p: number) => (p * 100).toFixed(p < 0.1 ? 1 : 0) + "%";

  return (
    <section className="fade-up mt-5 rounded-lg border border-border bg-surface p-4">
      <div className="mb-0.5 flex items-baseline justify-between">
        <h2 className="font-head text-sm font-semibold">📊 {c.title}</h2>
        <span className="text-[10px] text-muted">{c.sub}</span>
      </div>

      {/* 朝向锚点：左=主队，右=客队（比分 H-A 以此为准） */}
      <div className="mb-3 flex items-center justify-between text-[11px] text-muted">
        <Side name={home.name} flag={home.flag} locale={locale} />
        <Side name={away.name} flag={away.flag} locale={locale} />
      </div>

      <div className="space-y-1.5">
        {data.top.map((s) => (
          <div key={`${s.h}-${s.a}`} className="flex items-center gap-2.5 text-sm">
            <span className="font-head w-10 shrink-0 tabular-nums">
              {s.h}-{s.a}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-green"
                style={{ width: `${Math.max(4, (s.p / max) * 100)}%` }}
              />
            </div>
            <span className="font-head w-11 shrink-0 text-right tabular-nums text-green">
              {pct(s.p)}
            </span>
          </div>
        ))}

        {data.otherP > 0.005 && (
          <div className="flex items-center justify-between border-t border-border/50 pt-1.5 text-[11px] text-muted">
            <span>{c.other}</span>
            <span className="tabular-nums">{pct(data.otherP)}</span>
          </div>
        )}
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-muted">{c.note}</p>
    </section>
  );
}
