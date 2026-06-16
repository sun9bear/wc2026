"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getDict, type Locale } from "@/i18n";

export interface PopularityRow {
  id: string;
  rank: number;
  name: string;
  teamLabel: string;
  flag: string | null;
  votes: number;
  index: number; // 0-100 综合指数（服务端，排序依据）
  voteScore: number;
  perfScore: number;
  buzzScore: number;
  blurb: string | null;
}

const DAILY_MAX = 5; // 每球员每天最多票数（与 API 一致）

export function PopularityList({ rows, locale }: { rows: PopularityRow[]; locale: Locale }) {
  const t = getDict(locale).popularity;
  // 票数乐观更新（🗳 立即反馈）；index/分项为服务端静态值，SSR 60s 内收敛。
  const [votes, setVotes] = useState<Record<string, number>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, r.votes]))
  );
  const [myToday, setMyToday] = useState<Record<string, number>>({}); // 今日各球员已投票数
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // 挂载后查「今日已投 + 余额」（未登录则空，不主动注册）。
  useEffect(() => {
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      const res = await fetch("/api/player-vote?mine=1", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const j = (await res.json()) as { mine?: Record<string, number>; balance?: number | null };
        setMyToday(j.mine ?? {});
        setBalance(j.balance ?? null);
      }
    })();
  }, []);

  async function vote(id: string) {
    if (busy) return;
    const cur = myToday[id] ?? 0;
    if (cur >= DAILY_MAX) {
      setErr(t.dailyMax);
      return;
    }
    setBusy(id);
    setErr(null);
    // 乐观 +1
    setVotes((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
    setMyToday((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
    const rollback = () => {
      setVotes((p) => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) - 1) }));
      setMyToday((p) => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) - 1) }));
    };
    try {
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        session = (await supabase.auth.getSession()).data.session;
      }
      const res = await fetch("/api/player-vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ playerId: id }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        votes?: number;
        todayCount?: number;
        balance?: number | null;
        error?: string;
      };
      if (!res.ok) {
        rollback();
        setErr(j.error === "insufficient_points" ? t.noPoints : j.error === "daily_limit" ? t.dailyMax : t.voteFail);
        return;
      }
      // 以服务端真值校正
      if (typeof j.votes === "number") setVotes((p) => ({ ...p, [id]: j.votes as number }));
      if (typeof j.todayCount === "number") setMyToday((p) => ({ ...p, [id]: j.todayCount as number }));
      if (typeof j.balance === "number") setBalance(j.balance);
    } catch {
      rollback();
      setErr(t.voteFail);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {balance !== null && (
        <p className="mt-3 text-right text-[11px] text-muted">
          {t.points}: <span className="font-head font-bold text-gold tabular-nums">{balance}</span>
        </p>
      )}
      {err && <p className="mt-2 text-center text-xs text-red">{err}</p>}
      <ul className="mt-3 space-y-2">
        {rows.map((r) => {
          const cur = myToday[r.id] ?? 0;
          const maxed = cur >= DAILY_MAX;
          const label = maxed ? t.dailyMax : cur === 0 ? t.vote : t.voteRepeat;
          const btnCls = maxed
            ? "border border-border text-muted"
            : cur === 0
              ? "bg-green text-[#06231a]"
              : "border border-gold/60 text-gold";
          return (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-md border border-border bg-surface-2 p-3"
            >
              <span className="font-head w-6 shrink-0 text-center text-lg font-bold text-muted">{r.rank}</span>
              {r.flag ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.flag} alt="" className="h-5 w-7 shrink-0 rounded-sm object-cover ring-1 ring-border" />
              ) : (
                <span className="inline-block w-7 shrink-0 text-center">⚽</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate">
                  <span className="text-sm font-medium">{r.name}</span>
                  <span className="ml-1.5 text-[11px] text-muted">{r.teamLabel}</span>
                </span>
                {/* 分项拆解（透明）：🗳 总票 · ⚽ 表现0-100 · 🔥 热度0-100 · 今日x/5 */}
                <span className="block text-[11px] text-muted tabular-nums">
                  🗳 {Math.max(0, votes[r.id] ?? 0)} · ⚽ {r.perfScore} · 🔥 {r.buzzScore}
                  {cur > 0 ? ` · ${cur}/${DAILY_MAX}` : ""}
                </span>
                {r.blurb && <span className="mt-0.5 block text-[11px] italic text-muted">{r.blurb}</span>}
              </span>
              <span
                className="font-head shrink-0 text-right text-lg font-bold tabular-nums text-green"
                aria-label={t.title}
              >
                {r.index}
              </span>
              <button
                type="button"
                onClick={() => vote(r.id)}
                disabled={busy === r.id || maxed}
                className={`shrink-0 rounded-pill px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 ${btnCls}`}
              >
                {busy === r.id ? "…" : label}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
