"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n";
import { teamName, groupName } from "@/lib/football/teams";
import { rankGroup, rankThirds, mulberry32 } from "@/lib/prob/standings";
import type { GroupResult } from "@/lib/prob/types";

// 第三名出线计算器（客户端纯计算）：点选剩余小组赛结果 → 实时重排 12 组与第三名表。
// 比分约定：主胜=1-0、平=1-1、客胜=0-1（只影响净胜球/进球的近似，页面已标注）。

export interface CalcTeam {
  id: string;
  name: string;
  zh: string;
  flag: string | null;
}
export interface CalcMatch {
  id: string;
  homeId: string;
  awayId: string;
  likely: "h" | "d" | "a";
}

const TXT: Record<
  Locale,
  {
    intro: string;
    convention: string;
    qualified: string;
    out: string;
    thirds: string;
    first: string;
    second: string;
    h: string;
    d: string;
    a: string;
    locked: string;
    myWin: string;
    myDraw: string;
    reset: string;
    viaThirds: string;
    cutoff: string;
    scenario: string;
  }
> = {
  zh: {
    intro: "点选每场剩余小组赛的结果，实时看 12 个小组排名和哪 8 个第三名晋级。",
    convention: "比分按 主胜1-0 / 平1-1 / 客胜0-1 估算净胜球；判据按 2026 官方新规（不含公平竞赛分）。",
    qualified: "出线",
    out: "出局",
    thirds: "最佳第三名排名（前 8 晋级）",
    first: "头名",
    second: "第二",
    h: "主胜",
    d: "平",
    a: "客胜",
    locked: "已完赛锁定为真实比分，仅剩余比赛可改",
    myWin: "我全胜",
    myDraw: "我全平",
    reset: "重置",
    viaThirds: "最佳第三名",
    cutoff: "↑ 前 8 晋级 · 出局 ↓",
    scenario: "按你当前选择的赛果",
  },
  en: {
    intro: "Pick each remaining group match and watch all 12 tables and the third-place race update live.",
    convention: "Scores approximated as 1-0 / 1-1 / 0-1; 2026 official tiebreakers (fair play excluded).",
    qualified: "IN",
    out: "OUT",
    thirds: "Best thirds ranking (top 8 advance)",
    first: "1st",
    second: "2nd",
    h: "Home",
    d: "Draw",
    a: "Away",
    locked: "Finished matches are locked at the real score; edit only remaining picks",
    myWin: "I win out",
    myDraw: "I draw all",
    reset: "Reset",
    viaThirds: "best third",
    cutoff: "↑ Top 8 advance · out ↓",
    scenario: "under your current picks",
  },
  es: {
    intro: "Elige el resultado de cada partido de grupo restante y mira en vivo las 12 tablas y la carrera por el mejor tercero.",
    convention: "Marcadores aproximados como 1-0 / 1-1 / 0-1; desempates oficiales 2026 (sin fair play).",
    qualified: "PASA",
    out: "FUERA",
    thirds: "Clasificación de los mejores terceros (los 8 primeros avanzan)",
    first: "1.º",
    second: "2.º",
    h: "Local",
    d: "Empate",
    a: "Visitante",
    locked: "Los partidos jugados están fijados en el marcador real; solo puedes cambiar los restantes",
    myWin: "Gano todo",
    myDraw: "Empato todo",
    reset: "Reiniciar",
    viaThirds: "mejor tercero",
    cutoff: "↑ Top 8 avanzan · fuera ↓",
    scenario: "según tus resultados elegidos",
  },
  pt: {
    intro: "Escolha o resultado de cada jogo de grupo restante e veja ao vivo as 12 tabelas e a disputa do melhor terceiro.",
    convention: "Placares aproximados como 1-0 / 1-1 / 0-1; critérios oficiais 2026 (sem fair play).",
    qualified: "PASSA",
    out: "FORA",
    thirds: "Ranking dos melhores terceiros (os 8 primeiros avançam)",
    first: "1º",
    second: "2º",
    h: "Casa",
    d: "Empate",
    a: "Fora",
    locked: "Jogos encerrados ficam fixados no placar real; edite apenas os restantes",
    myWin: "Venço tudo",
    myDraw: "Empato tudo",
    reset: "Redefinir",
    viaThirds: "melhor terceiro",
    cutoff: "↑ Top 8 avançam · fora ↓",
    scenario: "conforme seus resultados escolhidos",
  },
  de: {
    intro: "Wähle das Ergebnis jedes verbleibenden Gruppenspiels und sieh live alle 12 Tabellen und das Rennen um den besten Dritten.",
    convention: "Ergebnisse genähert als 1-0 / 1-1 / 0-1; offizielle Kriterien 2026 (ohne Fair-Play).",
    qualified: "DRIN",
    out: "RAUS",
    thirds: "Rangliste der besten Dritten (Top 8 weiter)",
    first: "1.",
    second: "2.",
    h: "Heim",
    d: "Remis",
    a: "Auswärts",
    locked: "Beendete Spiele sind auf das echte Ergebnis fixiert; nur verbleibende änderbar",
    myWin: "Ich gewinne alle",
    myDraw: "Alle unentschieden",
    reset: "Zurücksetzen",
    viaThirds: "bester Dritter",
    cutoff: "↑ Top 8 weiter · raus ↓",
    scenario: "nach deinen gewählten Ergebnissen",
  },
  fr: {
    intro: "Choisis le résultat de chaque match de groupe restant et suis en direct les 12 classements et la course au meilleur troisième.",
    convention: "Scores approximés en 1-0 / 1-1 / 0-1 ; départages officiels 2026 (sans fair-play).",
    qualified: "PASSE",
    out: "SORTI",
    thirds: "Classement des meilleurs troisièmes (les 8 premiers se qualifient)",
    first: "1er",
    second: "2e",
    h: "Domicile",
    d: "Nul",
    a: "Extérieur",
    locked: "Les matchs joués sont figés au score réel ; modifie seulement les restants",
    myWin: "Je gagne tout",
    myDraw: "Je fais nul partout",
    reset: "Réinitialiser",
    viaThirds: "meilleur troisième",
    cutoff: "↑ Top 8 qualifiés · sortis ↓",
    scenario: "selon tes résultats choisis",
  },
};

