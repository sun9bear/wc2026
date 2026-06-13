// 单场胜平负概率走势（SSR，无客户端 JS）：三线共用一套自动缩放，展示赛前模型概率随时间的漂移。
// 快照不足（<3 点）时 getMatchProbTrend 返回 null，本组件整体不渲染。本地 TXT 双语。

import { getMatchProbTrend } from "@/lib/prob/getTrends";
import { Sparkline } from "./Sparkline";

const COPY = {
  zh: { title: "📈 胜平负概率走势", home: "主胜", draw: "平局", away: "客胜", note: "模型每小时快照，越近越准" },
  en: { title: "📈 Win / draw / loss trend", home: "Home", draw: "Draw", away: "Away", note: "Hourly model snapshots — sharper near kickoff" },
} as const;

// 与 /forecast 单场胜平负配色一致：主胜绿、平局灰、客胜橙。
const HOME = "#1be27f";
const DRAW = "#8a97a6";
const AWAY = "#f97316";

function pct(v: number): string {
  return Math.round(v * 100) + "%";
}
function last(a: number[]): number {
  return a[a.length - 1];
}

export async function MatchProbTrend({
  matchId,
  locale,
}: {
  matchId: string;
  locale: "zh" | "en";
}) {
  const trend = await getMatchProbTrend(matchId);
  if (!trend) return null;
  const c = COPY[locale];

  return (
    <section className="fade-up mt-4 rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] text-muted">{c.title}</span>
        <span className="text-[10px] text-muted">{c.note}</span>
      </div>
      <Sparkline
        fluid
        lines={[
          { values: trend.home, color: HOME },
          { values: trend.draw, color: DRAW },
          { values: trend.away, color: AWAY },
        ]}
        width={280}
        height={56}
      />
      <div className="mt-2 flex justify-between font-head text-[11px]">
        <span style={{ color: HOME }}>
          {c.home} {pct(last(trend.home))}
        </span>
        <span className="text-muted">
          {c.draw} {pct(last(trend.draw))}
        </span>
        <span style={{ color: AWAY }}>
          {c.away} {pct(last(trend.away))}
        </span>
      </div>
    </section>
  );
}
