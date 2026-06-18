import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "@/i18n/server";
import { getTeamDetail, type TeamResult } from "@/lib/prob/getTeamDetail";
import { getSettledIndex } from "@/lib/seo/freshness";
import { JsonLd } from "@/lib/seo/jsonLd";
import { PageContainer } from "@/components/PageContainer";
import { HeaderShare } from "@/components/HeaderShare";
import { SetMyTeamButton } from "@/components/SetMyTeamButton";
import { LocalTime } from "@/components/LocalTime";
import { Disclaimer } from "@/components/Disclaimer";
import { localeHref, type Locale, BCP47_LOCALE } from "@/i18n";
import { teamName } from "@/lib/football/teams";
import { localizedAlternates, selfUrl } from "@/lib/seo/canonical";

export const maxDuration = 60;

const SITE = "https://www.wc2026.cool";

// 球队详情着陆页（任务 B）：出线/夺冠概率 + 模型实力评分(Elo) + 最近战绩 + 下一场 + 设为主队。
// 48 队 = 48 个 SEO 着陆页（进 sitemap）。实力评分对外只标「模型实力评分」，不写官方排名/身价（版权结论）。

const fmtP = (x: number) => {
  const v = x > 1 ? x : x * 100;
  return v >= 10 ? v.toFixed(0) : v.toFixed(1);
};

