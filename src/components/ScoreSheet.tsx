"use client";

import { teamName } from "@/lib/football/teams";
import type { Locale } from "@/i18n";
import { clampGoal, type Pick } from "@/lib/prob/calcResults";

// 比分编辑底部弹层（受控、纯展示）：步进器 + 「模型最可能」芯片(topScores) + 常见比分。
// 合规：只用「模型最可能 / Most likely (model)」「常见比分 / Common scores」，绝不出现
// 正确比分 / correct score / 赔率 / odds 等字眼（沿用 ScoreProbs 口径）。

const COMMON: Pick[] = [
  [1, 0],
  [2, 0],
  [2, 1],
  [1, 1],
  [0, 0],
  [0, 1],
];

const TXT: Record<Locale, { title: string; suggested: string; common: string; reset: string; done: string }> = {
  zh: { title: "设置比分", suggested: "模型最可能", common: "常见比分", reset: "重置本场", done: "完成" },
  en: { title: "Set the score", suggested: "Most likely (model)", common: "Common scores", reset: "Reset match", done: "Done" },
  es: { title: "Marcador", suggested: "Más probable (modelo)", common: "Marcadores comunes", reset: "Reiniciar partido", done: "Listo" },
  pt: { title: "Definir placar", suggested: "Mais provável (modelo)", common: "Placares comuns", reset: "Redefinir jogo", done: "Concluir" },
  de: { title: "Ergebnis festlegen", suggested: "Wahrscheinlichstes (Modell)", common: "Häufige Ergebnisse", reset: "Spiel zurücksetzen", done: "Fertig" },
  fr: { title: "Définir le score", suggested: "Plus probable (modèle)", common: "Scores fréquents", reset: "Réinitialiser le match", done: "OK" },
};

const pct = (p: number) => (p * 100).toFixed(p < 0.1 ? 1 : 0) + "%";

function TeamSide({
  name,
  zh,
  flag,
  locale,
  align,
}: {
  name: string;
  zh: string;
  flag: string | null;
  locale: Locale;
  align: "left" | "right";
}) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${align === "right" ? "flex-row-reverse" : ""}`}>
      {flag && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flag} alt="" className="h-3 w-4 shrink-0 rounded-[2px] object-cover" />
      )}
      <span className="truncate">{locale === "zh" ? zh : teamName(name, locale)}</span>
    </span>
  );
}

function Stepper({ goals, onSet }: { goals: number; onSet: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="-"
        onClick={() => onSet(clampGoal(goals - 1))}
        className="h-9 w-9 rounded-md border border-border bg-surface-2 text-lg font-bold text-muted transition hover:border-green/50"
      >
        −
      </button>
      <span className="font-head w-7 text-center text-2xl font-bold tabular-nums">{goals}</span>
      <button
        type="button"
        aria-label="+"
        onClick={() => onSet(clampGoal(goals + 1))}
        className="h-9 w-9 rounded-md border border-border bg-surface-2 text-lg font-bold text-green transition hover:border-green/50"
      >
        +
      </button>
    </div>
  );
}

export function ScoreSheet({
  locale,
  home,
  away,
  value,
  suggestions,
  onChange,
  onReset,
  onClose,
}: {
  locale: Locale;
  home: { name: string; zh: string; flag: string | null };
  away: { name: string; zh: string; flag: string | null };
  value: Pick;
  suggestions: { h: number; a: number; p: number }[];
  onChange: (v: Pick) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const t = TXT[locale] ?? TXT.en;
  const [h, a] = value;
  const eq = (x: number, y: number) => x === h && y === a;
  const top = suggestions.slice(0, 3);

  return (
    <>
      {/* 背景遮罩，点击关闭 */}
      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-50 px-3 pb-4 md:bottom-6"
      >
        <div className="mx-auto w-full max-w-xl rounded-lg border border-green/40 bg-surface p-4 shadow-glow">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-head text-sm font-semibold">{t.title}</span>
            <button type="button" onClick={onClose} className="text-xs text-muted">
              ✕
            </button>
          </div>

          {/* 队名朝向锚点 + 步进器（左=主队，右=客队） */}
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
            <TeamSide {...home} locale={locale} align="left" />
            <TeamSide {...away} locale={locale} align="right" />
          </div>
          <div className="mb-4 flex items-center justify-center gap-4">
            <Stepper goals={h} onSet={(n) => onChange([n, a])} />
            <span className="font-head text-xl font-bold text-muted">:</span>
            <Stepper goals={a} onSet={(n) => onChange([h, n])} />
          </div>

          {/* 模型最可能比分（topScores 前 3，合规措辞） */}
          {top.length > 0 && (
            <div className="mb-3">
              <div className="mb-1.5 text-[11px] text-muted">📊 {t.suggested}</div>
              <div className="flex flex-wrap gap-2">
                {top.map((s) => {
                  const on = eq(s.h, s.a);
                  return (
                    <button
                      key={`${s.h}-${s.a}`}
                      type="button"
                      onClick={() => onChange([s.h, s.a])}
                      className={`rounded-pill border px-3 py-1.5 text-xs transition ${
                        on
                          ? "border-green bg-green/15 text-green"
                          : "border-border bg-surface-2 text-muted hover:border-green/50"
                      }`}
                    >
                      <span className="font-head tabular-nums">
                        {s.h}-{s.a}
                      </span>
                      <span className="ml-1.5 tabular-nums opacity-70">{pct(s.p)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 常见比分 */}
          <div className="mb-4">
            <div className="mb-1.5 text-[11px] text-muted">{t.common}</div>
            <div className="flex flex-wrap gap-2">
              {COMMON.map(([ch, ca]) => {
                const on = eq(ch, ca);
                return (
                  <button
                    key={`${ch}-${ca}`}
                    type="button"
                    onClick={() => onChange([ch, ca])}
                    className={`rounded-pill border px-3 py-1.5 text-xs font-head tabular-nums transition ${
                      on
                        ? "border-green bg-green/15 text-green"
                        : "border-border bg-surface-2 text-muted hover:border-green/50"
                    }`}
                  >
                    {ch}-{ca}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-green px-4 py-1.5 font-bold text-[#06231a]"
            >
              {t.done}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-muted transition hover:border-green/50"
            >
              ↺ {t.reset}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
