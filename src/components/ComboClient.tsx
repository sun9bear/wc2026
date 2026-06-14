"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { teamName } from "@/lib/football/teams";
import { combinedMultiplier } from "@/lib/odds/pooledOdds";
import { quotePayout } from "@/lib/bets/quote";
import { Disclaimer } from "@/components/Disclaimer";
import { Skeleton } from "@/components/Skeleton";
import { LocalTime } from "@/components/LocalTime";
import { useToast } from "@/components/Toast";
import { getDict, localeHref, type Locale } from "@/i18n";

interface Sel {
  id: string;
  code: string;
  label: string;
  multiplier: number;
}
interface Mt {
  id: string;
  kickoffAt: string;
  home: string;
  away: string;
  selections: Sel[];
}

interface RawSel {
  id: string;
  code: string;
  label: string;
  current_multiplier: number;
}
interface RawMarket {
  id: string;
  type: string;
  selections: RawSel[];
}
interface RawMatch {
  id: string;
  kickoff_at: string;
  home: { name: string } | null;
  away: { name: string } | null;
  markets: RawMarket[];
}

const ORDER: Record<string, number> = { home: 0, draw: 1, away: 2 };

export function ComboClient({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [matches, setMatches] = useState<Mt[]>([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [stake, setStake] = useState(100);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const codeLabel: Record<string, string> = {
    home: t.match.home,
    draw: t.match.draw,
    away: t.match.away,
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("matches")
        .select(
          "id, kickoff_at, home:home_team_id(name), away:away_team_id(name), markets(id, type, selections(id, code, label, current_multiplier))"
        )
        .eq("status", "scheduled")
        .order("kickoff_at")
        .limit(40);
      const now = Date.now();
      const list: Mt[] = [];
      for (const m of (data as RawMatch[] | null) ?? []) {
        if (new Date(m.kickoff_at).getTime() <= now) continue;
        const mk = (m.markets ?? []).find((x) => x.type === "1x2");
        if (!mk) continue;
        const sels = (mk.selections ?? [])
          .map((s) => ({
            id: s.id,
            code: s.code,
            label: s.label,
            multiplier: Number(s.current_multiplier),
          }))
          .sort((a, b) => (ORDER[a.code] ?? 9) - (ORDER[b.code] ?? 9));
        list.push({
          id: m.id,
          kickoffAt: m.kickoff_at,
          home: m.home?.name ?? "?",
          away: m.away?.name ?? "?",
          selections: sels,
        });
      }
      setMatches(list);
      setLoading(false);
    })();
  }, []);

  const pickedSels = matches.flatMap((m) => {
    const s = m.selections.find((x) => x.id === picked[m.id]);
    return s ? [s] : [];
  });
  const legs = pickedSels.length;
  const combined = combinedMultiplier(pickedSels.map((s) => s.multiplier));
  const payout = legs >= 2 ? quotePayout(stake, combined) : 0;

  function pick(matchId: string, selId: string) {
    setPicked((p) => {
      if (p[matchId] === selId) {
        const n = { ...p };
        delete n[matchId];
        return n;
      }
      return { ...p, [matchId]: selId };
    });
  }

  async function submit() {
    if (legs < 2 || busy) return;
    setBusy(true);
    try {
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw new Error(t.match.enterFail + error.message);
        session = (await supabase.auth.getSession()).data.session;
      }
      const selectionIds = matches.map((m) => picked[m.id]).filter(Boolean);
      const res = await fetch("/api/combo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ selectionIds, points: stake }),
      });
      const j = (await res.json()) as { error?: string; legs?: number; combined?: number; balance?: number };
      if (!res.ok) throw new Error(j.error ?? t.match.submitFail);
      toast(
        `${t.combo.successA}${j.legs} ${t.combo.successB} ${j.combined} · ${t.combo.payout} ${quotePayout(stake, j.combined ?? combined)} · ${t.match.balanceWord} ${j.balance}`,
        "ok"
      );
      setPicked({});
    } catch (e) {
      toast(e instanceof Error ? e.message : t.match.submitFail, "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-head text-2xl font-bold">{t.combo.title}</h1>
        <Link href={localeHref(locale, "/")} className="text-xs text-muted">
          {t.common.back}
        </Link>
      </div>
      <p className="mt-1 mb-4 text-xs text-muted">{t.combo.desc}</p>

      {loading ? (
        <div className="space-y-3 pb-52">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-5xl">🔗</div>
          <p className="mt-3 text-sm text-muted">{t.combo.empty}</p>
        </div>
      ) : null}

      <div className="pb-52">
        {matches.map((m) => (
          <div key={m.id} className="mb-3 rounded-lg border border-border bg-surface p-3">
            <div className="mb-2 text-[11px] text-muted">
              {teamName(m.home, locale)} vs {teamName(m.away, locale)} ·{" "}
              <LocalTime iso={m.kickoffAt} locale={locale} mode="datetime" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {m.selections.map((s) => {
                const on = picked[m.id] === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pick(m.id, s.id)}
                    className={`rounded-md border p-2 text-center transition ${
                      on ? "border-green bg-green/15 shadow-glow" : "border-border bg-surface-2"
                    }`}
                  >
                    <div className="text-[10px] text-muted">{codeLabel[s.code] ?? s.label}</div>
                    <div className={`font-head font-bold ${on ? "text-green" : ""}`}>
                      {s.multiplier.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-14 border-t border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto w-full max-w-xl px-4 py-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              {t.combo.selectedA} <b className="font-head text-text">{legs}</b> {t.combo.selectedB}{" "}
              <b className="font-head text-green">{legs >= 2 ? combined : "--"}</b>
            </span>
            <span>
              {t.combo.payout} <b className="font-head text-green">+{payout}</b>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={stake}
              onChange={(e) => setStake(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
              className="w-24 rounded-sm border border-border bg-surface-2 px-2 py-2 text-right font-head"
            />
            <button
              type="button"
              onClick={submit}
              disabled={legs < 2 || busy}
              className="flex-1 rounded-md bg-green py-2 font-bold text-[#06231a] disabled:opacity-40"
            >
              {busy ? t.combo.submitting : legs < 2 ? t.combo.least2 : t.combo.submit}
            </button>
          </div>
          <div className="mt-2 text-center">
            <Disclaimer />
          </div>
        </div>
      </div>
    </main>
  );
}
