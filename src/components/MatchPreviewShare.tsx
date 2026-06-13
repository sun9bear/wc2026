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
  kickoff,
  homeFlag,
  awayFlag,
  aiTake,
}: {
  matchId: string;
  home: string;
  away: string;
  hp: number;
  dp: number;
  ap: number;
  locale: "zh" | "en";
  kickoff?: string | null;
  homeFlag?: string | null;
  awayFlag?: string | null;
  aiTake?: string | null;
}) {
  const [toast, setToast] = useState<string | null>(null);

  // 开球时间：用浏览器本地时区格式化（含时区缩写）。静态图烤的是「分享者本地时间」——
  // 无法逐观看者本地化，时区缩写让别的时区也能换算。
  const kickStr = (() => {
    if (!kickoff) return "";
    try {
      return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date(kickoff));
    } catch {
      return "";
    }
  })();
  const enc = encodeURIComponent;
  // AI 短评按页面语言传入（中文=DeepSeek 的 sentiment，其他=Gemini 的 sentimentEn）；路由会截断+过雷词。
  const ogUrl =
    `${SITE}/api/og?mode=match&fmt=portrait&h=${enc(home)}&a=${enc(away)}&hp=${hp}&dp=${dp}&ap=${ap}&locale=${locale}` +
    (homeFlag && homeFlag.startsWith("http") ? `&hf=${enc(homeFlag)}` : "") +
    (awayFlag && awayFlag.startsWith("http") ? `&af=${enc(awayFlag)}` : "") +
    (kickStr ? `&t=${enc(kickStr)}` : "") +
    (aiTake ? `&q=${enc(aiTake)}` : "");
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
      <div className="mb-1 text-[11px] text-muted">
        {c.headline}
        {kickStr ? ` · ${kickStr}` : ""}
      </div>
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
