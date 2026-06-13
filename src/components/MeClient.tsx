"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Disclaimer } from "@/components/Disclaimer";
import { CheckinCard } from "@/components/CheckinCard";
import { fmtPoints } from "@/lib/format";
import { Skeleton } from "@/components/Skeleton";
import { getDict, type Locale } from "@/i18n";

interface MeData {
  balance: number;
  tier: string;
  total: number;
  won: number;
  lost: number;
  pending: number;
  hitRate: number;
  achievements: { id: string; icon: string; label: string; desc: string; earned: boolean }[];
}

function Tile({ value, label, color = "text-text" }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-4">
      <div className={`font-head text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-[11px] text-muted">{label}</div>
    </div>
  );
}

export function MeClient({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [data, setData] = useState<MeData | null>(null);
  const [state, setState] = useState<"loading" | "none" | "ready">("loading");

  useEffect(() => {
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        setState("none");
        return;
      }
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        setData((await res.json()) as MeData);
        setState("ready");
      } else {
        setState("none");
      }
    })();
  }, []);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-head text-2xl font-bold">{t.me.title}</h1>
        <Link href="/" className="text-xs text-muted">
          {t.common.back}
        </Link>
      </div>

      <div className="mt-4">
        <CheckinCard locale={locale} />
      </div>

      {state === "loading" && (
        <div className="mt-5 space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
          </div>
        </div>
      )}

      {state === "none" && (
        <div className="mt-16 text-center">
          <div className="text-5xl">🎯</div>
          <p className="mt-3 text-sm text-muted">{t.me.empty}</p>
          <Link href="/" className="mt-3 inline-block text-sm text-green">
            {t.me.emptyCta}
          </Link>
        </div>
      )}

      {state === "ready" && data && (
        <>
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-surface p-5">
            <span className="text-4xl">🎯</span>
            <div className="flex-1">
              <div className="font-head text-lg font-bold">
                <span className="text-gold">🛡 {data.tier}</span>
              </div>
              <div className="text-xs text-muted">{t.me.balanceLabel}</div>
            </div>
            <div className="font-head text-3xl font-bold text-green">{fmtPoints(data.balance)}</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Tile value={`${data.hitRate}%`} label={t.me.hitRate} color="text-green" />
            <Tile value={data.won} label={t.me.wins} color="text-gold" />
            <Tile value={data.total} label={t.me.total} />
            <Tile value={data.pending} label={t.me.pending} color="text-blue" />
          </div>

          {data.achievements && (
            <>
              <h2 className="font-head mb-2 mt-6 text-sm font-semibold">
                {t.me.achievements} · {data.achievements.filter((a) => a.earned).length}/{data.achievements.length}
              </h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {data.achievements.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-md border border-border bg-surface-2 p-3 text-center ${
                      a.earned ? "" : "opacity-40 grayscale"
                    }`}
                  >
                    <div className="text-2xl">{a.icon}</div>
                    <div className="mt-1 text-[11px] font-medium">{a.label}</div>
                    <div className="text-[9px] text-muted">{a.desc}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
