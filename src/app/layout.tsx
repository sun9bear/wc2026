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
    title: "环球足球预测 · 2026",
    description: "趣味足球预测游戏：用虚拟积分预测比赛、冲排行榜、解锁段位。仅供娱乐。",
    ogDescription:
      "用虚拟积分预测世界杯每场胜平负，冲排行榜、解锁段位，看 AI 趣味前瞻。免费 · 仅供娱乐。",
    siteName: "环球足球预测 · 2026",
    appName: "环球足球预测",
  },
  en: {
    title: "World Cup 2026 Prediction Game — Free, No Sign-up",
    description:
      "Predict every 2026 World Cup match with virtual points, climb the leaderboard and read AI previews. Free, for fun only.",
    ogDescription:
      "Predict every 2026 World Cup match with virtual points, climb the leaderboard and read AI previews. Free, for fun only.",
    siteName: "WC2026.cool — World Cup 2026 Prediction Game",
    appName: "WC2026 Predictor",
  },
  es: {
    title: "Juego de predicciones del Mundial 2026 — gratis, sin registro",
    description:
      "Predice cada partido del Mundial 2026 con puntos virtuales, sube en la clasificación y lee avances con IA. Gratis, solo por diversión.",
    ogDescription:
      "Predice cada partido del Mundial 2026 con puntos virtuales, sube en la clasificación y lee avances con IA. Gratis, solo por diversión.",
    siteName: "WC2026.cool — Juego de predicciones del Mundial 2026",
    appName: "WC2026 Predictor",
  },
  pt: {
    title: "Jogo de previsões da Copa 2026 — grátis, sem cadastro",
    description:
      "Preveja cada jogo da Copa 2026 com pontos virtuais, suba no ranking e leia prévias com IA. Grátis, só diversão.",
    ogDescription:
      "Preveja cada jogo da Copa 2026 com pontos virtuais, suba no ranking e leia prévias com IA. Grátis, só diversão.",
    siteName: "WC2026.cool — Jogo de previsões da Copa 2026",
    appName: "WC2026 Predictor",
  },
  de: {
    title: "WM-2026-Tippspiel — kostenlos, ohne Anmeldung",
    description:
      "Tippe jedes Spiel der WM 2026 mit virtuellen Punkten, klettere im Ranking und lies KI-Vorschauen. Kostenlos, nur zum Spaß.",
    ogDescription:
      "Tippe jedes Spiel der WM 2026 mit virtuellen Punkten, klettere im Ranking und lies KI-Vorschauen. Kostenlos, nur zum Spaß.",
    siteName: "WC2026.cool — WM-2026-Tippspiel",
    appName: "WC2026 Predictor",
  },
  fr: {
    title: "Jeu de prédictions de la Coupe du monde 2026 — gratuit, sans inscription",
    description:
      "Prédis chaque match de la Coupe du monde 2026 avec des points virtuels, grimpe au classement et lis des aperçus IA. Gratuit, juste pour le plaisir.",
    ogDescription:
      "Prédis chaque match de la Coupe du monde 2026 avec des points virtuels, grimpe au classement et lis des aperçus IA. Gratuit, juste pour le plaisir.",
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
