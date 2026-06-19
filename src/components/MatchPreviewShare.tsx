"use client";

import { useEffect, useState } from "react";
import { formatKickoff } from "@/lib/share/matchCard";
import type { Locale } from "@/i18n";

// 比赛页「模型胜平负概率」主展示（队名正下方第一屏的答案）。
// 数据 = 引擎每小时融合快照的胜平负概率（与「最可能比分」「概率走势」严格同源、走势末点对齐）。
// fresh=true：来自引擎快照（每小时刷新，越近越准）；fresh=false：回落池倍率隐含值（无快照时）。
// 配色与 /forecast、MatchProbTrend 一致：主胜绿、平局灰、客胜橙。

const HOME = "#1be27f";
const AWAY = "#f97316";

export function MatchPreviewShare({
  home,
  away,
  hp,
  dp,
  ap,
  locale,
  kickoff,
  fresh = false,
}: {
  home: string;
  away: string;
  hp: number;
  dp: number;
  ap: number;
  locale: Locale;
  kickoff?: string | null;
  fresh?: boolean;
}) {
  // 浏览器时区格式化 → 仅挂载后显示，避免 SSR(UTC)/客户端时区不一致的 hydration 漂移。
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const k = mounted ? formatKickoff(kickoff, locale) : { date: "", time: "" };
  const kickStr = k.date ? `${k.date} ${k.time}` : "";

  const COPY: Record<Locale, { headline: string; draw: string; fresh: string; stat: string }> = {
    zh: {
      headline: "🔮 模型胜平负概率",
      draw: "平局",
      fresh: "Elo 实力 + 市场融合 · 每小时更新 · 越近越准",
      stat: "赛前模型测算",
    },
    en: {
      headline: "🔮 Model win / draw / loss",
      draw: "Draw",
      fresh: "Elo strength + market blend · hourly · sharper near kickoff",
      stat: "Pre-match model estimate",
    },
    es: {
      headline: "🔮 Modelo: victoria/empate/derrota",
      draw: "Empate",
      fresh: "Fuerza Elo + mercado · cada hora · más nítido cerca del inicio",
      stat: "Estimación del modelo previa al partido",
    },
    pt: {
      headline: "🔮 Modelo: vitória/empate/derrota",
      draw: "Empate",
      fresh: "Força Elo + mercado · a cada hora · mais nítido perto do início",
      stat: "Estimativa do modelo pré-jogo",
    },
    de: {
      headline: "🔮 Modell: Sieg/Remis/Niederlage",
      draw: "Remis",
      fresh: "Elo-Stärke + Markt · stündlich · schärfer kurz vor Anpfiff",
      stat: "Vorab-Modellschätzung",
    },
    fr: {
      headline: "🔮 Modèle : victoire/nul/défaite",
      draw: "Nul",
      fresh: "Force Elo + marché · chaque heure · plus précis près du coup d'envoi",
      stat: "Estimation du modèle d'avant-match",
    },
  };
  const t = COPY[locale] ?? COPY.en;
  const note = fresh ? t.fresh : t.stat;

  const cols = [
    { label: home, pct: hp, color: HOME as string | undefined },
    { label: t.draw, pct: dp, color: undefined },
    { label: away, pct: ap, color: AWAY as string | undefined },
  ];

  return (
    <section className="fade-up mt-3 rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-head text-sm font-semibold md:text-base">{t.headline}</span>
        {kickStr && <span className="text-[10px] text-muted md:text-xs">{kickStr}</span>}
      </div>

      {/* 三段比例条：主胜绿 / 平局灰 / 客胜橙 */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div style={{ width: `${hp}%`, backgroundColor: HOME }} aria-hidden />
        <div className="bg-muted/60" style={{ width: `${dp}%` }} aria-hidden />
        <div style={{ width: `${ap}%`, backgroundColor: AWAY }} aria-hidden />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {cols.map((col, i) => (
          <div key={i}>
            <div className="truncate text-[11px] text-muted md:text-xs">{col.label}</div>
            <div
              className="font-head text-2xl font-bold tabular-nums"
              style={col.color ? { color: col.color } : undefined}
            >
              {col.pct}%
            </div>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-muted md:text-xs">{note}</p>
    </section>
  );
}
