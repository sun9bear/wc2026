"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { teamZh } from "@/lib/football/teams";
import { fmtPoints } from "@/lib/format";
import { copyText } from "@/lib/clipboard";
import { track } from "@/lib/track";
import { swingShareParts, matchUrl } from "@/lib/share/swingShare";
import { defaultName } from "@/lib/identity/defaultName";
import type { MatchSwing } from "@/lib/prob/getMatchSwing";
import { localeHref, type Locale } from "@/i18n";

// 结算揭晓抽屉（任务 3）：挂 / 与 /me。localStorage 存 last_seen_settled_at，
// 检测到新结算 → 底部抽屉 + Me tab 红点（经 localStorage + 自定义事件联动 BottomNav）。
// 首次（无记录）只回看最近 24h，避免老用户被历史结果刷屏。MVP 无动画。

const SEEN_KEY = "last_seen_settled_at";
const DOT_KEY = "wc_unseen_settled";
export const SETTLE_NEW_EVENT = "wc:settled-new";
export const SETTLE_SEEN_EVENT = "wc:settled-seen";

interface RecentBet {
  won: boolean;
  matchId?: string;
  kickoff: string;
  settledAt: string | null;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  multiplier: number;
  payout: number;
  stake: number;
  legs: number;
}

const TXT = {
  zh: {
    title: "📣 你的竞猜有新结果",
    win: (b: RecentBet) =>
      b.legs > 1
        ? `🎉 串关全中！×${b.multiplier.toFixed(2)}，+${fmtPoints(b.payout)} 积分入账`
        : `🎉 猜中了！${teamZh(b.home)} ${b.homeScore}-${b.awayScore} ${teamZh(b.away)}，你的竞猜 ×${b.multiplier.toFixed(2)}，+${fmtPoints(b.payout)} 积分入账`,
    lose: (b: RecentBet) =>
      b.legs > 1
        ? `串关差一点 −${fmtPoints(b.stake)}`
        : `${teamZh(b.home)} ${b.homeScore}-${b.awayScore} ${teamZh(b.away)}，这场没猜中 −${fmtPoints(b.stake)}`,
    comeback: (n: number) =>
      n > 0 ? `接下来还有 ${n} 场翻盘机会 →` : "下一轮翻盘机会马上来 →",
    more: (n: number) => `…还有 ${n} 条结果`,
    cta: "看我的战绩",
    close: "知道了",
    flexUpset: "🎯 晒这波爆冷",
    copied: "已复制，去粘贴分享 👍",
    copyFail: "复制失败，可截图分享",
  },
  en: {
    title: "📣 Your picks have new results",
    win: (b: RecentBet) =>
      b.legs > 1
        ? `🎉 Combo landed! ×${b.multiplier.toFixed(2)} — +${fmtPoints(b.payout)} points`
        : `🎉 Spot on! ${b.home} ${b.homeScore}-${b.awayScore} ${b.away} — your pick earned ×${b.multiplier.toFixed(2)}, +${fmtPoints(b.payout)} points`,
    lose: (b: RecentBet) =>
      b.legs > 1
        ? `Combo fell short −${fmtPoints(b.stake)}`
        : `${b.home} ${b.homeScore}-${b.awayScore} ${b.away} — missed this one −${fmtPoints(b.stake)}`,
    comeback: (n: number) =>
      n > 0 ? `${n} more matches coming up — time for a comeback →` : "Next round is coming right up →",
    more: (n: number) => `…and ${n} more results`,
    cta: "See my record",
    close: "Got it",
    flexUpset: "🎯 Flex this upset",
    copied: "Copied — paste to share 👍",
    copyFail: "Copy failed — screenshot to share",
  },
} as const;

