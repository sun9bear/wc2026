"use client";

import { useEffect, useState } from "react";
import { formatKickoff } from "@/lib/share/matchCard";
import type { Locale } from "@/i18n";

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
  locale: Locale;
  kickoff?: string | null;
}) {
  // 浏览器时区格式化 → 仅挂载后显示，避免 SSR(UTC)/客户端时区不一致的 hydration 漂移。
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const k = mounted ? formatKickoff(kickoff, locale) : { date: "", time: "" };
  const kickStr = k.date ? `${k.date} ${k.time}` : "";

  const HEAD: Record<Locale, { headline: string; draw: string }> = {
    zh: { headline: "🔮 赛前模型概率", draw: "平" },
    en: { headline: "🔮 Pre-match model", draw: "Draw" },
    es: { headline: "🔮 Modelo previo", draw: "Empate" },
    pt: { headline: "🔮 Modelo pré-jogo", draw: "Empate" },
    de: { headline: "🔮 Vorab-Modell", draw: "Unentschieden" },
    fr: { headline: "🔮 Modèle d'avant-match", draw: "Nul" },
  };
  const t = HEAD[locale] ?? HEAD.en;
  const c = { headline: t.headline, line: `${home} ${hp}% · ${t.draw} ${dp}% · ${away} ${ap}%` };

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
