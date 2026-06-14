import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { localeHref } from "@/i18n";
import { localizedAlternates } from "@/lib/seo/canonical";

// 观赛指南：按地区列官方转播/流媒体渠道（双语，随 locale 切换）。
// 纯官方转播链接，无任何联盟/追踪链接。
const LINKS = {
  fox: "https://www.foxsports.com/soccer/fifa-world-cup-2026",
  peacock: "https://www.peacocktv.com/",
  tsn: "https://www.tsn.ca/",
  migu: "https://www.miguvideo.com/",
  fifa: "https://www.fifa.com/",
};

const COPY = {
  zh: {
    title: "2026 世界杯在哪看 · 直播观赛指南",
    description:
      "2026 世界杯全部 104 场比赛的电视与流媒体观看渠道：美国、加拿大、中国大陆及海外华人观赛指南，持续更新。",
    h1: "2026 世界杯在哪看",
    intro: "全部 104 场比赛的官方观看渠道，按地区整理，持续更新。",
    sections: [
      {
        flag: "🇺🇸",
        title: "美国（英语）",
        body: "FOX 与 FS1 直播全部 104 场比赛，流媒体可用 foxsports.com（需有线电视账号登录）。",
        linkText: "FOX Sports →",
        href: LINKS.fox,
      },
      {
        flag: "🇺🇸",
        title: "美国（西班牙语）",
        body: "Telemundo 与 Universo 提供西语转播，流媒体在 Peacock 观看。",
        linkText: "Peacock →",
        href: LINKS.peacock,
      },
      {
        flag: "🇨🇦",
        title: "加拿大",
        body: "TSN（英语）与 RDS（法语）转播，流媒体可用 TSN+。",
        linkText: "TSN →",
        href: LINKS.tsn,
      },
      {
        flag: "🇨🇳",
        title: "中国大陆",
        body: "央视 CCTV-5、咪咕视频与小红书均有转播权，咪咕与小红书可免费观看全部场次直播。",
        linkText: "咪咕视频 →",
        href: LINKS.migu,
      },
      {
        flag: "🌍",
        title: "其他地区",
        body: "各国持权转播商以 FIFA 官网公布的名录为准。",
        linkText: "FIFA 官网 →",
        href: LINKS.fifa,
      },
    ],
    note: "流媒体服务有地区限制，实际可用性以你所在地区为准。",
    back: "← 返回赛程",
  },
  en: {
    title: "Where to Watch the 2026 World Cup — TV & Streaming Guide",
    description:
      "How to watch all 104 World Cup 2026 matches: TV channels and streaming options for the US, Canada and Chinese-speaking fans worldwide. Updated through the tournament.",
    h1: "Where to Watch the 2026 World Cup",
    intro: "Official ways to watch all 104 matches, by region. Updated through the tournament.",
    sections: [
      {
        flag: "🇺🇸",
        title: "United States (English)",
        body: "FOX and FS1 carry every match; stream via foxsports.com with a TV-provider login.",
        linkText: "FOX Sports →",
        href: LINKS.fox,
      },
      {
        flag: "🇺🇸",
        title: "United States (Español)",
        body: "Telemundo and Universo broadcast in Spanish; stream on Peacock.",
        linkText: "Peacock →",
        href: LINKS.peacock,
      },
      {
        flag: "🇨🇦",
        title: "Canada",
        body: "TSN (English) and RDS (French) carry the tournament; stream with TSN+.",
        linkText: "TSN →",
        href: LINKS.tsn,
      },
      {
        flag: "🇨🇳",
        title: "Mainland China",
        body: "CCTV-5, Migu Video and Xiaohongshu hold broadcast rights; Migu and Xiaohongshu stream every match for free.",
        linkText: "Migu Video →",
        href: LINKS.migu,
      },
      {
        flag: "🌍",
        title: "Everywhere else",
        body: "Check FIFA's official list of broadcast partners for your country.",
        linkText: "FIFA.com →",
        href: LINKS.fifa,
      },
    ],
    note: "Streaming services are region-locked; availability depends on your location.",
    back: "← Back to matches",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const c = COPY[locale];
  return {
    title: c.title,
    description: c.description,
    alternates: localizedAlternates("/watch", locale),
  };
}

export default async function WatchPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href={localeHref(locale, "/")} className="text-xs text-muted">
        {c.back}
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold">📺 {c.h1}</h1>
      <p className="mt-1 mb-5 text-xs text-muted">{c.intro}</p>

      <div className="space-y-3">
        {c.sections.map((s) => (
          <section key={s.title} className="rounded-lg border border-border bg-surface p-4">
            <h2 className="font-head text-sm font-semibold">
              {s.flag} {s.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-green"
            >
              {s.linkText}
            </a>
          </section>
        ))}
      </div>

      <p className="mt-6 text-center text-[10px] leading-relaxed text-muted">{c.note}</p>
    </main>
  );
}
