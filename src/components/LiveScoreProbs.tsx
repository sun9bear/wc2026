"use client";

// 进行中比赛的实时最终比分预测（客户端 ~30s 轮询 /api/live）。
// 实时命中 → 显示实时比分+分钟+最终比分概率；未命中 → 回退赛前分布（ScoreProbs）。
// 合规：标题「实时最终比分预测 / Live final-score forecast」，概率条，零博彩词。

import { useEffect, useRef, useState } from "react";
import { teamName } from "@/lib/football/teams";
import { ScoreProbs } from "@/components/ScoreProbs";
import type { Locale } from "@/i18n";
import type { MatchScoreline } from "@/lib/prob/getMatchScoreline";

interface LiveResp {
  live: boolean;
  score?: { h: number; a: number };
  minute?: number;
  short?: string;
  top?: { h: number; a: number; p: number }[];
  p?: { home: number; draw: number; away: number };
}

const COPY: Record<
  Locale,
  { title: string; sub: string; other: string; pre: string; note: string; nodata: string }
> = {
  zh: {
    title: "实时最终比分预测",
    sub: "进球后自动更新",
    other: "其他比分",
    pre: "赛前比分预测（比赛进行中）",
    note: "每约 30 秒刷新；按当前比分与剩余时间的泊松模型重算。",
    nodata: "比赛进行中，实时比分数据接入中…",
  },
  en: {
    title: "Live final-score forecast",
    sub: "updates after goals",
    other: "Other scores",
    pre: "Pre-match score forecast (match in progress)",
    note: "Refreshes ~every 30s; Poisson model from current score and time left.",
    nodata: "Match in progress — live data connecting…",
  },
  es: {
    title: "Previsión del marcador final en vivo",
    sub: "se actualiza tras los goles",
    other: "Otros resultados",
    pre: "Previsión de marcador previa (partido en curso)",
    note: "Se actualiza cada ~30 s; modelo de Poisson según el marcador actual y el tiempo restante.",
    nodata: "Partido en curso — conectando datos en vivo…",
  },
  pt: {
    title: "Previsão do placar final ao vivo",
    sub: "atualiza após os gols",
    other: "Outros placares",
    pre: "Previsão de placar pré-jogo (partida em andamento)",
    note: "Atualiza a cada ~30 s; modelo de Poisson com base no placar atual e no tempo restante.",
    nodata: "Partida em andamento — conectando dados ao vivo…",
  },
  de: {
    title: "Live-Prognose Endstand",
    sub: "aktualisiert nach Toren",
    other: "Andere Ergebnisse",
    pre: "Endstand-Prognose vor dem Spiel (Spiel läuft)",
    note: "Aktualisiert ~alle 30 s; Poisson-Modell aus aktuellem Stand und Restzeit.",
    nodata: "Spiel läuft — Live-Daten werden verbunden…",
  },
  fr: {
    title: "Prévision du score final en direct",
    sub: "mise à jour après les buts",
    other: "Autres scores",
    pre: "Prévision de score d'avant-match (match en cours)",
    note: "Mise à jour ~toutes les 30 s ; modèle de Poisson selon le score actuel et le temps restant.",
    nodata: "Match en cours — connexion des données en direct…",
  },
};

function Side({ name, flag, locale }: { name: string; flag: string | null; locale: Locale }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {flag && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flag} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
      )}
      <span className="truncate">{teamName(name, locale)}</span>
    </span>
  );
}

export function LiveScoreProbs({
  matchId,
  home,
  away,
  locale,
  fallback,
}: {
  matchId: string;
  home: { name: string; flag: string | null };
  away: { name: string; flag: string | null };
  locale: Locale;
  fallback: MatchScoreline | null;
}) {
  const c = COPY[locale] ?? COPY.en;
  const [data, setData] = useState<LiveResp | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const r = await fetch(`/api/live?id=${matchId}`, { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as LiveResp;
        if (alive) setData(j);
      } catch {
        /* 忽略，下次轮询再试 */
      }
    };
    poll();
    timer.current = setInterval(poll, 30_000);
    return () => {
      alive = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [matchId]);

  // 实时不可用：降级赛前分布（若有），否则一句进行中提示。
  if (!data?.live || !data.top || data.top.length === 0 || !data.score) {
    if (fallback) {
      return (
        <div className="fade-up mt-5">
          <p className="mb-2 text-[11px] text-muted">⏱ {c.pre}</p>
          <ScoreProbs data={fallback} locale={locale} home={home} away={away} />
        </div>
      );
    }
    return (
      <p className="fade-up mt-5 rounded-lg border border-border bg-surface p-4 text-center text-sm text-muted">
        {c.nodata}
      </p>
    );
  }

  const top = data.top;
  const sc = data.score;
  const minute = data.minute ?? 0;
  const sum = top.reduce((s, x) => s + x.p, 0);
  const otherP = Math.min(1, Math.max(0, 1 - sum));
  const max = top[0]?.p ?? 1;
  const pct = (p: number) => (p * 100).toFixed(p < 0.1 ? 1 : 0) + "%";

  return (
    <section className="fade-up mt-5 rounded-lg border border-[#ff5436]/40 bg-surface p-4">
      <div className="mb-0.5 flex items-baseline justify-between">
        <h2 className="font-head flex items-center gap-2 text-sm font-semibold">
          <span className="live-dot" /> {c.title}
        </h2>
        <span className="text-[10px] text-muted">{c.sub}</span>
      </div>

      <div className="mb-3 flex items-center justify-between text-[11px]">
        <Side name={home.name} flag={home.flag} locale={locale} />
        <span className="font-head text-sm">
          <span className="text-green">{sc.h}</span>
          <span className="mx-1 text-muted">-</span>
          <span className="text-green">{sc.a}</span>
          <span className="ml-2 text-[10px] text-[#ff5436]">{`${minute}'`}</span>
        </span>
        <Side name={away.name} flag={away.flag} locale={locale} />
      </div>

      <div className="space-y-1.5">
        {top.map((s) => (
          <div key={`${s.h}-${s.a}`} className="flex items-center gap-2.5 text-sm">
            <span className="font-head w-10 shrink-0 tabular-nums">
              {s.h}-{s.a}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-green"
                style={{ width: `${Math.max(4, (s.p / max) * 100)}%` }}
              />
            </div>
            <span className="font-head w-11 shrink-0 text-right tabular-nums text-green">
              {pct(s.p)}
            </span>
          </div>
        ))}
        {otherP > 0.005 && (
          <div className="flex items-center justify-between border-t border-border/50 pt-1.5 text-[11px] text-muted">
            <span>{c.other}</span>
            <span className="tabular-nums">{pct(otherP)}</span>
          </div>
        )}
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-muted">{c.note}</p>
    </section>
  );
}
