"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { quotePayout } from "@/lib/bets/quote";
import { useToast } from "@/components/Toast";
import type { SelectionView } from "@/lib/markets/getMatchDetail";

const ORDER: Record<string, number> = { home: 0, draw: 1, away: 2 };

export function MarketPicks({
  marketId,
  selections: initial,
}: {
  marketId: string;
  selections: SelectionView[];
}) {
  const [selections, setSelections] = useState<SelectionView[]>(initial);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [stake, setStake] = useState(100);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const picked = selections.find((s) => s.id === pickedId) ?? null;
  const payout = picked ? quotePayout(stake, picked.multiplier) : 0;

  async function refreshOdds() {
    const { data } = await supabase
      .from("selections")
      .select("id, code, label, current_multiplier")
      .eq("market_id", marketId);
    if (data) {
      const next = (data as { id: string; code: string; label: string; current_multiplier: number }[])
        .map((s) => ({
          id: s.id,
          code: s.code,
          label: s.label,
          multiplier: Number(s.current_multiplier),
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
        if (error) throw new Error("进入游戏失败：" + error.message);
        session = (await supabase.auth.getSession()).data.session;
      }
      const res = await fetch("/api/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ selectionId: picked.id, stake }),
      });
      const json = (await res.json()) as { error?: string; balance?: number; multiplier?: number };
      if (!res.ok) throw new Error(json.error ?? "提交失败");
      toast(
        `预测成功！命中可派 ${quotePayout(stake, json.multiplier ?? picked.multiplier)} · 余额 ${json.balance}`,
        "ok"
      );
      setPickedId(null);
      await refreshOdds();
    } catch (e) {
      toast(e instanceof Error ? e.message : "提交失败", "err");
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
              <div className="text-[11px] text-muted">{s.label}</div>
              <div className={`font-head text-2xl font-bold ${on ? "text-green" : "text-text"}`}>
                {s.multiplier.toFixed(2)}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-md border border-border bg-surface-2 p-4">
        <label className="flex items-center justify-between text-xs text-muted">
          投入积分
          <input
            type="number"
            min={1}
            value={stake}
            onChange={(e) => setStake(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
            className="w-24 rounded-sm border border-border bg-bg px-2 py-1 text-right font-head text-lg text-text"
          />
        </label>
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          命中可派分
          <span className="font-head text-xl text-green">+{payout}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!picked || busy}
        className="mt-4 w-full rounded-md bg-green py-3 text-center font-bold text-[#06231a] shadow-glow transition active:scale-[0.98] disabled:opacity-40"
      >
        {busy ? "提交中…" : "提交预测"}
      </button>

      <p className="mt-3 text-center text-[10px] text-muted">仅供娱乐 · 积分无现实价值 · 不可兑换</p>
    </div>
  );
}