const SCORE: Record<"h" | "d" | "a", [number, number]> = { h: [1, 0], d: [1, 1], a: [0, 1] };

export function ThirdCalculator({
  locale,
  groups,
  played,
  remaining,
  rating,
  focusLetter = null,
  focusTeamId = null,
}: {
  locale: Locale;
  groups: { letter: string; teams: CalcTeam[] }[];
  played: GroupResult[];
  remaining: CalcMatch[];
  rating: Record<string, number>;
  focusLetter?: string | null;
  focusTeamId?: string | null;
}) {
  const t = TXT[locale] ?? TXT.en;
  const [picks, setPicks] = useState<Record<string, "h" | "d" | "a">>(() =>
    Object.fromEntries(remaining.map((m) => [m.id, m.likely]))
  );

  const teamById = useMemo(() => {
    const map = new Map<string, CalcTeam>();
    for (const g of groups) for (const tm of g.teams) map.set(tm.id, tm);
    return map;
  }, [groups]);

  const { tables, thirdsRanked } = useMemo(() => {
    const ratingMap = new Map(Object.entries(rating));
    const results: GroupResult[] = [
      ...played,
      ...remaining.map((m) => {
        const [h, a] = SCORE[picks[m.id] ?? m.likely];
        return { homeId: m.homeId, awayId: m.awayId, homeGoals: h, awayGoals: a };
      }),
    ];
    // 单 RNG 实例跨 rankGroup(12组)→rankThirds 连续消费，对齐服务端 pipeline 的 RNG 顺序，
    // 杜绝完全打平（含 Elo 同分）时客户端/服务端给出不同晋级结论。
    const rng = mulberry32(1);
    const tables = groups.map((g) => ({
      letter: g.letter,
      order: rankGroup(g.teams.map((x) => x.id), results, rng, ratingMap),
    }));
    const thirdRows = tables.map((x) => x.order[2]).filter(Boolean);
    const thirdsRanked = rankThirds(thirdRows, rng, ratingMap);
    return { tables, thirdsRanked };
  }, [groups, played, remaining, picks, rating]);

  const label = (tm: CalcTeam | undefined) =>
    tm ? (locale === "zh" ? tm.zh : teamName(tm.name, locale)) : "?";
  const qualified = new Set(thirdsRanked.slice(0, 8));
  const groupsWithMatches = new Set(
    remaining.map((m) => groups.find((g) => g.teams.some((x) => x.id === m.homeId))?.letter)
  );

  // 焦点队在当前所选赛果下是否出线（小组前 2 或最佳第三名前 8）。
  const focusStatus = useMemo(() => {
    if (!focusTeamId) return null;
    const grp = tables.find((x) => x.order.some((r) => r.teamId === focusTeamId));
    if (!grp) return null;
    const idx = grp.order.findIndex((r) => r.teamId === focusTeamId);
    const tm = teamById.get(focusTeamId);
    if (idx === 0) return { in: true, via: t.first, tm };
    if (idx === 1) return { in: true, via: t.second, tm };
    if (idx === 2) return { in: qualified.has(focusTeamId), via: t.viaThirds, tm };
    return { in: false, via: null, tm };
  }, [focusTeamId, tables, qualified, teamById, t]);

  // 预设：把焦点队剩余比赛一键设为全胜/全平；重置=回到模型预测。
  const setFocus = (kind: "win" | "draw") =>
    setPicks((p) => {
      const next = { ...p };
      for (const m of remaining) {
        if (m.homeId === focusTeamId) next[m.id] = kind === "win" ? "h" : "d";
        else if (m.awayId === focusTeamId) next[m.id] = kind === "win" ? "a" : "d";
      }
      return next;
    });
  const resetPicks = () => setPicks(Object.fromEntries(remaining.map((m) => [m.id, m.likely])));

  return (
    <div>
      {/* 焦点队即时判定：落地/改赛果即见"我的队出线了吗"。 */}
      {focusStatus && (
        <div
          className={`mb-3 rounded-lg border p-3 ${
            focusStatus.in ? "border-green bg-green/10" : "border-red/50 bg-red/5"
          }`}
        >
          <span className="font-head text-lg font-bold">{label(focusStatus.tm)}</span>
          <span
            className={`font-head ml-2 text-lg font-bold ${focusStatus.in ? "text-green" : "text-red"}`}
          >
            {focusStatus.in ? `✅ ${t.qualified}` : `❌ ${t.out}`}
          </span>
          {focusStatus.in && focusStatus.via && (
            <span className="ml-1 text-sm text-muted">· {focusStatus.via}</span>
          )}
          <div className="mt-0.5 text-[10px] md:text-xs text-muted">{t.scenario}</div>
        </div>
      )}

      <p className="mb-1 text-xs text-muted">{t.intro}</p>
      <p className="mb-1 text-[10px] md:text-xs text-muted">{t.convention}</p>
      <p className="mb-2 text-[10px] md:text-xs text-muted">🔒 {t.locked}</p>

      {/* 场景预设：一键试"我全胜/全平"，或重置回模型预测。 */}
      <div className="mb-4 flex flex-wrap gap-2 text-xs md:text-sm">
        {focusTeamId && (
          <>
            <button
              type="button"
              onClick={() => setFocus("win")}
              className="rounded-pill border border-green/50 px-3 py-1.5 font-semibold text-green transition hover:bg-green/10"
            >
              {t.myWin}
            </button>
            <button
              type="button"
              onClick={() => setFocus("draw")}
              className="rounded-pill border border-border px-3 py-1.5 text-muted transition hover:border-green/50"
            >
              {t.myDraw}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={resetPicks}
          className="rounded-pill border border-border px-3 py-1.5 text-muted transition hover:border-green/50"
        >
          ↺ {t.reset}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {groups
          .filter((g) => groupsWithMatches.has(g.letter))
          // 焦点组（?team= 选中的队所在组）排最前，用户落地即见自己的组
          .sort((a, b) =>
            a.letter === focusLetter ? -1 : b.letter === focusLetter ? 1 : 0
          )
          .map((g) => {
            const table = tables.find((x) => x.letter === g.letter)!.order;
            return (
              <div key={g.letter} className="rounded-lg border border-border bg-surface p-3">
                <div className="font-head mb-2 text-xs font-semibold text-muted">
                  {groupName(g.letter, locale)} ·{" "}
                  <span className="text-green">
                    {t.first} {label(teamById.get(table[0]?.teamId))} · {t.second}{" "}
                    {label(teamById.get(table[1]?.teamId))}
                  </span>
                </div>
                {played
                  .filter((m) => g.teams.some((x) => x.id === m.homeId))
                  .map((m, i) => {
                    const out: "h" | "d" | "a" =
                      m.homeGoals > m.awayGoals ? "h" : m.homeGoals < m.awayGoals ? "a" : "d";
                    return (
                      <div
                        key={`p-${m.homeId}-${m.awayId}-${i}`}
                        className="mb-1.5 flex items-center gap-2 text-xs"
                      >
                        <span className="w-20 shrink-0 truncate text-right">
                          {label(teamById.get(m.homeId))}
                        </span>
                        <div className="flex flex-1 gap-1">
                          {(["h", "d", "a"] as const).map((opt) => (
                            <div
                              key={opt}
                              title={t.locked}
                              className={`flex-1 cursor-default rounded-sm border py-1 text-center text-[11px] ${
                                out === opt
                                  ? "border-green/60 bg-green/10 font-semibold text-green"
                                  : "border-border/50 bg-surface-2/40 text-muted/40"
                              }`}
                            >
                              {out === opt ? `🔒 ${m.homeGoals}-${m.awayGoals}` : t[opt]}
                            </div>
                          ))}
                        </div>
                        <span className="w-20 shrink-0 truncate">{label(teamById.get(m.awayId))}</span>
                      </div>
                    );
                  })}
                {remaining
                  .filter((m) => g.teams.some((x) => x.id === m.homeId))
                  .map((m) => (
                    <div key={m.id} className="mb-1.5 flex items-center gap-2 text-xs">
                      <span className="w-20 shrink-0 truncate text-right">
                        {label(teamById.get(m.homeId))}
                      </span>
                      <div className="flex flex-1 gap-1.5">
                        {(["h", "d", "a"] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setPicks((p) => ({ ...p, [m.id]: opt }))}
                            className={`flex-1 rounded-sm border py-2 text-[12px] transition ${
                              (picks[m.id] ?? m.likely) === opt
                                ? "border-green bg-green/15 text-green"
                                : "border-border bg-surface-2 text-muted transition-colors hover:border-green/50"
                            }`}
                          >
                            {t[opt]}
                          </button>
                        ))}
                      </div>
                      <span className="w-20 shrink-0 truncate">{label(teamById.get(m.awayId))}</span>
                    </div>
                  ))}
              </div>
            );
          })}
      </div>

      <h2 className="font-head mb-2 mt-6 text-sm md:text-base font-semibold">{t.thirds}</h2>
      <div className="rounded-lg border border-border bg-surface p-3">
        {thirdsRanked.map((id, i) => {
          const tm = teamById.get(id);
          const inTop8 = qualified.has(id);
          return (
            <div key={id}>
              <div
                className={`flex items-center justify-between py-1 text-sm ${inTop8 ? "" : "opacity-50"}`}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="font-head w-5 text-right text-xs text-muted">{i + 1}</span>
                  {tm?.flag && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tm.flag} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
                  )}
                  <span className={inTop8 ? "font-medium" : ""}>{label(tm)}</span>
                </span>
                <span className={`font-head text-[11px] md:text-xs ${inTop8 ? "text-green" : "text-muted"}`}>
                  {inTop8 ? `✅ ${t.qualified}` : `❌ ${t.out}`}
                </span>
              </div>
              {/* 第 8/9 名出线分界线（加粗 + 标注） */}
              {i === 7 && (
                <div className="my-1 flex items-center gap-2">
                  <div className="h-px flex-1 bg-green/60" />
                  <span className="font-head text-[10px] md:text-xs font-semibold text-green">{t.cutoff}</span>
                  <div className="h-px flex-1 bg-green/60" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
