import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { localeHref } from "@/i18n";
import { localizedAlternates } from "@/lib/seo/canonical";

// 双语隐私政策：/privacy 出英文、/zh/privacy 出中文，使既有 reciprocal hreflang 成立
// （与 /disclaimer、/about 同等待遇——避免「根 URL 声明 en 却渲染中文」的 hreflang/内容矛盾）。
const META = {
  zh: {
    title: "隐私政策 · 环球足球预测",
    description:
      "环球足球预测的隐私政策：我们收集哪些信息、如何使用 Cookie、以及第三方广告（Google AdSense）说明。",
  },
  en: {
    title: "Privacy Policy · WorldCup Predictor",
    description:
      "WorldCup Predictor privacy policy: what information we collect, how we use cookies, and details about third-party advertising (Google AdSense).",
  },
} as const;

const COPY = {
  zh: {
    back: "← 返回",
    h1: "隐私政策",
    updated: "最后更新：2026 年 6 月",
    overviewH: "概述",
    overviewP:
      "本政策说明「环球足球预测」（下称“本站”）在你使用时会收集哪些信息、如何使用，以及第三方广告与 Cookie 的相关说明。本站是一个免费、不涉及金钱的娱乐小游戏。",
    collectH: "我们收集的信息",
    collectP1:
      "本站采用匿名登录，不收集你的姓名、邮箱、手机号等个人身份信息。",
    collectP2:
      "为提供游戏功能，我们会保存与你的匿名账户关联的游戏数据（如预测记录、虚拟积分余额、签到记录），以及用于安全与统计的基础访问日志。",
    cookiesH: "Cookie 与本地存储",
    cookiesP:
      "本站使用 Cookie / 浏览器本地存储来保持你的登录状态、记住偏好并改善体验。你可以在浏览器中清除或限制这些存储，但可能影响部分功能。",
    adsH: "第三方广告（Google AdSense）",
    adsP1: "本站使用第三方广告服务商 Google AdSense 展示广告。",
    adsP2: "Google 等第三方厂商会使用 Cookie，根据你对本站及其他网站的访问情况投放广告。",
    adsBefore: "你可以访问 ",
    adsLink1: "Google 广告设置",
    adsMid: " 停用个性化广告；或访问 ",
    adsLink2: "aboutads.info",
    adsAfter: " 了解如何停用第三方厂商的广告 Cookie。",
    storageH: "数据存储与安全",
    storageP1:
      "本站托管于海外云服务（Vercel / Supabase）。我们采取合理措施保护数据，但任何互联网传输都无法保证绝对安全。",
    storageP2: "本站不会向第三方出售你的信息。",
    childrenH: "儿童",
    childrenP: "本站为大众娱乐产品，不针对未满 13 岁的儿童收集信息。",
    updatesH: "政策更新与联系",
    updatesP1: "本政策可能不时更新，更新后将在本页公布。",
    contact: "如有疑问，可联系：",
  },
  en: {
    back: "← Back",
    h1: "Privacy Policy",
    updated: "Last updated: June 2026",
    overviewH: "Overview",
    overviewP:
      "This policy explains what information WorldCup Predictor (the “Site”) collects when you use it, how that information is used, and details about third-party advertising and cookies. The Site is a free, money-free game for entertainment.",
    collectH: "Information We Collect",
    collectP1:
      "The Site uses anonymous sign-in and does not collect personally identifying information such as your name, email or phone number.",
    collectP2:
      "To provide the game, we store game data tied to your anonymous account (such as your predictions, virtual point balance and check-in history), plus basic access logs used for security and statistics.",
    cookiesH: "Cookies & Local Storage",
    cookiesP:
      "The Site uses cookies / browser local storage to keep you signed in, remember your preferences and improve your experience. You can clear or restrict this storage in your browser, but some features may stop working.",
    adsH: "Third-party Advertising (Google AdSense)",
    adsP1: "The Site uses the third-party advertising provider Google AdSense to display ads.",
    adsP2:
      "Google and other third-party vendors use cookies to serve ads based on your visits to this and other websites.",
    adsBefore: "You can visit ",
    adsLink1: "Google Ads Settings",
    adsMid: " to opt out of personalized ads, or visit ",
    adsLink2: "aboutads.info",
    adsAfter: " to learn how to opt out of third-party vendors’ advertising cookies.",
    storageH: "Data Storage & Security",
    storageP1:
      "The Site is hosted on overseas cloud services (Vercel / Supabase). We take reasonable measures to protect data, but no transmission over the internet can be guaranteed to be completely secure.",
    storageP2: "The Site does not sell your information to third parties.",
    childrenH: "Children",
    childrenP:
      "The Site is a general-audience entertainment product and does not target or collect information from children under 13.",
    updatesH: "Updates & Contact",
    updatesP1: "This policy may be updated from time to time; updates will be posted on this page.",
    contact: "Questions? Contact:",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: META[locale].title,
    description: META[locale].description,
    alternates: localizedAlternates("/privacy", locale),
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="font-head mb-2 text-sm font-semibold text-green">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-text/90">{children}</div>
    </section>
  );
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href={localeHref(locale, "/")} className="text-xs text-muted">
        {c.back}
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold">{c.h1}</h1>
      <p className="mt-1 text-xs text-muted">{c.updated}</p>

      <div className="mt-5 space-y-4">
        <Section title={c.overviewH}>
          <p>{c.overviewP}</p>
        </Section>

        <Section title={c.collectH}>
          <p>{c.collectP1}</p>
          <p>{c.collectP2}</p>
        </Section>

        <Section title={c.cookiesH}>
          <p>{c.cookiesP}</p>
        </Section>

        <Section title={c.adsH}>
          <p>{c.adsP1}</p>
          <p>{c.adsP2}</p>
          <p>
            {c.adsBefore}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-text"
            >
              {c.adsLink1}
            </a>
            {c.adsMid}
            <a
              href="https://www.aboutads.info"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-text"
            >
              {c.adsLink2}
            </a>
            {c.adsAfter}
          </p>
        </Section>

        <Section title={c.storageH}>
          <p>{c.storageP1}</p>
          <p>{c.storageP2}</p>
        </Section>

        <Section title={c.childrenH}>
          <p>{c.childrenP}</p>
        </Section>

        <Section title={c.updatesH}>
          <p>{c.updatesP1}</p>
          <p>
            {c.contact} <span className="text-text">js5559sun@proton.me</span>
          </p>
        </Section>
      </div>
    </main>
  );
}
