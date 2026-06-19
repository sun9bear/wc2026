"use client";

// 进行中比赛的实时最终比分预测（客户端 ~30s 轮询 /api/live）。
// 实时命中 → 显示实时比分+分钟+最终比分概率；未命中 → 回退赛前分布（ScoreProbs）。
// 合规：标题「实时最终比分预测 / Live final-score forecast」，概率条，零博彩词。

import { useEffect, useRef, useState } from "react";
import { ScoreProbs } from "@/components/ScoreProbs";
import type { Locale } from "@/i18n";
import type { MatchScoreline } from "@/lib/prob/getMatchScoreline";
import type { LiveEvent } from "@/lib/prob/getLiveEvents";
import type { TeamStat } from "@/lib/prob/getMatchStats";

interface LiveResp {
  live: boolean;
  score?: { h: number; a: number };
  minute?: number;
  short?: string;
  top?: { h: number; a: number; p: number }[];
  p?: { home: number; draw: number; away: number };
  events?: LiveEvent[];
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

// 直播看板文案（进球文字流 + 可展开技术统计）。与上方 COPY 分开，避免改动既有块。
type BoardCopy = {
  feed: string; og: string; pen: string;
  stats: string; statsShow: string; statsHide: string; statsLoading: string; statsNA: string;
  possession: string; shots: string; shotsOn: string; corners: string; fouls: string; offsides: string;
};
const BOARD_COPY: Record<Locale, BoardCopy> = {
  zh: { feed: "比赛进程", og: "乌龙", pen: "点球", stats: "技术统计", statsShow: "展开技术统计", statsHide: "收起", statsLoading: "加载中…", statsNA: "技术统计暂不可用", possession: "控球率", shots: "射门", shotsOn: "射正", corners: "角球", fouls: "犯规", offsides: "越位" },
  en: { feed: "Match feed", og: "OG", pen: "PEN", stats: "Match stats", statsShow: "Show match stats", statsHide: "Hide", statsLoading: "Loading…", statsNA: "Match stats unavailable", possession: "Possession", shots: "Shots", shotsOn: "On target", corners: "Corners", fouls: "Fouls", offsides: "Offsides" },
  es: { feed: "Desarrollo", og: "e.p.", pen: "penal", stats: "Estadísticas", statsShow: "Ver estadísticas", statsHide: "Ocultar", statsLoading: "Cargando…", statsNA: "Estadísticas no disponibles", possession: "Posesión", shots: "Tiros", shotsOn: "A puerta", corners: "Córners", fouls: "Faltas", offsides: "Fueras de juego" },
  pt: { feed: "Lances", og: "contra", pen: "pênalti", stats: "Estatísticas", statsShow: "Ver estatísticas", statsHide: "Ocultar", statsLoading: "Carregando…", statsNA: "Estatísticas indisponíveis", possession: "Posse", shots: "Finalizações", shotsOn: "No alvo", corners: "Escanteios", fouls: "Faltas", offsides: "Impedimentos" },
  de: { feed: "Spielverlauf", og: "ET", pen: "Elfm.", stats: "Statistiken", statsShow: "Statistiken zeigen", statsHide: "Ausblenden", statsLoading: "Lädt…", statsNA: "Statistiken nicht verfügbar", possession: "Ballbesitz", shots: "Schüsse", shotsOn: "aufs Tor", corners: "Ecken", fouls: "Fouls", offsides: "Abseits" },
  fr: { feed: "Déroulé", og: "c.s.c.", pen: "penalty", stats: "Statistiques", statsShow: "Voir les statistiques", statsHide: "Masquer", statsLoading: "Chargement…", statsNA: "Statistiques indisponibles", possession: "Possession", shots: "Tirs", shotsOn: "Cadrés", corners: "Corners", fouls: "Fautes", offsides: "Hors-jeu" },
};

// 单条进球流事件：主队靠左、客队靠右镜像（像真·文字直播两侧）。
function EventRow({ e, bc }: { e: LiveEvent; bc: BoardCopy }) {
  const icon = e.type === "goal" ? "⚽" : e.type === "card" ? (e.detail === "RED" ? "🟥" : "🟨") : "🔁";
  const min = `${e.minute}${e.injuryTime ? "+" + e.injuryTime : ""}'`;
  const tag = e.type === "goal" && e.detail === "OWN" ? ` (${bc.og})` : e.type === "goal" && e.detail === "PENALTY" ? ` (${bc.pen})` : "";
  const text =
    e.type === "sub"
      ? `${e.primary} → ${e.secondary ?? ""}`
      : `${e.primary}${e.type === "goal" && e.secondary ? ` · ${e.secondary}` : ""}${tag}`;
  const isHome = e.side === "home";
  return (
    <div className={`flex items-baseline gap-1.5 text-[11px] md:text-xs ${isHome ? "" : "flex-row-reverse text-right"}`}>
      <span className="w-7 shrink-0 tabular-nums text-muted">{min}</span>
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 truncate">{text}</span>
    </div>
  );
}

function pctNum(v: string | null): number {
  if (!v) return 0;
  const n = Number(String(v).replace("%", "").trim());
  return Number.isFinite(n) ? n : 0;
}

// 一行技术统计：主值 | 标签 | 客值 + 占比条（按数值归一）。
function StatRow({ label, hDisp, aDisp, hNum, aNum }: { label: string; hDisp: string; aDisp: string; hNum: number; aNum: number }) {
  const tot = hNum + aNum;
  const hp = tot > 0 ? (hNum / tot) * 100 : 50;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] md:text-xs">
        <span className="font-head w-12 tabular-nums">{hDisp}</span>
        <span className="text-muted">{label}</span>
        <span className="font-head w-12 text-right tabular-nums">{aDisp}</span>
      </div>
      <div className="mt-0.5 flex h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="bg-green" style={{ width: `${hp}%` }} />
        <div className="bg-white/20" style={{ width: `${100 - hp}%` }} />
      </div>
    </div>
  );
}

