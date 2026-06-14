"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/Skeleton";
import { HeaderShare } from "@/components/HeaderShare";
import { LocalTime } from "@/components/LocalTime";
import { MY_TEAM_KEY, MY_TEAM_EVENT } from "@/components/SetMyTeamButton";
import type { Locale } from "@/i18n";
import { localeHref } from "@/i18n";
import { teamName } from "@/lib/football/teams";

// 「我的主队」卡（任务 C）：读 localStorage my_team → /api/team/[slug] → 出线/夺冠/评分 + 下一场 + 分享图。
// 主队由球队详情页的「设为主队」按钮设定；本卡随 my-team-changed 事件刷新。

const SITE = "https://www.wc2026.cool";
const fmtP = (x: number) => {
  const v = x > 1 ? x : x * 100;
  return v >= 10 ? v.toFixed(0) : v.toFixed(1);
};

interface TeamSummary {
  slug: string;
  name: string;
  zh: string;
  flag: string | null;
  letter: string;
  rank: number;
  pAdvance: number;
  pChampion: number;
  rating: number;
  next: {
    matchId: string;
    kickoff: string;
    oppName: string;
    oppZh: string;
    oppFlag: string | null;
    home: boolean;
  } | null;
}

export function MyTeamCard({ locale }: { locale: Locale }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [d, setD] = useState<TeamSummary | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "none">("loading");

  useEffect(() => {
    const read = () => {
      try {
        setSlug(localStorage.getItem(MY_TEAM_KEY));
      } catch {
        setSlug(null);
      }
    };
    read();
    window.addEventListener(MY_TEAM_EVENT, read);
    return () => window.removeEventListener(MY_TEAM_EVENT, read);
  }, []);

  useEffect(() => {
    let alive = true;
    if (!slug) {
      setD(null);
      setState("none");
      return;
    }
    setState("loading");
    fetch(`/api/team/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: TeamSummary | { error: string } | null) => {
        if (!alive) return;
        if (j && !("error" in j)) {
          setD(j);
          setState("ready");
        } else {
          setState("none");
        }
      })
      .catch(() => alive && setState("none"));
    return () => {
      alive = false;
    };
  }, [slug]);

  const C: Record<
    Locale,
    {
      title: string;
      advance: string;
      champion: string;
      rating: string;
      detail: string;
      empty: string;
      next: string;
      shareText: (nm: string, adv: string) => string;
      tag: (nm: string) => string;
    }
  > = {
    zh: {
      title: "⭐ 我的主队",
      advance: "出线",
      champion: "夺冠",
      rating: "评分",
      detail: "详情 →",
      empty: "⭐ 点任意球队的国旗/队名进详情页「设为主队」，这里看 TA 的出线/夺冠概率",
      next: "下一场 vs",
      shareText: (nm: string, adv: string) => `${nm}是我的主队 · 出线概率 ${adv}%（2026 世界杯模型）`,
      tag: (nm: string) => `${nm}的主队`,
    },
    en: {
      title: "⭐ My team",
      advance: "Advance",
      champion: "Title",
      rating: "Rating",
      detail: "Details →",
      empty: "⭐ Tap any team's flag/name to open its page and set it as your team — chances show up here",
      next: "Next vs",
      shareText: (nm: string, adv: string) => `${nm} is my team · ${adv}% to advance (World Cup 2026 model)`,
      tag: (nm: string) => `${nm}'s team`,
    },
    es: {
      title: "⭐ Mi equipo",
      advance: "Avanzar",
      champion: "Título",
      rating: "Valoración",
      detail: "Detalles →",
      empty: "⭐ Toca la bandera/nombre de cualquier equipo para abrir su página y marcarlo como tuyo — las probabilidades aparecen aquí",
      next: "Próximo vs",
      shareText: (nm: string, adv: string) => `${nm} es mi equipo · ${adv}% de avanzar (modelo Mundial 2026)`,
      tag: (nm: string) => `Equipo de ${nm}`,
    },
    pt: {
      title: "⭐ Meu time",
      advance: "Avançar",
      champion: "Título",
      rating: "Nota",
      detail: "Detalhes →",
      empty: "⭐ Toque na bandeira/nome de qualquer time para abrir a página e defini-lo como seu — as chances aparecem aqui",
      next: "Próximo vs",
      shareText: (nm: string, adv: string) => `${nm} é o meu time · ${adv}% de avançar (modelo Copa 2026)`,
      tag: (nm: string) => `Time de ${nm}`,
    },
    de: {
      title: "⭐ Mein Team",
      advance: "Weiter",
      champion: "Titel",
      rating: "Bewertung",
      detail: "Details →",
      empty: "⭐ Tippe auf Flagge/Name eines Teams, um seine Seite zu öffnen und es als deins festzulegen — die Chancen erscheinen hier",
      next: "Nächstes vs",
      shareText: (nm: string, adv: string) => `${nm} ist mein Team · ${adv}% aufs Weiterkommen (WM-2026-Modell)`,
      tag: (nm: string) => `${nm}-Team`,
    },
    fr: {
      title: "⭐ Mon équipe",
      advance: "Qualif.",
      champion: "Titre",
      rating: "Note",
      detail: "Détails →",
      empty: "⭐ Touchez le drapeau/nom d'une équipe pour ouvrir sa page et la définir comme la vôtre — les probabilités s'affichent ici",
      next: "Prochain vs",
      shareText: (nm: string, adv: string) => `${nm} est mon équipe · ${adv}% de qualification (modèle Coupe du monde 2026)`,
      tag: (nm: string) => `Équipe de ${nm}`,
    },
  };
  const c = C[locale] ?? C.en;

  if (state === "none") {
    return (
      <Link
        href={localeHref(locale, "/forecast")}
        className="mt-3 block rounded-lg border border-dashed border-border bg-surface-2 px-4 py-3 text-xs text-muted transition hover:border-green/50 hover:text-green"
      >
        {c.empty}
      </Link>
    );
  }

  if (state === "loading" || !d) {
    return <Skeleton className="mt-3 h-28 w-full" />;
  }

  const nm = locale === "zh" ? d.zh : teamName(d.name, locale);
  const adv = fmtP(d.pAdvance);
  const champ = fmtP(d.pChampion);
  const nextOpp = d.next ? (locale === "zh" ? d.next.oppZh : teamName(d.next.oppName, locale)) : "";
  const ogUrl =
    `${SITE}/api/og?team=${d.slug}&locale=${locale}` +
    `&tag=${encodeURIComponent(c.tag(nm))}&u=${encodeURIComponent(`/team/${d.slug}`)}`;

  return (
    <div className="mt-3 rounded-lg border border-green/40 bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] text-muted">{c.title}</span>
        <HeaderShare
          locale={locale}
          shareUrl={`${SITE}/team/${d.slug}`}
          text={c.shareText(nm, adv)}
          ogUrl={ogUrl}
          source="my_team"
        />
      </div>

      <Link href={localeHref(locale, `/team/${d.slug}`)} className="flex items-center gap-3 transition hover:opacity-80">
        {d.flag ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.flag} alt="" className="h-8 w-11 rounded-sm object-cover ring-1 ring-border" />
        ) : (
          <span className="text-3xl">⚽</span>
        )}
        <div className="flex-1">
          <div className="font-head text-lg font-bold">{nm}</div>
          <div className="text-[11px] text-green">{c.detail}</div>
        </div>
      </Link>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md border border-border bg-surface-2 py-2">
          <div className="font-head text-xl font-bold text-green">{adv}%</div>
          <div className="text-[10px] text-muted">{c.advance}</div>
        </div>
        <div className="rounded-md border border-border bg-surface-2 py-2">
          <div className="font-head text-xl font-bold text-gold">{champ}%</div>
          <div className="text-[10px] text-muted">{c.champion}</div>
        </div>
        <div className="rounded-md border border-border bg-surface-2 py-2">
          <div className="font-head text-xl font-bold">{d.rating}</div>
          <div className="text-[10px] text-muted">{c.rating}</div>
        </div>
      </div>

      {d.next && (
        <Link
          href={localeHref(locale, `/match/${d.next.matchId}`)}
          className="mt-3 flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-xs transition hover:border-green/50"
        >
          <span className="flex items-center gap-1.5 text-muted">
            {c.next}
            {d.next.oppFlag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.next.oppFlag} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
            )}
            <span className="text-text">{nextOpp}</span>
          </span>
          <LocalTime iso={d.next.kickoff} locale={locale} mode="datetime" />
        </Link>
      )}
    </div>
  );
}
