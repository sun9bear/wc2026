import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { getLocale } from "@/i18n/server";
import { LocaleProvider } from "@/i18n/LocaleContext";
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

const META = {
  zh: {
    title: "环球足球预测 · 2026",
    description: "趣味足球预测游戏：用虚拟积分预测比赛、冲排行榜、解锁段位。仅供娱乐。",
    ogDescription:
      "用虚拟积分预测世界杯每场胜平负，冲排行榜、解锁段位，看 AI 趣味前瞻。免费 · 仅供娱乐。",
    siteName: "环球足球预测 · 2026",
    appName: "环球足球预测",
    ogLocale: "zh_CN",
    altLocale: "en_US",
  },
  en: {
    title: "World Cup 2026 Prediction Game — Free, No Sign-up",
    description:
      "Predict every 2026 World Cup match with virtual points, climb the leaderboard and read AI previews. Free, bilingual, for fun only.",
    ogDescription:
      "Predict every 2026 World Cup match with virtual points, climb the leaderboard and read AI previews. Free, bilingual, for fun only.",
    siteName: "WC2026.cool — World Cup 2026 Prediction Game",
    appName: "WC2026 Predictor",
    ogLocale: "en_US",
    altLocale: "zh_CN",
  },
} as const;

// 语言感知 metadata：canonical 统一到 www（与生产 308 跳转方向一致），分享卡带品牌图。
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = META[locale];
  return {
    metadataBase: new URL("https://www.wc2026.cool"),
    title: m.title,
    description: m.description,
    applicationName: m.appName,
    // canonical 不在根 layout 设相对 "./"（经 CodeX 外审：相对值在内页会解析到错误目标，
    // 把 /forecast、/match/[id] 等 canonical 到首页/不存在页，伤收录）。改为各可索引路由显式绝对自指。
    openGraph: {
      type: "website",
      locale: m.ogLocale,
      alternateLocale: m.altLocale,
      url: "./",
      siteName: m.siteName,
      title: m.title,
      description: m.ogDescription,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: m.title }],
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
  const m = META[locale];
  // 站点级实体（WebSite + Organization）；服务端渲染进首块。只填真实字段。
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.wc2026.cool/#website",
        url: "https://www.wc2026.cool/",
        name: m.siteName,
        inLanguage: m.ogLocale,
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
      <body className="min-h-full flex flex-col bg-bg text-text font-body pb-16">
        <JsonLd data={siteJsonLd} />
        <LocaleProvider locale={locale}>
          <ToastProvider>
            {children}
            <Footer locale={locale} />
            <BottomNav locale={locale} />
          </ToastProvider>
        </LocaleProvider>
        <Analytics />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6993272715247473"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
