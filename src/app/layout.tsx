import type { Metadata } from "next";
import Script from "next/script";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { getLocale } from "@/i18n/server";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wc2026.cool"),
  title: "环球足球预测 · 2026",
  description: "趣味足球预测游戏：用虚拟积分预测比赛、冲排行榜、解锁段位。仅供娱乐。",
  applicationName: "环球足球预测",
  // 分享卡片（微信/X 等）——标题+描述+站点名；后续可加品牌缩略图。
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    siteName: "环球足球预测 · 2026",
    title: "环球足球预测 · 2026",
    description: "用虚拟积分预测世界杯每场胜平负，冲排行榜、解锁段位，看 AI 趣味前瞻。免费 · 仅供娱乐。",
  },
  twitter: {
    card: "summary_large_image",
    title: "环球足球预测 · 2026",
    description: "用虚拟积分预测世界杯每场胜平负，冲排行榜、解锁段位。免费 · 仅供娱乐。",
  },
  // Google AdSense 站点验证（元标记方式，SSR 渲染最可靠）
  other: { "google-adsense-account": "ca-pub-6993272715247473" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${oswald.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text font-body pb-16">
        <ToastProvider>
          {children}
          <Footer locale={locale} />
          <BottomNav locale={locale} />
        </ToastProvider>
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
