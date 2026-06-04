import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchDetail } from "@/lib/markets/getMatchDetail";
import { MarketPicks } from "@/components/MarketPicks";
import { Disclaimer } from "@/components/Disclaimer";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Team({ name, flag }: { name: string; flag: string | null }) {
  return (
    <div className="flex w-24 flex-col items-center gap-2">
      <span className="text-4xl leading-none">{flag}</span>
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await getMatchDetail(id);
  if (!m) notFound();

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
          <Team name={m.home.name} flag={m.home.flag} />
          <span className="font-head text-sm text-muted">VS</span>
          <Team name={m.away.name} flag={m.away.flag} />
        </div>
      </div>

      <section className="mt-5">
        <h2 className="font-head mb-2 text-sm font-semibold">胜平负 · 实时倍率</h2>
        {m.market ? (
          <MarketPicks selections={m.market.selections} />
        ) : (
          <p className="text-sm text-muted">该场暂无可预测玩法。</p>
        )}
      </section>

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
