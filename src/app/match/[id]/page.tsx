import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchDetail } from "@/lib/markets/getMatchDetail";
import { MarketPicks } from "@/components/MarketPicks";
import { Disclaimer } from "@/components/Disclaimer";
import { TeamBadge } from "@/components/TeamBadge";
import { result1x2 } from "@/lib/settlement/result";

const RESULT_LABEL: Record<string, string> = { home: "主胜", draw: "平局", away: "客胜" };

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await getMatchDetail(id);
  if (!m) notFound();

  const settled = m.status === "settled" && m.homeScore != null && m.awayScore != null;
  const started = new Date(m.kickoffAt).getTime() <= Date.now();
  const open = !settled && !started;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href="/" className="text-xs text-muted">
        ← 返回
      </Link>

      <div className="mt-3 rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 text-[11px] text-muted">
          {m.stage} · {fmt(m.kickoffAt)}
        </div>
        <div className="flex items-center justify-between">
          <TeamBadge name={m.home.name} size="lg" />
          <div className="text-center">
            {settled ? (
              <div className="font-head text-3xl font-bold">
                {m.homeScore} : {m.awayScore}
              </div>
            ) : (
              <span className="font-head text-sm text-muted">VS</span>
            )}
          </div>
          <TeamBadge name={m.away.name} size="lg" />
        </div>
      </div>

      {m.preview && (
        <div className="fade-up mt-4 rounded-lg border border-border bg-surface p-4">
          <div className="mb-1 text-[11px] text-muted">📋 赛前前瞻 · AI 生成 · 仅供娱乐</div>
          <p className="text-sm leading-relaxed">{m.preview}</p>
        </div>
      )}

      <section className="mt-5">
        {settled ? (
          <div className="rounded-md border border-border bg-surface-2 p-4 text-center text-sm">
            <span className="text-muted">本场结果：</span>
            <span className="font-head text-green">
              {RESULT_LABEL[result1x2(m.homeScore as number, m.awayScore as number)]}
            </span>
            <span className="text-muted"> · 已结算派分</span>
          </div>
        ) : open && m.market ? (
          <>
            <h2 className="font-head mb-2 flex items-center gap-2 text-sm font-semibold">
              <span className="live-dot" /> 胜平负 · 实时倍率
            </h2>
            <MarketPicks marketId={m.market.id} selections={m.market.selections} />
          </>
        ) : (
          <p className="rounded-md border border-border bg-surface-2 p-4 text-center text-sm text-muted">
            已封盘，等待比赛结果。
          </p>
        )}
      </section>

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
