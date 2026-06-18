"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { quotePayout } from "@/lib/bets/quote";
import { track } from "@/lib/track";
import { useToast } from "@/components/Toast";
import { getDict, type Locale } from "@/i18n";
import type { SelectionView } from "@/lib/markets/getMatchDetail";

const ORDER: Record<string, number> = { home: 0, draw: 1, away: 2 };

export function MarketPicks({
  marketId,
  selections: initial,
  locale,
}: {
  marketId: string;
  selections: SelectionView[];
  locale: Locale;
}) {
  const t = getDict(locale);
  const [selections, setSelections] = useState<SelectionView[]>(initial);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [stake, setStake] = useState(100);
  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const { toast } = useToast();

  // DB 的 label 是中文——展示层按 code 取字典，保证 EN 视图不漏中文。
  const codeLabel: Record<string, string> = {
    home: t.match.home,
    draw: t.match.draw,
    away: t.match.away,
  };

  const picked = selections.find((s) => s.id === pickedId) ?? null;
  const payout = picked ? quotePayout(stake, picked.multiplier) : 0;

  // 已登录用户内联显示当前余额（新人首测前的认知摩擦修复）
  useEffect(() => {
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const j = (await res.json()) as { balance?: number };
        if (typeof j.balance === "number") setBalance(j.balance);
      }
    })();
  }, []);

  async function refreshOdds() {
    const { data } = await supabase
      .from("selections")
      .select("id, code, label, current_multiplier, pooled_stake")
      .eq("market_id", marketId);
    if (data) {
      const next = (
        data as {
          id: string;
          code: string;
          label: string;
          current_multiplier: number;
          pooled_stake: number;
        }[]
      )
        .map((s) => ({
          id: s.id,
          code: s.code,
          label: s.label,
          multiplier: Number(s.current_multiplier),
          pooledStake: Number(s.pooled_stake) || 0,
        }))
        .sort((a, b) => (ORDER[a.code] ?? 9) - (ORDER[b.code] ?? 9));
      setSelections(next);
    }
  }

  async function submit() {
    if (!picked || busy) return;
    setBusy(true);
    try {
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw new Error(t.match.enterFail + error.message);
        session = (await supabase.auth.getSession()).data.session;
      }
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ selectionId: picked.id, points: stake }),
      });
      const json = (await res.json()) as { error?: string; balance?: number; multiplier?: number };
      if (!res.ok) throw new Error(json.error ?? t.match.submitFail);
      track("prediction_submitted", { marketId, stake });
      toast(
        `${t.match.successA} ${quotePayout(stake, json.multiplier ?? picked.multiplier)} · ${t.match.balanceWord} ${json.balance}`,
        "ok"
      );
      if (typeof json.balance === "number") setBalance(json.balance);
      setPickedId(null);
      await refreshOdds();
    } catch (e) {
      toast(e instanceof Error ? e.message : t.match.submitFail, "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {selections.map((s) => {
          const on = s.id === pickedId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setPickedId(s.id)}
              className={`rounded-md border p-3 text-center transition active:scale-95 ${
                on ? "border-green bg-green/15 shadow-glow" : "border-border bg-surface-2"
              }`}
            >
              <div className="text-[11px] md:text-xs text-muted">{codeLabel[s.code] ?? s.label}</div>
              <div className={`font-head text-2xl font-bold ${on ? "text-green" : "text-text"}`}>
                {s.multiplier.toFixed(2)}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-md border border-border bg-surface-2 p-4">
        <label className="flex items-center justify-between text-xs text-muted">
          {t.match.stake}
          <input
            type="number"
            min={1}
            value={stake}
            onChange={(e) => setStake(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
            className="w-24 rounded-sm border border-border bg-bg px-2 py-1 text-right font-head text-lg text-text"
          />
        </label>
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          {t.match.payout}
          <span className="font-head text-xl text-green">+{payout}</span>
        </div>
        {balance != null && (
          <div className="mt-2 flex items-center justify-between text-[11px] md:text-xs text-muted">
            🪙 {t.me.balanceLabel}
            <span className="font-head text-sm text-text">{balance}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!picked || busy}
        className="mt-4 w-full rounded-md bg-green py-3 text-center font-bold text-[#06231a] shadow-glow transition active:scale-[0.98] disabled:opacity-40"
      >
        {busy ? t.match.submitting : t.match.submit}
      </button>

      <p className="mt-3 text-center text-[10px] md:text-xs text-muted">{t.disclaimer}</p>
    </div>
  );
}
