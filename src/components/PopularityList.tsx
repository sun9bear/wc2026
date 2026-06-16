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

export function PopularityList({ rows, locale }: { rows: PopularityRow[]; locale: Locale }) {
  const t = getDict(locale).popularity;
  // 仅票数乐观更新（🗳 立即反馈）；index/分项为服务端静态值，SSR 60s 内收敛。
  const [votes, setVotes] = useState<Record<string, number>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, r.votes]))
  );
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // 挂载后查「我投过谁」（未登录则空，不主动注册）。
  useEffect(() => {
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      const res = await fetch("/api/player-vote?mine=1", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const j = (await res.json()) as { voted: string[] };
        setVoted(new Set(j.voted));
      }
    })();
  }, []);

  async function toggle(id: string) {
    if (busy) return;
    setBusy(id);
    setErr(null);
    const wasVoted = voted.has(id);
    const action = wasVoted ? "unvote" : "vote";

    // 乐观更新
    setVoted((prev) => {
      const n = new Set(prev);
      if (wasVoted) n.delete(id);
      else n.add(id);
      return n;
    });
    setVotes((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + (wasVoted ? -1 : 1) }));

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
        body: JSON.stringify({ playerId: id, action }),
      });
      if (!res.ok) throw new Error("vote failed");
      const j = (await res.json()) as { votes: number; voted: boolean };
      setVotes((prev) => ({ ...prev, [id]: j.votes }));
      setVoted((prev) => {
        const n = new Set(prev);
        if (j.voted) n.add(id);
        else n.delete(id);
        return n;
      });
    } catch {
      // 回滚
      setVoted((prev) => {
        const n = new Set(prev);
        if (wasVoted) n.add(id);
        else n.delete(id);
        return n;
      });
      setVotes((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + (wasVoted ? 1 : -1) }));
      setErr(t.voteFail);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {err && <p className="mt-3 text-center text-xs text-red">{err}</p>}
      <ul className="mt-5 space-y-2">
        {rows.map((r) => {
          const isVoted = voted.has(r.id);
          return (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-md border border-border bg-surface-2 p-3"
            >
              <span className="font-head w-6 shrink-0 text-center text-lg font-bold text-muted">
                {r.rank}
              </span>
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
                {/* 分项拆解（透明）：🗳 票数 · ⚽ 表现0-100 · 🔥 热度0-100 */}
                <span className="block text-[11px] text-muted tabular-nums">
                  🗳 {Math.max(0, votes[r.id] ?? 0)} · ⚽ {r.perfScore} · 🔥 {r.buzzScore}
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
                onClick={() => toggle(r.id)}
                disabled={busy === r.id}
                className={`shrink-0 rounded-pill px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 ${
                  isVoted ? "bg-green text-[#06231a]" : "border border-green/50 text-green"
                }`}
              >
                {isVoted ? t.voted : t.vote}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
