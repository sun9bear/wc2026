"use client";

import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import { track } from "@/lib/track";
import type { Locale } from "@/i18n";
import { localeHref } from "@/i18n";
import { selfUrl } from "@/lib/seo/canonical";
import { teamName } from "@/lib/football/teams";

// 计算器"先选我的队"入口 + 结论条 + 一键复制（CodeX 建议吸收版）。
// 选队走整页跳转（/calculator?team=slug）——让 generateMetadata 同步出
// 问题式标题与该队 OG 卡，分享链接在社交平台自动展开图卡。

export interface FocusTeam {
  name: string;
  zh: string;
  flag: string | null;
  letter: string;
  rank: number;
  pAdvance: number; // 0-1
  pChampion: number;
  slug: string;
}

const ORD = (r: number) => ["st", "nd", "rd"][r - 1] ?? "th";
// conclusion/share 收预解析好的本地化队名 nm（由组件按 locale 经 teamName 取），文案各语避博彩词。
interface FocusCopy {
  pick: string;
  all: string;
  copyText: string;
  copyLink: string;
  shareNow: string;
  shareImg: string;
  copied: string;
  conclusion: (nm: string, t: FocusTeam, adv: string) => string;
  share: (nm: string, adv: string, url: string) => string;
}
const TXT: Record<Locale, FocusCopy> = {
  zh: {
    pick: "选你的队：",
    all: "全部球队…",
    copyText: "📋 复制结论",
    copyLink: "🔗 复制链接",
    shareNow: "🔗 分享",
    shareImg: "🖼 分享图卡",
    copied: "已复制 ✓",
    conclusion: (nm, t, adv) => `${nm}：${t.letter} 组当前第 ${t.rank} · 模型出线概率 ${adv}%`,
    share: (nm, adv, url) => `${nm}目前出线概率 ${adv}%（万次模拟）——自己改一版剩余赛果看走势：${url}`,
  },
  en: {
    pick: "Pick your team:",
    all: "All teams…",
    copyText: "📋 Copy result",
    copyLink: "🔗 Copy link",
    shareNow: "🔗 Share",
    shareImg: "🖼 Share image",
    copied: "Copied ✓",
    conclusion: (nm, t, adv) => `${nm}: ${t.rank}${ORD(t.rank)} in Group ${t.letter} · ${adv}% chance to advance`,
    share: (nm, adv, url) => `${nm} has a ${adv}% chance to advance (10,000 sims) — flip any remaining result yourself: ${url}`,
  },
  es: {
    pick: "Elige tu equipo:",
    all: "Todos los equipos…",
    copyText: "📋 Copiar resultado",
    copyLink: "🔗 Copiar enlace",
    shareNow: "🔗 Compartir",
    shareImg: "🖼 Compartir imagen",
    copied: "Copiado ✓",
    conclusion: (nm, t, adv) => `${nm}: actualmente ${t.rank}.º del Grupo ${t.letter} · ${adv}% de probabilidad de avanzar`,
    share: (nm, adv, url) => `${nm} tiene un ${adv}% de probabilidad de avanzar (10 000 simulaciones) — cambia tú cualquier resultado restante: ${url}`,
  },
  pt: {
    pick: "Escolha seu time:",
    all: "Todos os times…",
    copyText: "📋 Copiar resultado",
    copyLink: "🔗 Copiar link",
    shareNow: "🔗 Compartilhar",
    shareImg: "🖼 Compartilhar imagem",
    copied: "Copiado ✓",
    conclusion: (nm, t, adv) => `${nm}: atualmente em ${t.rank}º no Grupo ${t.letter} · ${adv}% de chance de avançar`,
    share: (nm, adv, url) => `${nm} tem ${adv}% de chance de avançar (10.000 simulações) — mude você mesmo qualquer resultado restante: ${url}`,
  },
  de: {
    pick: "Wähle dein Team:",
    all: "Alle Teams…",
    copyText: "📋 Ergebnis kopieren",
    copyLink: "🔗 Link kopieren",
    shareNow: "🔗 Teilen",
    shareImg: "🖼 Bild teilen",
    copied: "Kopiert ✓",
    conclusion: (nm, t, adv) => `${nm}: aktuell Platz ${t.rank} in Gruppe ${t.letter} · ${adv}% Chance aufs Weiterkommen`,
    share: (nm, adv, url) => `${nm} hat ${adv}% Chance aufs Weiterkommen (10.000 Simulationen) — ändere selbst ein beliebiges Restergebnis: ${url}`,
  },
  fr: {
    pick: "Choisis ton équipe :",
    all: "Toutes les équipes…",
    copyText: "📋 Copier le résultat",
    copyLink: "🔗 Copier le lien",
    shareNow: "🔗 Partager",
    shareImg: "🖼 Partager l'image",
    copied: "Copié ✓",
    conclusion: (nm, t, adv) => `${nm} : actuellement ${t.rank}e du Groupe ${t.letter} · ${adv}% de chances de se qualifier`,
    share: (nm, adv, url) => `${nm} a ${adv}% de chances de se qualifier (10 000 simulations) — modifiez vous-même n'importe quel résultat restant : ${url}`,
  },
};

