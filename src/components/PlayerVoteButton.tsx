"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getDict, type Locale } from "@/i18n";

const DAILY_MAX = 5;

// 详情页单球员投票（复用 /api/player-vote 与 popularity 文案）。规则同榜单：第1免费/2-5扣10/日限5。
export function PlayerVoteButton({
  playerId,
  initialVotes,
  locale,
}: {
  playerId: string;
  initialVotes: number;
  locale: Locale;
}) {
  const t = getDict(locale).popularity;
  const [votes, setVotes] = useState(initialVotes);
  const [cur, setCur] = useState(0); // 今日已投
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const s = (await supabase.auth.getSession()).data.session;
      if (!s) return;
      const r = await fetch("/api/player-vote?mine=1", {
        headers: { Authorization: `Bearer ${s.access_token}` },
      });
      if (r.ok) {
        const j = (await r.json()) as { mine?: Record<string, number>; balance?: number | null };
        setCur(j.mine?.[playerId] ?? 0);
        setBalance(j.balance ?? null);
      }
    })();
  }, [playerId]);

  async function vote() {
    if (busy) return;
    if (cur >= DAILY_MAX) {
      setErr(t.dailyMax);
      return;
    }
    setBusy(true);
    setErr(null);
    setVotes((v) => v + 1);
    setCur((c) => c + 1);
    const rollback = () => {
      setVotes((v) => Math.max(0, v - 1));
      setCur((c) => Math.max(0, c - 1));
    };
    try {
      let s = (await supabase.auth.getSession()).data.session;
      if (!s) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        s = (await supabase.auth.getSession()).data.session;
      }
      const r = await fetch("/api/player-vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${s?.access_token ?? ""}`,
        },
        body: JSON.stringify({ playerId }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        votes?: number;
        todayCount?: number;
        balance?: number | null;
        error?: string;
      };
      if (!r.ok) {
        rollback();
        setErr(j.error === "insufficient_points" ? t.noPoints : j.error === "daily_limit" ? t.dailyMax : t.voteFail);
        return;
      }
      if (typeof j.votes === "number") setVotes(j.votes);
      if (typeof j.todayCount === "number") setCur(j.todayCount);
      if (typeof j.balance === "number") setBalance(j.balance);
    } catch {
      rollback();
      setErr(t.voteFail);
    } finally {
      setBusy(false);
    }
  }

  const maxed = cur >= DAILY_MAX;
  const label = maxed ? t.dailyMax : cur === 0 ? t.vote : t.voteRepeat;
  const btnCls = maxed
    ? "border border-border text-muted"
    : cur === 0
      ? "bg-green text-[#06231a]"
      : "border border-gold/60 text-gold";

  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        type="button"
        onClick={vote}
        disabled={busy || maxed}
        className={`rounded-pill px-5 py-2 text-sm font-bold transition disabled:opacity-40 ${btnCls}`}
      >
        {busy ? "…" : label}
      </button>
      <span className="text-xs text-muted tabular-nums">
        🗳 {votes}
        {cur > 0 ? ` · ${cur}/${DAILY_MAX}` : ""}
        {balance !== null ? ` · ${t.points} ${balance}` : ""}
      </span>
      {err && <span className="text-xs text-red">{err}</span>}
    </div>
  );
}
