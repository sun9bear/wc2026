"use client";

import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import { track } from "@/lib/track";

// 比赛预览分享：未结算比赛页的「赛前模型胜平负概率 + 一键分享」入口（与摆动卡 MatchSwingShare 并列，
// 但摆动卡只在赛后大爆冷出现——本组件补齐"每一场、赛前就能分享"的高频出口）。
// 分享 url = 本场比赛页；「保存图片卡」直链 /api/og?mode=match（胜/平/胜概率卡）。
// 概率由服务端按池倍率反推后传入（前端只展示/分享，不算数，与 og 路由一致）。

const SITE = "https://www.wc2026.cool";

export function MatchPreviewShare({
  matchId,
  home,
  away,
  hp,
  dp,
  ap,
  locale,
}: {
  matchId: string;
  home: string;
  away: string;
  hp: number;
  dp: number;
  ap: number;
  locale: "zh" | "en";
}) {
  const [toast, setToast] = useState<string | null>(null);

  const ogUrl = `${SITE}/api/og?mode=match&h=${encodeURIComponent(home)}&a=${encodeURIComponent(
    away
  )}&hp=${hp}&dp=${dp}&ap=${ap}&locale=${locale}`;
  const shareUrl = `${SITE}/match/${matchId}`;

  const c =
    locale === "zh"
      ? {
          headline: "🔮 赛前模型概率",
          line: `${home} ${hp}% · 平 ${dp}% · ${away} ${ap}%`,
          shareBtn: "🔗 分享",
          saveImg: "🖼 保存图片卡",
          copied: "已复制，去粘贴分享 👍",
          copyFail: "复制失败，可截图分享",
          text: `${home} vs ${away}｜赛前模型：${home} ${hp}%、平 ${dp}%、${away} ${ap}%（万次模拟）`,
        }
      : {
          headline: "🔮 Pre-match model",
          line: `${home} ${hp}% · Draw ${dp}% · ${away} ${ap}%`,
          shareBtn: "🔗 Share",
          saveImg: "🖼 Save image card",
          copied: "Copied — paste to share 👍",
          copyFail: "Copy failed — screenshot to share",
          text: `${home} vs ${away} — pre-match model: ${home} ${hp}%, draw ${dp}%, ${away} ${ap}% (10,000 sims)`,
        };

  async function onShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "wc2026.cool", text: c.text, url: shareUrl });
        track("match_share_click", { matchId, method: "native" });
      } catch {
        track("match_share_click", { matchId, method: "native_dismiss" });
      }
      return;
    }
    const ok = copyText(`${c.text} ${shareUrl}`);
    setToast(ok ? c.copied : c.copyFail);
    track("match_share_click", { matchId, method: ok ? "copy" : "copy_fail" });
    window.setTimeout(() => setToast(null), 2500);
  }

  return (
    <section className="fade-up mt-4 rounded-lg border border-border bg-surface p-4">
      <div className="mb-1 text-[11px] text-muted">{c.headline}</div>
      <div className="mb-3 text-sm">{c.line}</div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onShare}
          className="rounded-md bg-green px-3 py-1.5 text-xs font-bold text-[#06231a]"
        >
          {c.shareBtn}
        </button>
        <a
          href={ogUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("match_share_click", { matchId, method: "save_img" })}
          className="text-xs text-muted underline-offset-2 hover:underline"
        >
          {c.saveImg}
        </a>
      </div>
      {toast && <div className="mt-2 text-[11px] text-green">{toast}</div>}
    </section>
  );
}
