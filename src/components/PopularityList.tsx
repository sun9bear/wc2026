"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { getDict, localeHref, type Locale } from "@/i18n";

export interface PopularityRow {
  id: string;
  slug: string;
  rank: number;
  name: string;
  teamLabel: string;
  flag: string | null;
  photo: string | null;
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
          // 前三名头像：金/银/铜描边 + 呼吸光晕；其余普通描边。
          const podium =
            r.rank === 1
              ? "podium podium-1"
              : r.rank === 2
                ? "podium podium-2"
                : r.rank === 3
                  ? "podium podium-3"
                  : "ring-1 ring-border";
          const detail = localeHref(locale, `/player/${r.slug}`);
          return (
            <li
              key={r.id}
              className="flex items-start gap-3 rounded-md border border-border bg-surface-2 p-3"
            >
              {/* 左列：排名编号在上、头像在下（头像可点进详情；前三名金银铜光晕） */}
              <div className="flex w-11 shrink-0 flex-col items-center gap-1.5">
                <span className="font-head text-lg font-bold leading-none text-muted">{r.rank}</span>
                <Link href={detail} aria-label={r.name}>
                  {r.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.photo} alt="" className={`h-11 w-11 rounded-full object-cover ${podium}`} />
                  ) : r.flag ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.flag} alt="" className={`h-9 w-11 rounded-sm object-cover ${podium}`} />
                  ) : (
                    <span className="inline-block text-2xl leading-none">⚽</span>
                  )}
                </Link>
              </div>
              {/* 中列：名/队/分项/短评（可点进详情） */}
              <Link href={detail} className="group min-w-0 flex-1">
                <span className="block truncate">
                  <span className="text-sm font-medium group-hover:text-green group-hover:underline">
                    {r.name}
                  </span>
                  <span className="ml-1.5 text-[11px] text-muted">{r.teamLabel}</span>
                </span>
                {/* 分项拆解（透明）：🗳 总票 · ⚽ 表现0-100 · 🔥 热度0-100 · 今日x/5 */}
                <span className="block text-[11px] text-muted tabular-nums">
                  🗳 {Math.max(0, votes[r.id] ?? 0)} · ⚽ {r.perfScore} · 🔥 {r.buzzScore}
                  {cur > 0 ? ` · ${cur}/${DAILY_MAX}` : ""}
                </span>
                {r.blurb && <span className="mt-0.5 block text-[11px] italic text-muted">{r.blurb}</span>}
              </Link>
              {/* 右列：综合指数在上、投票按钮在下（按钮放票数下方）；副行提示再投扣分 / 今日已满 */}
              <div className="flex w-16 shrink-0 flex-col items-center gap-1">
                <span
                  className="font-head text-lg font-bold leading-none tabular-nums text-green"
                  aria-label={t.title}
                >
                  {r.index}
                </span>
                <button
                  type="button"
                  onClick={() => vote(r.id)}
                  disabled={busy === r.id || maxed}
                  className={`w-full rounded-pill px-2 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                    maxed ? "border border-border text-muted" : "bg-green text-[#06231a]"
                  }`}
                >
                  {busy === r.id ? "…" : t.vote}
                </button>
                {maxed ? (
                  <span className="text-center text-[10px] leading-tight text-muted">{t.dailyMax}</span>
                ) : cur > 0 ? (
                  <span className="text-center text-[10px] leading-tight text-gold">{t.voteRepeat}</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
