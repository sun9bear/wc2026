import type { Metadata } from "next";
import Link from "next/link";
import { getLeaderboard } from "@/lib/leaderboard/getLeaderboard";
import { PageContainer } from "@/components/PageContainer";
import { fmtPoints } from "@/lib/format";
import { getDict, localeHref, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { localizedAlternates, selfUrl } from "@/lib/seo/canonical";
import { JsonLd } from "@/lib/seo/jsonLd";

export const dynamic = "force-dynamic";

// 排行榜页描述（6 语）。此前只设 alternates、无 title/description，继承通用标题被 GSC 判低质。
const META_DESC: Record<Locale, string> = {
  zh: "2026 世界杯预测排行榜：玩家虚拟积分实时排名与段位，看看谁预测最准。免费 · 仅供娱乐。",
  en: "World Cup 2026 prediction leaderboard: live ranking of players by virtual points and tier. See who predicts best. Free, for fun only.",
  es: "Clasificación de predicciones del Mundial 2026: ranking en vivo de jugadores por puntos virtuales y nivel. Gratis, solo por diversión.",
  pt: "Classificação de previsões da Copa 2026: ranking ao vivo de jogadores por pontos virtuais e nível. Grátis, só diversão.",
  de: "WM-2026-Tipp-Rangliste: Live-Ranking der Spieler nach virtuellen Punkten und Stufe. Kostenlos, nur zum Spaß.",
  fr: "Classement des pronostics de la Coupe du monde 2026 : classement en direct des joueurs par points virtuels et niveau. Gratuit, juste pour le plaisir.",
};

// B4：答案前置领跑句（命中"world cup 2026 prediction leaderboard"）。
const LEAD: Record<Locale, (name: string, pts: string) => string> = {
  zh: (n, p) => `${n} 目前领跑 2026 世界杯预测排行榜，积 ${p} 分。下方按虚拟积分列出全部玩家与段位。`,
  en: (n, p) => `${n} currently tops the World Cup 2026 prediction leaderboard with ${p} points. Below are all players ranked by virtual points and tier.`,
  es: (n, p) => `${n} lidera ahora la clasificación de predicciones del Mundial 2026 con ${p} puntos. Abajo, todos los jugadores por puntos virtuales y nivel.`,
  pt: (n, p) => `${n} lidera agora a classificação de previsões da Copa 2026 com ${p} pontos. Abaixo, todos os jogadores por pontos virtuais e nível.`,
  de: (n, p) => `${n} führt derzeit die WM-2026-Tipp-Rangliste mit ${p} Punkten an. Unten alle Spieler nach virtuellen Punkten und Stufe.`,
  fr: (n, p) => `${n} est en tête du classement des pronostics de la Coupe du monde 2026 avec ${p} points. Ci-dessous, tous les joueurs par points virtuels et niveau.`,
};
const CRUMB_HOME: Record<Locale, string> = {
  zh: "首页", en: "Home", es: "Inicio", pt: "Início", de: "Startseite", fr: "Accueil",
};

// 显式绝对自指 canonical（CodeX 外审 M2）。
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDict(locale);
  return {
    title: `${t.leaderboard.title} · ${t.appName}`,
    description: META_DESC[locale],
    alternates: localizedAlternates("/leaderboard", locale),
  };
}

const TIER_COLOR: Record<string, string> = {
  legend: "text-gold",
  diamond: "text-blue",
  platinum: "text-blue",
  gold: "text-gold",
  silver: "text-muted",
  bronze: "text-muted",
};

export default async function LeaderboardPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const rows = await getLeaderboard(locale);

  const lbJsonLd =
    rows.length > 0
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ItemList",
              name: `${t.leaderboard.title} · ${t.appName}`,
              numberOfItems: rows.length,
              itemListElement: rows.slice(0, 20).map((r) => ({
                "@type": "ListItem",
                position: r.rank,
                name: r.name,
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: CRUMB_HOME[locale], item: selfUrl("/", locale) },
                { "@type": "ListItem", position: 2, name: t.leaderboard.title, item: selfUrl("/leaderboard", locale) },
              ],
            },
          ],
        }
      : null;

  return (
    <PageContainer tier="prose">
      {lbJsonLd && <JsonLd data={lbJsonLd} />}
      <div className="flex items-center justify-between">
        <h1 className="font-head text-2xl font-bold md:text-3xl">{t.leaderboard.title}</h1>
        <Link href={localeHref(locale, "/")} className="text-xs text-muted">
          {t.common.back}
        </Link>
      </div>
      {rows.length > 0 && (
        <p className="mt-2 text-sm leading-relaxed text-text/90 md:text-base">
          {LEAD[locale](rows[0].name, fmtPoints(rows[0].points))}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-5xl">🏆</div>
          <p className="mt-3 text-sm text-muted md:text-base">{t.leaderboard.empty}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {rows.map((r) => (
            <li
              key={r.rank}
              className="flex items-center gap-3 rounded-md border border-border bg-surface-2 p-3 transition-colors hover:border-green/40"
            >
              <span className="font-head w-6 text-center text-lg font-bold text-muted">
                {r.rank}
              </span>
              <span className="flex-1 truncate text-sm font-medium">
                {r.name}
              </span>
              <span className={`text-[10px] md:text-xs ${TIER_COLOR[r.tierCode] ?? "text-muted"}`}>
                {t.tiers[r.tierCode] ?? r.tierLabel}
              </span>
              <span className="font-head text-base font-bold">{fmtPoints(r.points)}</span>
            </li>
          ))}
        </ul>
      )}

    </PageContainer>
  );
}