export function CalculatorFocus({
  locale,
  hot,
  all,
  focus,
}: {
  locale: Locale;
  hot: { name: string; zh: string; slug: string; flag: string | null }[];
  all: { name: string; zh: string; slug: string; flag: string | null }[];
  focus: FocusTeam | null;
}) {
  const t = TXT[locale] ?? TXT.en;
  const [done, setDone] = useState<"text" | "link" | null>(null);
  const label = (x: { name: string; zh: string }) => (locale === "zh" ? x.zh : teamName(x.name, locale));

  const adv = focus ? ((focus.pAdvance > 1 ? focus.pAdvance : focus.pAdvance * 100)).toFixed(0) : "";
  const url = focus ? selfUrl(`/calculator?team=${focus.slug}`, locale) : "";

  function doCopy(kind: "text" | "link") {
    if (!focus) return;
    const ok = copyText(kind === "link" ? url : t.share(label(focus), adv, url));
    if (ok) {
      track("calculator_share_copy", { kind, team: focus.slug });
      setDone(kind);
      setTimeout(() => setDone(null), 1600);
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
        <span className="shrink-0 text-xs text-muted">{t.pick}</span>
        {hot.map((x) => (
          <a
            key={x.slug}
            href={localeHref(locale, `/calculator?team=${x.slug}`)}
            onClick={() => track("calculator_team_selected", { team: x.slug, via: "chip" })}
            className={`flex shrink-0 items-center gap-1.5 rounded-pill border px-3 py-1.5 text-sm font-medium transition ${
              focus?.slug === x.slug
                ? "border-green bg-green/15 text-green"
                : "border-border bg-surface-2 hover:border-green/60"
            }`}
          >
            {x.flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={x.flag} alt="" className="h-4 w-6 shrink-0 rounded-[2px] object-cover ring-1 ring-black/20" />
            )}
            {label(x)}
          </a>
        ))}
        <select
          className="shrink-0 rounded-pill border border-border bg-surface-2 px-3 py-1.5 text-sm text-muted"
          value={focus && !hot.some((x) => x.slug === focus.slug) ? focus.slug : ""}
          onChange={(e) => {
            if (e.target.value) {
              track("calculator_team_selected", { team: e.target.value, via: "select" });
              window.location.href = localeHref(locale, `/calculator?team=${e.target.value}`);
            }
          }}
        >
          <option value="">{t.all}</option>
          {all.map((x) => (
            <option key={x.slug} value={x.slug}>
              {label(x)}
            </option>
          ))}
        </select>
      </div>

      {focus && (
        <div className="mt-3 rounded-lg border border-green/40 bg-surface p-3">
          <div className="flex items-center gap-2 text-sm">
            {focus.flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={focus.flag} alt="" className="h-4 w-6 rounded-[2px] object-cover" />
            )}
            <span className="font-medium">{t.conclusion(label(focus), focus, adv)}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs md:text-sm">
            <button
              type="button"
              onClick={() => doCopy("text")}
              className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-muted transition hover:border-green hover:text-green"
            >
              {done === "text" ? t.copied : t.copyText}
            </button>
            <button
              type="button"
              onClick={() => doCopy("link")}
              className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-muted transition hover:border-green hover:text-green"
            >
              {done === "link" ? t.copied : t.copyLink}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