export function SettleDrawer({ locale }: { locale: Locale }) {
  const t = TXT[locale];
  const [items, setItems] = useState<RecentBet[]>([]);
  const [upcoming, setUpcoming] = useState(0);
  const [open, setOpen] = useState(false);
  const [swings, setSwings] = useState<Record<string, MatchSwing>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) return;
        if (alive) setUid(session.user.id);
        const res = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const j = (await res.json()) as { nickname?: string | null; recent?: RecentBet[] };
        if (alive && j.nickname) setNickname(j.nickname);
        const recent = (j.recent ?? []).filter((b) => b.settledAt);
        if (recent.length === 0) return;

        const seen = localStorage.getItem(SEEN_KEY);
        const floor =
          seen ?? new Date(Date.now() - 24 * 3600 * 1000).toISOString(); // 首次只回看 24h
        const unseen = recent
          .filter((b) => (b.settledAt as string) > floor)
          .sort((a, b) => (b.settledAt as string).localeCompare(a.settledAt as string));
        if (!alive || unseen.length === 0) return;

        // 翻盘文案用的未来 36h 场次数（anon 可读）
        try {
          const { count } = await supabase
            .from("matches")
            .select("id", { count: "exact", head: true })
            .gt("kickoff_at", new Date().toISOString())
            .lt("kickoff_at", new Date(Date.now() + 36 * 3600 * 1000).toISOString());
          if (alive) setUpcoming(count ?? 0);
        } catch {
          /* 计数失败不影响抽屉 */
        }

        setItems(unseen);
        setOpen(true);
        localStorage.setItem(DOT_KEY, "1");
        window.dispatchEvent(new Event(SETTLE_NEW_EVENT));

        // 揭晓里本人押中的爆冷场：拉 swing 给"晒一晒"（按 matchId 去重，取前几条 won）。
        const wonIds = [
          ...new Set(unseen.filter((x) => x.won && x.matchId).map((x) => x.matchId as string)),
        ].slice(0, 4);
        const sw: Record<string, MatchSwing> = {};
        await Promise.all(
          wonIds.map(async (mid) => {
            try {
              const r = await fetch(`/api/swing?id=${mid}`);
              if (!r.ok) return;
              const s = (await r.json()) as MatchSwing | null;
              if (s && s.hero) sw[mid] = s;
            } catch {
              /* 单场失败忽略 */
            }
          })
        );
        if (alive && Object.keys(sw).length) setSwings(sw);
      } catch {
        /* 静默：抽屉是增强功能，绝不打扰主流程 */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function dismiss() {
    const maxSeen = items.reduce<string>(
      (a, b) => ((b.settledAt as string) > a ? (b.settledAt as string) : a),
      new Date().toISOString()
    );
    try {
      localStorage.setItem(SEEN_KEY, maxSeen);
      localStorage.removeItem(DOT_KEY);
    } catch {
      /* 隐私模式等 */
    }
    window.dispatchEvent(new Event(SETTLE_SEEN_EVENT));
    setOpen(false);
  }

  async function shareUpset(swing: MatchSwing, mid: string) {
    const by = nickname ?? (uid ? defaultName(uid, locale) : undefined);
    const parts = swingShareParts(swing, locale, true, by); // 抽屉里都是本人押中 → 第一人称 + 署名
    const url = matchUrl(mid, locale);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: parts.title, text: parts.text, url });
        track("swing_share_click", { matchId: mid, method: "native", source: "settle_drawer" });
      } catch {
        track("swing_share_click", { matchId: mid, method: "native_dismiss", source: "settle_drawer" });
      }
      return;
    }
    const ok = copyText(`${parts.text} ${url}`);
    setToast(ok ? t.copied : t.copyFail);
    track("swing_share_click", { matchId: mid, method: ok ? "copy" : "copy_fail", source: "settle_drawer" });
    window.setTimeout(() => setToast(null), 2500);
  }

  if (!open || items.length === 0) return null;

  const shown = items.slice(0, 3);
  const hasLoss = items.some((b) => !b.won);

  return (
    <div className="fixed inset-x-0 bottom-14 z-50 px-3 pb-2">
      <div className="mx-auto w-full max-w-xl rounded-lg border border-green/40 bg-surface p-4 shadow-glow">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-head text-sm font-semibold">{t.title}</span>
          <button type="button" onClick={dismiss} className="text-xs text-muted">
            ✕
          </button>
        </div>
        <ul className="space-y-1.5 text-sm">
          {shown.map((b, i) => {
            const sw = b.won && b.matchId ? swings[b.matchId] : undefined;
            return (
              <li key={i} className={b.won ? "text-green" : "text-muted"}>
                {b.won ? t.win(b) : t.lose(b)}
                {sw && (
                  <button
                    type="button"
                    onClick={() => shareUpset(sw, b.matchId as string)}
                    className="ml-2 inline-block rounded bg-green/15 px-1.5 py-0.5 align-middle text-[11px] font-semibold text-green"
                  >
                    {t.flexUpset}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {items.length > shown.length && (
          <div className="mt-1 text-[11px] text-muted">{t.more(items.length - shown.length)}</div>
        )}
        {hasLoss && <div className="mt-2 text-xs text-muted">{t.comeback(upcoming)}</div>}
        {toast && <div className="mt-2 text-[11px] text-green">{toast}</div>}
        <div className="mt-3 flex gap-2 text-xs">
          <Link
            href={localeHref(locale, "/me")}
            onClick={dismiss}
            className="rounded-md bg-green px-3 py-1.5 font-bold text-[#06231a]"
          >
            {t.cta}
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-muted"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