const COPY = {
  zh: {
    back: "← 返回",
    title: (nm: string) => `${nm}还能出线吗？出线 & 夺冠概率 · 2026 世界杯`,
    desc: (nm: string, adv: string, champ: string) =>
      `${nm}在 2026 世界杯的实时出线概率 ${adv}%、夺冠概率 ${champ}%（万次蒙特卡洛模拟），含模型实力评分、最近战绩与下一场。免费、无需注册。`,
    advance: "出线概率",
    champion: "夺冠概率",
    rating: "模型实力评分",
    ratingNote: "实力评分 = 模型用的 Elo 评分（概率输入因子之一），非官方排名。",
    group: (x: string, r: number) => `${x} 组 · 当前第 ${r}`,
    recent: "最近战绩",
    noRecent: "暂无已完成的比赛",
    next: "下一场",
    noNext: "暂无后续赛程",
    home: "主",
    away: "客",
    W: "胜",
    D: "平",
    L: "负",
    calc: (nm: string) => `🧮 ${nm}还能怎样出线？打开计算器 →`,
    sims: "万次蒙特卡洛模拟（公开预测数据 + Elo 融合），每小时更新",
    latest: "最新赛果",
    lead: (nm: string, adv: string, champ: string, x: string) =>
      `2026 世界杯：${nm} 从 ${x} 组出线概率 ${adv}%、夺冠概率 ${champ}%（万次蒙特卡洛模拟）。`,
    shareText: (nm: string, adv: string) => `${nm} 出线概率 ${adv}%（2026 世界杯模型）`,
  },
  en: {
    back: "← Back",
    title: (nm: string) => `Can ${nm} still advance? · World Cup 2026`,
    desc: (nm: string, adv: string, champ: string) =>
      `${nm}'s live World Cup 2026 chance to advance ${adv}% and to win ${champ}% (10,000 Monte Carlo sims), with model strength rating, recent form and next match. Free, no sign-up.`,
    advance: "Chance to advance",
    champion: "Title chance",
    rating: "Model strength rating",
    ratingNote: "Strength rating = the Elo rating the model uses (one input to its probabilities), not an official ranking.",
    group: (x: string, r: number) => `Group ${x} · currently ${r}${["st", "nd", "rd"][r - 1] ?? "th"}`,
    recent: "Recent form",
    noRecent: "No completed matches yet",
    next: "Next match",
    noNext: "No upcoming fixtures",
    home: "H",
    away: "A",
    W: "W",
    D: "D",
    L: "L",
    calc: (nm: string) => `🧮 How can ${nm} still advance? Open the calculator →`,
    sims: "10,000 Monte Carlo simulations (public forecasting data + Elo), refreshed hourly",
    latest: "Latest result",
    lead: (nm: string, adv: string, champ: string, x: string) =>
      `At the 2026 World Cup, ${nm} has a ${adv}% chance to advance from Group ${x} and a ${champ}% chance to win the title, per a 10,000-run simulation.`,
    shareText: (nm: string, adv: string) => `${nm} has a ${adv}% chance to advance (World Cup 2026 model)`,
  },
  // P2-2 staged：es/pt/de/fr 暂不被渲染（locale 仍 zh|en），激活加宽 Locale 后 COPY[locale] 自动启用。
  // 注：ResultChip 的 locale 形参仍是 "zh"|"en"（A0 加宽项），队名 nm/oppName、"看X组/规则"链接、JsonLd 仍 locale 三元（A4），激活前 es/pt/de/fr 先回退英文分支（队名显英文名）。
  es: {
    back: "← Atrás",
    title: (nm: string) => `¿${nm} todavía puede clasificar? Probabilidad de avanzar y de título · Mundial 2026`,
    desc: (nm: string, adv: string, champ: string) =>
      `Probabilidad en vivo de ${nm} en el Mundial 2026: ${adv}% de avanzar y ${champ}% de ganar el título (10.000 simulaciones de Montecarlo), con valoración de fuerza del modelo, forma reciente y próximo partido. Gratis, sin registro.`,
    advance: "Probabilidad de avanzar",
    champion: "Probabilidad de título",
    rating: "Valoración de fuerza del modelo",
    ratingNote: "Valoración de fuerza = la puntuación Elo que usa el modelo (uno de los factores de sus probabilidades), no un ranking oficial.",
    group: (x: string, r: number) => `Grupo ${x} · actualmente ${r}.º`,
    recent: "Forma reciente",
    noRecent: "Aún no hay partidos disputados",
    next: "Próximo partido",
    noNext: "No hay próximos partidos",
    home: "C",
    away: "F",
    W: "V",
    D: "E",
    L: "D",
    calc: (nm: string) => `🧮 ¿Cómo puede ${nm} todavía clasificar? Abre la calculadora →`,
    sims: "10.000 simulaciones de Montecarlo (datos públicos de predicción + Elo), actualizadas cada hora",
    latest: "Último resultado",
    lead: (nm: string, adv: string, champ: string, x: string) =>
      `Mundial 2026: ${nm} tiene un ${adv}% de probabilidad de avanzar desde el Grupo ${x} y un ${champ}% de ganar el título (10.000 simulaciones de Montecarlo).`,
    shareText: (nm: string, adv: string) => `${nm} tiene un ${adv}% de probabilidad de avanzar (modelo Mundial 2026)`,
  },
  pt: {
    back: "← Voltar",
    title: (nm: string) => `${nm} ainda pode se classificar? Probabilidade de avanço e de título · Copa 2026`,
    desc: (nm: string, adv: string, champ: string) =>
      `Probabilidade ao vivo de ${nm} na Copa 2026: ${adv}% de avançar e ${champ}% de ganhar o título (10.000 simulações de Monte Carlo), com avaliação de força do modelo, desempenho recente e próximo jogo. Grátis, sem cadastro.`,
    advance: "Chance de avançar",
    champion: "Chance de título",
    rating: "Avaliação de força do modelo",
    ratingNote: "Avaliação de força = a pontuação Elo que o modelo usa (um dos fatores das suas probabilidades), não um ranking oficial.",
    group: (x: string, r: number) => `Grupo ${x} · atualmente ${r}.º`,
    recent: "Desempenho recente",
    noRecent: "Ainda não há jogos disputados",
    next: "Próximo jogo",
    noNext: "Sem próximos jogos",
    home: "C",
    away: "F",
    W: "V",
    D: "E",
    L: "D",
    calc: (nm: string) => `🧮 Como ${nm} ainda pode se classificar? Abra a calculadora →`,
    sims: "10.000 simulações de Monte Carlo (dados públicos de previsão + Elo), atualizadas a cada hora",
    latest: "Último resultado",
    lead: (nm: string, adv: string, champ: string, x: string) =>
      `Copa 2026: ${nm} tem ${adv}% de chance de avançar do Grupo ${x} e ${champ}% de ganhar o título (10.000 simulações de Monte Carlo).`,
    shareText: (nm: string, adv: string) => `${nm} tem ${adv}% de chance de avançar (modelo Copa 2026)`,
  },
  de: {
    back: "← Zurück",
    title: (nm: string) => `Kann ${nm} noch weiterkommen? Weiterkommen- & Titelchance · WM 2026`,
    desc: (nm: string, adv: string, champ: string) =>
      `Live-Chance von ${nm} bei der WM 2026: ${adv}% Weiterkommen und ${champ}% Titelgewinn (10.000 Monte-Carlo-Simulationen), mit Modell-Stärkewert, aktueller Form und nächstem Spiel. Kostenlos, ohne Anmeldung.`,
    advance: "Weiterkommen-Chance",
    champion: "Titelchance",
    rating: "Modell-Stärkewert",
    ratingNote: "Stärkewert = der Elo-Wert, den das Modell verwendet (einer der Faktoren seiner Wahrscheinlichkeiten), kein offizielles Ranking.",
    group: (x: string, r: number) => `Gruppe ${x} · aktuell ${r}.`,
    recent: "Aktuelle Form",
    noRecent: "Noch keine absolvierten Spiele",
    next: "Nächstes Spiel",
    noNext: "Keine anstehenden Spiele",
    home: "H",
    away: "A",
    W: "S",
    D: "U",
    L: "N",
    calc: (nm: string) => `🧮 Wie kann ${nm} noch weiterkommen? Rechner öffnen →`,
    sims: "10.000 Monte-Carlo-Simulationen (öffentliche Prognosedaten + Elo), stündlich aktualisiert",
    latest: "Letztes Ergebnis",
    lead: (nm: string, adv: string, champ: string, x: string) =>
      `WM 2026: ${nm} hat ${adv}% Chance auf das Weiterkommen aus Gruppe ${x} und ${champ}% auf den Titelgewinn (10.000 Monte-Carlo-Simulationen).`,
    shareText: (nm: string, adv: string) => `${nm} hat ${adv}% Chance auf das Weiterkommen (WM-2026-Modell)`,
  },
  fr: {
    back: "← Retour",
    title: (nm: string) => `${nm} peut-il encore se qualifier ? Probabilité de qualification et de titre · Mondial 2026`,
    desc: (nm: string, adv: string, champ: string) =>
      `Probabilité en direct de ${nm} au Mondial 2026 : ${adv}% de se qualifier et ${champ}% de remporter le titre (10 000 simulations de Monte-Carlo), avec note de force du modèle, forme récente et prochain match. Gratuit, sans inscription.`,
    advance: "Probabilité de qualification",
    champion: "Probabilité de titre",
    rating: "Note de force du modèle",
    ratingNote: "Note de force = la note Elo utilisée par le modèle (l'un des facteurs de ses probabilités), pas un classement officiel.",
    group: (x: string, r: number) => `Groupe ${x} · actuellement ${r}${r === 1 ? "er" : "e"}`,
    recent: "Forme récente",
    noRecent: "Aucun match disputé pour l'instant",
    next: "Prochain match",
    noNext: "Aucun match à venir",
    home: "Dom",
    away: "Ext",
    W: "V",
    D: "N",
    L: "D",
    calc: (nm: string) => `🧮 Comment ${nm} peut-il encore se qualifier ? Ouvre le calculateur →`,
    sims: "10 000 simulations de Monte-Carlo (données publiques de prévision + Elo), actualisées chaque heure",
    latest: "Dernier résultat",
    lead: (nm: string, adv: string, champ: string, x: string) =>
      `Mondial 2026 : ${nm} a ${adv}% de probabilité de se qualifier depuis le Groupe ${x} et ${champ}% de remporter le titre (10 000 simulations de Monte-Carlo).`,
    shareText: (nm: string, adv: string) => `${nm} a ${adv}% de probabilité de se qualifier (modèle Mondial 2026)`,
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const d = await getTeamDetail(slug).catch(() => null);
  if (!d) return {};
  const c = COPY[locale];
  const nm = locale === "zh" ? d.zh : teamName(d.name, locale);
  const og = `/api/og?team=${d.slug}&locale=${locale}&u=${encodeURIComponent(localeHref(locale, `/team/${d.slug}`))}`;
  return {
    title: c.title(nm),
    description: c.desc(nm, fmtP(d.pAdvance), fmtP(d.pChampion)),
    alternates: localizedAlternates(`/team/${d.slug}`, locale),
    openGraph: { title: c.title(nm), url: selfUrl(`/team/${d.slug}`, locale), images: [{ url: og, width: 1080, height: 1440 }] },
    twitter: { card: "summary_large_image", images: [og] },
  };
}

function ResultChip({
  r,
  c,
  locale,
}: {
  r: TeamResult;
  c: { home: string; away: string; W: string; D: string; L: string };
  locale: Locale;
}) {
  const color = r.outcome === "W" ? "text-green" : r.outcome === "L" ? "text-red" : "text-amber";
  const oppName = locale === "zh" ? r.oppZh : teamName(r.oppName, locale);
  return (
    <Link
      href={localeHref(locale, `/match/${r.matchId}`)}
      className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm transition hover:border-green/50"
    >
      <span className="flex items-center gap-2">
        <span className={`font-head w-4 shrink-0 font-bold ${color}`}>{c[r.outcome]}</span>
        <span className="text-[10px] text-muted md:text-xs">{r.home ? c.home : c.away}</span>
        {r.oppFlag && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.oppFlag} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
        )}
        <span className="truncate">{oppName}</span>
      </span>
      <span className="font-head tabular-nums">
        {r.gf}-{r.ga}
      </span>
    </Link>
  );
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const d = await getTeamDetail(slug);
  if (!d) notFound();
  const idx = await getSettledIndex().catch(() => null);
  const lastResult = idx?.byTeam[d.id] ?? null; // 真实 settled_at，非伪新鲜
  const c = COPY[locale];
  const nm = locale === "zh" ? d.zh : teamName(d.name, locale);
  const adv = fmtP(d.pAdvance);
  const champ = fmtP(d.pChampion);
  const advHigh = (d.pAdvance > 1 ? d.pAdvance : d.pAdvance * 100) >= 50;
  const nextOpp = d.next ? (locale === "zh" ? d.next.oppZh : teamName(d.next.oppName, locale)) : "";
  const ogUrl = `${SITE}/api/og?team=${d.slug}&locale=${locale}&u=${encodeURIComponent(localeHref(locale, `/team/${d.slug}`))}`;

  const HOME_LABEL: Record<Locale, string> = {
    zh: "首页",
    en: "Home",
    es: "Inicio",
    pt: "Início",
    de: "Startseite",
    fr: "Accueil",
  };
  const GROUP_LINK: Record<Locale, string> = {
    zh: `🧮 看 ${d.letter} 组完整出线形势 →`,
    en: `🧮 See full Group ${d.letter} scenarios →`,
    es: `🧮 Ver escenarios completos del Grupo ${d.letter} →`,
    pt: `🧮 Ver cenários completos do Grupo ${d.letter} →`,
    de: `🧮 Alle Szenarien der Gruppe ${d.letter} ansehen →`,
    fr: `🧮 Voir tous les scénarios du Groupe ${d.letter} →`,
  };
  const RULES_LINK: Record<Locale, string> = {
    zh: "📖 出线规则详解（第三名怎么算）",
    en: "📖 How World Cup 2026 qualification works",
    es: "📖 Cómo funciona la clasificación del Mundial 2026",
    pt: "📖 Como funciona a classificação da Copa 2026",
    de: "📖 So funktioniert die WM-2026-Qualifikation",
    fr: "📖 Comment fonctionne la qualification du Mondial 2026",
  };

  // SportsTeam + 面包屑实体（只填真实字段；实力评分对外不写官方排名）。
  const teamJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsTeam",
        "@id": `${selfUrl(`/team/${d.slug}`, locale)}#team`,
        name: d.name,
        sport: "Soccer",
        url: selfUrl(`/team/${d.slug}`, locale),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: HOME_LABEL[locale] ?? "Home", item: selfUrl("/", locale) },
          { "@type": "ListItem", position: 2, name: nm, item: selfUrl(`/team/${d.slug}`, locale) },
        ],
      },
    ],
  };

  return (
    <PageContainer tier="prose">
      <JsonLd data={teamJsonLd} />
      <div className="flex items-center justify-between">
        <Link href={localeHref(locale, "/")} className="text-xs text-muted">
          {c.back}
        </Link>
        <HeaderShare
          locale={locale}
          shareUrl={selfUrl(`/team/${d.slug}`, locale)}
          text={c.shareText(nm, adv)}
          ogUrl={ogUrl}
          source="team"
        />
      </div>

      {/* 主体卡：国旗 + 队名 + 组/排名 */}
      <div className="mt-3 flex items-center gap-4 rounded-lg border border-border bg-surface p-5">
        {d.flag ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.flag.replace("/w80/", "/w160/")} alt="" className="h-12 w-16 rounded-sm object-cover ring-1 ring-border" />
        ) : (
          <span className="text-5xl">⚽</span>
        )}
        <div>
          <h1 className="font-head text-2xl font-bold md:text-3xl">{nm}</h1>
          <div className="text-xs text-muted">{c.group(d.letter, d.rank)}</div>
        </div>
      </div>

      {/* 前置可提取答案（GEO：答案前置 + 统计数字 + 年份；EN-first）+ 最新赛果（真实 settled_at）。 */}
      <p className="mt-3 text-sm leading-relaxed md:text-base">{c.lead(nm, adv, champ, d.letter)}</p>
      {lastResult && (
        <p className="mt-1 text-[11px] text-muted md:text-xs">
          {c.latest} · {new Date(lastResult).toLocaleDateString(BCP47_LOCALE[locale] ?? "en-US")}
        </p>
      )}

      {/* 概率 + 实力评分 */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-md border border-border bg-surface-2 p-4">
          <div className={`font-head text-3xl font-bold ${advHigh ? "text-green" : "text-amber"}`}>{adv}%</div>
          <div className="mt-1 text-[11px] text-muted md:text-xs">{c.advance}</div>
        </div>
        <div className="rounded-md border border-border bg-surface-2 p-4">
          <div className="font-head text-3xl font-bold text-gold">{champ}%</div>
          <div className="mt-1 text-[11px] text-muted md:text-xs">{c.champion}</div>
        </div>
        <div className="rounded-md border border-border bg-surface-2 p-4">
          <div className="font-head text-3xl font-bold">{d.rating}</div>
          <div className="mt-1 text-[11px] text-muted md:text-xs">{c.rating}</div>
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted md:text-xs">{c.ratingNote}</p>

      <div className="mt-4">
        <SetMyTeamButton slug={d.slug} locale={locale} />
      </div>

      {/* 下一场 */}
      <h2 className="font-head mb-2 mt-6 text-sm font-semibold md:text-base">{c.next}</h2>
      {d.next ? (
        <Link
          href={localeHref(locale, `/match/${d.next.matchId}`)}
          className="flex items-center justify-between rounded-lg border border-green/40 bg-surface p-3 text-sm transition hover:border-green"
        >
          <span className="flex items-center gap-2">
            <span className="text-[10px] text-muted md:text-xs">{d.next.home ? c.home : c.away}</span>
            {d.next.oppFlag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.next.oppFlag} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
            )}
            <span>{nextOpp}</span>
          </span>
          <span className="text-xs text-muted">
            <LocalTime iso={d.next.kickoff} locale={locale} mode="datetime" />
          </span>
        </Link>
      ) : (
        <p className="rounded-md border border-border bg-surface-2 p-3 text-sm text-muted md:text-base">{c.noNext}</p>
      )}

      {/* 最近战绩 */}
      <h2 className="font-head mb-2 mt-6 text-sm font-semibold md:text-base">{c.recent}</h2>
      {d.recent.length > 0 ? (
        <div className="space-y-1.5">
          {d.recent.map((r) => (
            <ResultChip key={r.matchId} r={r} c={c} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-border bg-surface-2 p-3 text-sm text-muted md:text-base">{c.noRecent}</p>
      )}

      {/* 交叉链接：计算器 */}
      <Link
        href={localeHref(locale, `/calculator?team=${d.slug}`)}
        className="mt-6 block rounded-lg border border-border bg-surface p-3 text-sm text-green transition-colors hover:border-green/50"
      >
        {c.calc(nm)}
      </Link>
      <Link
        href={localeHref(locale, `/calculator/group/${d.letter.toLowerCase()}`)}
        className="mt-2 block rounded-lg border border-border bg-surface p-3 text-sm text-muted transition-colors hover:border-green/50"
      >
        {GROUP_LINK[locale] ?? GROUP_LINK.en}
      </Link>
      <Link href={localeHref(locale, "/rules")} className="mt-2 block rounded-lg border border-border bg-surface p-3 text-sm text-muted transition-colors hover:border-green/50">
        {RULES_LINK[locale] ?? RULES_LINK.en}
      </Link>

      <p className="mt-4 text-[10px] text-muted md:text-xs">{c.sims}</p>

      <footer className="mt-6 text-center">
        <Disclaimer />
      </footer>
    </PageContainer>
  );
}