// 可展开技术统计（懒加载：点开才拉 /api/match-stats；拉不到则隐藏内容）。
function StatsPanel({ matchId, bc }: { matchId: string; bc: BoardCopy }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "loaded" | "empty">("idle");
  const [stats, setStats] = useState<{ home: TeamStat; away: TeamStat } | null>(null);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (state !== "idle") return;
    setState("loading");
    try {
      const r = await fetch(`/api/match-stats?id=${matchId}`, { cache: "no-store" });
      const j = (await r.json()) as { stats: { home: TeamStat; away: TeamStat } | null };
      if (j.stats) {
        setStats(j.stats);
        setState("loaded");
      } else {
        setState("empty");
      }
    } catch {
      setState("empty");
    }
  };

  const num = (v: number | null) => (v == null ? "–" : String(v));
  return (
    <div className="mt-3 border-t border-border/50 pt-2">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between text-[11px] md:text-xs text-muted transition-colors hover:text-text"
      >
        <span>📊 {bc.stats}</span>
        <span>{open ? `▾ ${bc.statsHide}` : `▸ ${bc.statsShow}`}</span>
      </button>
      {open && state === "loading" && (
        <p className="mt-2 text-center text-[11px] md:text-xs text-muted">{bc.statsLoading}</p>
      )}
      {open && state === "empty" && (
        <p className="mt-2 text-center text-[11px] md:text-xs text-muted">{bc.statsNA}</p>
      )}
      {open && state === "loaded" && stats && (
        <div className="mt-2 space-y-2">
          {(stats.home.possession || stats.away.possession) && (
            <StatRow label={bc.possession} hDisp={stats.home.possession ?? "–"} aDisp={stats.away.possession ?? "–"} hNum={pctNum(stats.home.possession)} aNum={pctNum(stats.away.possession)} />
          )}
          {(stats.home.shots != null || stats.away.shots != null) && (
            <StatRow label={bc.shots} hDisp={num(stats.home.shots)} aDisp={num(stats.away.shots)} hNum={stats.home.shots ?? 0} aNum={stats.away.shots ?? 0} />
          )}
          {(stats.home.shotsOn != null || stats.away.shotsOn != null) && (
            <StatRow label={bc.shotsOn} hDisp={num(stats.home.shotsOn)} aDisp={num(stats.away.shotsOn)} hNum={stats.home.shotsOn ?? 0} aNum={stats.away.shotsOn ?? 0} />
          )}
          {(stats.home.corners != null || stats.away.corners != null) && (
            <StatRow label={bc.corners} hDisp={num(stats.home.corners)} aDisp={num(stats.away.corners)} hNum={stats.home.corners ?? 0} aNum={stats.away.corners ?? 0} />
          )}
          {(stats.home.fouls != null || stats.away.fouls != null) && (
            <StatRow label={bc.fouls} hDisp={num(stats.home.fouls)} aDisp={num(stats.away.fouls)} hNum={stats.home.fouls ?? 0} aNum={stats.away.fouls ?? 0} />
          )}
          {(stats.home.offsides != null || stats.away.offsides != null) && (
            <StatRow label={bc.offsides} hDisp={num(stats.home.offsides)} aDisp={num(stats.away.offsides)} hNum={stats.home.offsides ?? 0} aNum={stats.away.offsides ?? 0} />
          )}
        </div>
      )}
    </div>
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
  const bc = BOARD_COPY[locale] ?? BOARD_COPY.en;
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
          <p className="mb-2 text-[11px] md:text-xs text-muted">⏱ {c.pre}</p>
          <ScoreProbs data={fallback} locale={locale} home={home} away={away} />
        </div>
      );
    }
    return (
      <p className="fade-up mt-5 rounded-lg border border-border bg-surface p-4 text-center text-sm md:text-base text-muted">
        {c.nodata}
      </p>
    );
  }

  const top = data.top;
  const sum = top.reduce((s, x) => s + x.p, 0);
  const otherP = Math.min(1, Math.max(0, 1 - sum));
  const max = top[0]?.p ?? 1;
  const pct = (p: number) => (p * 100).toFixed(p < 0.1 ? 1 : 0) + "%";

  return (
    <section className="fade-up mt-5 rounded-lg border border-[#ff5436]/40 bg-surface p-4">
      <div className="mb-0.5 flex items-baseline justify-between">
        <h2 className="font-head flex items-center gap-2 text-sm md:text-base font-semibold">
          <span className="live-dot" /> {c.title}
        </h2>
        <span className="text-[10px] md:text-xs text-muted">{c.sub}</span>
      </div>

      {/* 进球文字流（进球/红黄牌/换人，全部列出，最近在上，主左客右镜像）。无事件则不渲染。
          比分+分钟已放大显示在页眉，看板内不再重复国旗/队名/比分。 */}
      {data.events && data.events.length > 0 && (
        <div className="mb-3 mt-3 space-y-1 rounded-md bg-surface-2/40 p-2">
          <div className="mb-1 text-[10px] md:text-xs text-muted">{bc.feed}</div>
          {data.events
            .slice()
            .reverse()
            .map((e, i) => (
              <EventRow key={`${e.type}-${e.minute}-${e.primary}-${i}`} e={e} bc={bc} />
            ))}
        </div>
      )}

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
          <div className="flex items-center justify-between border-t border-border/50 pt-1.5 text-[11px] md:text-xs text-muted">
            <span>{c.other}</span>
            <span className="tabular-nums">{pct(otherP)}</span>
          </div>
        )}
      </div>

      <p className="mt-3 text-[10px] md:text-xs leading-relaxed text-muted">{c.note}</p>

      <StatsPanel matchId={matchId} bc={bc} />
    </section>
  );
}
