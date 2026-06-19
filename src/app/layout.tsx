import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { getLocale } from "@/i18n/server";
import { LocaleProvider } from "@/i18n/LocaleContext";
import { LOCALES, BCP47_LOCALE, type Locale } from "@/i18n";
import { JsonLd } from "@/lib/seo/jsonLd";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// OG locale 码（es 用 es_MX 贴合拉美口吻 + 东道主墨西哥，§4②；其余标准）。
const OG_LOCALE: Record<Locale, string> = {
  zh: "zh_CN",
  en: "en_US",
  es: "es_MX",
  pt: "pt_BR",
  de: "de_DE",
  fr: "fr_FR",
};

interface MetaCopy {
  title: string;
  description: string;
  ogDescription: string;
  siteName: string;
  appName: string;
}
const META: Record<Locale, MetaCopy> = {
  zh: {
    title: "2026 世界杯：积分榜、出线形势与比分预测",
    description:
      "2026 世界杯实时小组积分榜、出线场景、最佳第三名形势与模型比分预测；另有免费预测游戏。免费 · 无需注册 · 仅供娱乐。",
    ogDescription:
      "2026 世界杯实时积分榜、出线概率、最佳第三名与每场比分预测，另附免费预测游戏。免费 · 仅供娱乐。",
    siteName: "环球足球预测 · 2026",
    appName: "环球足球预测",
  },
  en: {
    title: "World Cup 2026: Standings, Who Advances & Score Predictions",
    description:
      "Live World Cup 2026 group standings, qualification scenarios, the best third-placed race and model score predictions — plus a free prediction game. No sign-up, for fun only.",
    ogDescription:
      "Live World Cup 2026 standings, who advances, the best-thirds race and model score predictions — plus a free, no-sign-up prediction game. For fun only.",
    siteName: "WC2026.cool — World Cup 2026 Prediction Game",
    appName: "WC2026 Predictor",
  },
  es: {
    title: "Mundial 2026: clasificación, quién avanza y predicciones de marcador",
    description:
      "Clasificación en vivo del Mundial 2026, escenarios de clasificación, la carrera por los mejores terceros y predicciones de marcador del modelo — además de un juego de predicciones gratis. Sin registro, solo por diversión.",
    ogDescription:
      "Clasificación en vivo, quién avanza, los mejores terceros y predicciones de marcador del Mundial 2026 — además de un juego de predicciones gratis. Solo por diversión.",
    siteName: "WC2026.cool — Juego de predicciones del Mundial 2026",
    appName: "WC2026 Predictor",
  },
  pt: {
    title: "Copa 2026: classificação, quem avança e previsões de placar",
    description:
      "Classificação ao vivo da Copa 2026, cenários de classificação, a disputa pelos melhores terceiros e previsões de placar do modelo — além de um jogo de previsões grátis. Sem cadastro, só diversão.",
    ogDescription:
      "Classificação ao vivo, quem avança, os melhores terceiros e previsões de placar da Copa 2026 — além de um jogo de previsões grátis. Só diversão.",
    siteName: "WC2026.cool — Jogo de previsões da Copa 2026",
    appName: "WC2026 Predictor",
  },
  de: {
    title: "WM 2026: Tabelle, wer weiterkommt & Ergebnisprognosen",
    description:
      "Live-Tabellen der WM 2026, Qualifikationsszenarien, das Rennen um die besten Gruppendritten und Modell-Ergebnisprognosen — plus ein kostenloses Tippspiel. Ohne Anmeldung, nur zum Spaß.",
    ogDescription:
      "Live-Tabellen, wer weiterkommt, die besten Gruppendritten und Ergebnisprognosen zur WM 2026 — plus ein kostenloses Tippspiel. Nur zum Spaß.",
    siteName: "WC2026.cool — WM-2026-Tippspiel",
    appName: "WC2026 Predictor",
  },
  fr: {
    title: "Mondial 2026 : classement, qui se qualifie et pronostics de score",
    description:
      "Classements en direct du Mondial 2026, scénarios de qualification, la course aux meilleurs troisièmes et des pronostics de score du modèle — plus un jeu de prédictions gratuit. Sans inscription, juste pour le plaisir.",
    ogDescription:
      "Classements en direct, qui se qualifie, les meilleurs troisièmes et des pronostics de score du Mondial 2026 — plus un jeu de prédictions gratuit. Juste pour le plaisir.",
    siteName: "WC2026.cool — Jeu de prédictions de la Coupe du monde 2026",
    appName: "WC2026 Predictor",
  },
};

// 语言感知 metadata：canonical 统一到 www（与生产 308 跳转方向一致），分享卡带品牌图。
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = META[locale] ?? META.en;
  const ogLocale = OG_LOCALE[locale];
  // 其余 5 个 locale 的 OG 码 → alternateLocale 数组（单值概念升级为多语数组）。
  const alternateLocale = LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]);
  return {
    metadataBase: new URL("https://www.wc2026.cool"),
    title: m.title,
    description: m.description,
    applicationName: m.appName,
    // canonical 不在根 layout 设相对 "./"（经 CodeX 外审：相对值在内页会解析到错误目标，
    // 把 /forecast、/match/[id] 等 canonical 到首页/不存在页，伤收录）。改为各可索引路由显式绝对自指。
    openGraph: {
      type: "website",
      locale: ogLocale,
      alternateLocale,
      url: "./",
      siteName: m.siteName,
      title: m.title,
      description: m.ogDescription,
      images: [{ url: "/og.png", width: 1080, height: 1440, alt: m.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: m.title,
      description: m.description,
      images: ["/og.png"],
    },
    // Google Search Console 所有权验证（删除会导致 GSC 失效，勿移除）
    verification: { google: "sOWAw6DVwayeUBiVymgvXfePWJYhKRpg_TtwCQlAGb0" },
    // Google AdSense 站点验证（元标记方式，SSR 渲染最可靠）
    other: { "google-adsense-account": "ca-pub-6993272715247473" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const m = META[locale] ?? META.en;
  // 站点级实体（WebSite + Organization）；服务端渲染进首块。只填真实字段。
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.wc2026.cool/#website",
        url: "https://www.wc2026.cool/",
        name: m.siteName,
        inLanguage: BCP47_LOCALE[locale],
        publisher: { "@id": "https://www.wc2026.cool/#org" },
      },
      {
        "@type": "Organization",
        "@id": "https://www.wc2026.cool/#org",
        name: "wc2026.cool",
        url: "https://www.wc2026.cool/",
      },
    ],
  };
  return (
    <html
      lang={locale}
      className={`${oswald.variable} ${inter.variable} h-full antialiased`}
    >
      {/* pb-16 仅手机端为固定底部栏留白；桌面端底部栏隐藏、改顶部栏，无需留白。 */}
      <body className="min-h-full flex flex-col bg-bg text-text font-body pb-16 md:pb-0">
        <JsonLd data={siteJsonLd} />
        <LocaleProvider locale={locale}>
          <ToastProvider>
            <TopNav locale={locale} />
            {children}
            <Footer locale={locale} />
            <BottomNav locale={locale} />
          </ToastProvider>
        </LocaleProvider>
        <Analytics />
        <SpeedInsights />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6993272715247473"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
