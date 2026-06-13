"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { copyText } from "@/lib/clipboard";
import { track } from "@/lib/track";
import { swingShareParts, matchUrl } from "@/lib/share/swingShare";
import type { MatchSwing } from "@/lib/prob/getMatchSwing";

// 「爆冷瞬间」分享模块（摆动 OG 图卡前端入口）：页内还原摆动视觉 + 原生分享 + 个人押中炫耀。
// 分享 url = 本场比赛页（其 og:image 已设为摆动卡，链接展开即震撼图）；降级复制+toast；
// 「保存图片卡」直链 /api/og PNG（微信场景长按另存）。挂载拉 /api/me 检测是否本人押中。

export function MatchSwingShare({
  swing,
  matchId,
  locale,
  ogPath,
}: {
  swing: MatchSwing;
  matchId: string;
  locale: "zh" | "en";
  ogPath: string;
}) {
  const [personalWin, setPersonalWin] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 个性化：本人是否在这场押中（按队名匹配 /api/me 已结算注单）。失败静默。
  useEffect(() => {
    track("swing_card_view", { matchId });
    let alive = true;
    (async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) return;
        const res = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const j = (await res.json()) as { recent?: { home: string; away: string; won: boolean }[] };
        const won = (j.recent ?? []).some(
          (b) => b.won && b.home === swing.homeName && b.away === swing.awayName
        );
        if (alive && won) setPersonalWin(true);
      } catch {
        /* 个性化失败不影响主功能 */
      }
    })();
    return () => {
      alive = false;
    };
  }, [matchId, swing.homeName, swing.awayName]);

  const parts = swingShareParts(swing, locale, personalWin);
  const { heroName, before: b, after: a, score, up } = parts;
  const heroColor = up ? "#1be27f" : "#ff5436";

  const c =
    locale === "zh"
      ? {
          headline: personalWin ? "🎯 你猜中了这场爆冷" : "🔥 爆冷瞬间",
          shareBtn: "🔗 分享这一刻",
          saveImg: "保存图片卡",
          copied: "已复制，去粘贴分享 👍",
          copyFail: "复制失败，可截图分享",
        }
      : {
          headline: personalWin ? "🎯 You called this upset" : "🔥 Upset moment",
          shareBtn: "🔗 Share this",
          saveImg: "Save image card",
          copied: "Copied — paste to share 👍",
          copyFail: "Copy failed — screenshot to share",
        };

  const shareUrl = matchUrl(matchId);

  async function onShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: parts.title, text: parts.text, url: shareUrl });
        track("swing_share_click", { matchId, method: "native", personalized: personalWin });
      } catch {
        // 用户取消/分享失败：不强行降级复制（避免打扰），仅记一次
        track("swing_share_click", { matchId, method: "native_dismiss", personalized: personalWin });
      }
      return;
    }
    const ok = copyText(`${parts.text} ${shareUrl}`);
    setToast(ok ? c.copied : c.copyFail);
    track("swing_share_click", { matchId, method: ok ? "copy" : "copy_fail", personalized: personalWin });
    window.setTimeout(() => setToast(null), 2500);
  }

  return (
    <section className="fade-up mt-4 rounded-lg border border-green/40 bg-surface p-4 shadow-glow">
      <div className="mb-2 text-[11px] font-semibold text-muted">{c.headline}</div>
      <div className="flex items-center gap-3">
        {swing.hero.flag && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={swing.hero.flag} alt="" className="h-6 w-9 shrink-0 rounded-[2px] object-cover" />
        )}
        <span className="font-head min-w-0 truncate text-base font-bold">{heroName}</span>
        <span className="ml-auto flex shrink-0 items-baseline gap-2">
          <span className="text-sm text-muted line-through">{b}%</span>
          <span className="text-xs text-muted">→</span>
          <span className="font-head text-2xl font-bold" style={{ color: heroColor }}>
            {a}%
          </span>
        </span>
      </div>
      <div className="mt-1 text-xs text-muted">{score}</div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onShare}
          className="rounded-md bg-green px-3 py-1.5 text-xs font-bold text-[#06231a]"
        >
          {c.shareBtn}
        </button>
        <a
          href={ogPath}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted underline-offset-2 hover:underline"
        >
          {c.saveImg}
        </a>
      </div>
      {toast && <div className="mt-2 text-[11px] text-green">{toast}</div>}
    </section>
  );
}
