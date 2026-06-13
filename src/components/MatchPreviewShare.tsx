"use client";

import { useEffect, useState } from "react";
import { formatKickoff } from "@/lib/share/matchCard";

// 比赛预览：未结算比赛的「赛前模型胜平负概率」展示卡。
// 任务 A 后：分享/保存图片按钮已移到页眉右上（HeaderShare），本卡只保留概率展示（开球时间按浏览器本地时区）。
export function MatchPreviewShare({
  home,
  away,
  hp,
  dp,
  ap,
  locale,
  kickoff,
}: {
  home: string;
  away: string;
  hp: number;
  dp: number;
  ap: number;
  locale: "zh" | "en";
  kickoff?: string | null;
}) {
  // 浏览器时区格式化 → 仅挂载后显示，避免 SSR(UTC)/客户端时区不一致的 hydration 漂移。
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const kickStr = mounted ? formatKickoff(kickoff, locale) : "";

  const c =
    locale === "zh"
      ? { headline: "🔮 赛前模型概率", line: `${home} ${hp}% · 平 ${dp}% · ${away} ${ap}%` }
      : { headline: "🔮 Pre-match model", line: `${home} ${hp}% · Draw ${dp}% · ${away} ${ap}%` };

  return (
    <section className="fade-up mt-4 rounded-lg border border-border bg-surface p-4">
      <div className="mb-1 text-[11px] text-muted">
        {c.headline}
        {kickStr ? ` · ${kickStr}` : ""}
      </div>
      <div className="text-sm">{c.line}</div>
    </section>
  );
}
