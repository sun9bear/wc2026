import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { localeHref, type Locale } from "@/i18n";
import { localizedAlternates } from "@/lib/seo/canonical";
import { PageContainer } from "@/components/PageContainer";

// 观赛指南：按地区列官方转播/流媒体渠道（双语，随 locale 切换）。
// 纯官方转播链接，无任何联盟/追踪链接。
const LINKS = {
  fox: "https://www.foxsports.com/soccer/fifa-world-cup-2026",
  peacock: "https://www.peacocktv.com/",
  tsn: "https://www.tsn.ca/",
  migu: "https://www.miguvideo.com/",
  fifa: "https://www.fifa.com/",
};

interface WatchSection {
  flag: string;
  title: string;
  body: string;
  linkText: string;
  href: string;
}
interface WatchCopy {
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: WatchSection[];
  note: string;
  back: string;
}
const COPY: Record<Locale, WatchCopy> = {
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
  es: {
    title: "Dónde ver el Mundial 2026 — Guía de TV y streaming",
    description:
      "Cómo ver los 104 partidos del Mundial 2026: canales de TV y opciones de streaming para EE. UU., Canadá y aficionados de habla hispana. Actualizado durante el torneo.",
    h1: "Dónde ver el Mundial 2026",
    intro: "Formas oficiales de ver los 104 partidos, por región. Actualizado durante el torneo.",
    sections: [
      {
        flag: "🇺🇸",
        title: "Estados Unidos (inglés)",
        body: "FOX y FS1 transmiten todos los partidos; streaming en foxsports.com con cuenta de proveedor de TV.",
        linkText: "FOX Sports →",
        href: LINKS.fox,
      },
      {
        flag: "🇺🇸",
        title: "Estados Unidos (español)",
        body: "Telemundo y Universo transmiten en español; streaming en Peacock.",
        linkText: "Peacock →",
        href: LINKS.peacock,
      },
      {
        flag: "🇨🇦",
        title: "Canadá",
        body: "TSN (inglés) y RDS (francés) transmiten el torneo; streaming con TSN+.",
        linkText: "TSN →",
        href: LINKS.tsn,
      },
      {
        flag: "🇨🇳",
        title: "China continental",
        body: "CCTV-5, Migu Video y Xiaohongshu tienen los derechos; Migu y Xiaohongshu transmiten todos los partidos gratis.",
        linkText: "Migu Video →",
        href: LINKS.migu,
      },
      {
        flag: "🌍",
        title: "Resto del mundo",
        body: "Consulta la lista oficial de socios de transmisión de la FIFA para tu país.",
        linkText: "FIFA.com →",
        href: LINKS.fifa,
      },
    ],
    note: "Los servicios de streaming tienen restricciones regionales; la disponibilidad depende de tu ubicación.",
    back: "← Volver a los partidos",
  },
  pt: {
    title: "Onde assistir à Copa 2026 — Guia de TV e streaming",
    description:
      "Como assistir aos 104 jogos da Copa 2026: canais de TV e opções de streaming para EUA, Canadá e torcedores de língua portuguesa. Atualizado durante o torneio.",
    h1: "Onde assistir à Copa 2026",
    intro: "Formas oficiais de assistir aos 104 jogos, por região. Atualizado durante o torneio.",
    sections: [
      {
        flag: "🇺🇸",
        title: "Estados Unidos (inglês)",
        body: "FOX e FS1 transmitem todos os jogos; streaming no foxsports.com com login de provedor de TV.",
        linkText: "FOX Sports →",
        href: LINKS.fox,
      },
      {
        flag: "🇺🇸",
        title: "Estados Unidos (espanhol)",
        body: "Telemundo e Universo transmitem em espanhol; streaming no Peacock.",
        linkText: "Peacock →",
        href: LINKS.peacock,
      },
      {
        flag: "🇨🇦",
        title: "Canadá",
        body: "TSN (inglês) e RDS (francês) transmitem o torneio; streaming com TSN+.",
        linkText: "TSN →",
        href: LINKS.tsn,
      },
      {
        flag: "🇨🇳",
        title: "China continental",
        body: "CCTV-5, Migu Video e Xiaohongshu têm os direitos; Migu e Xiaohongshu transmitem todos os jogos de graça.",
        linkText: "Migu Video →",
        href: LINKS.migu,
      },
      {
        flag: "🌍",
        title: "Resto do mundo",
        body: "Confira a lista oficial de parceiros de transmissão da FIFA para o seu país.",
        linkText: "FIFA.com →",
        href: LINKS.fifa,
      },
    ],
    note: "Os serviços de streaming têm restrições regionais; a disponibilidade depende da sua localização.",
    back: "← Voltar aos jogos",
  },
  de: {
    title: "Wo läuft die WM 2026 — TV- & Streaming-Guide",
    description:
      "So siehst du alle 104 Spiele der WM 2026: TV-Sender und Streaming-Optionen für die USA, Kanada und Fans weltweit. Während des Turniers aktualisiert.",
    h1: "Wo läuft die WM 2026",
    intro: "Offizielle Wege, alle 104 Spiele zu sehen, nach Region. Während des Turniers aktualisiert.",
    sections: [
      {
        flag: "🇺🇸",
        title: "USA (Englisch)",
        body: "FOX und FS1 übertragen jedes Spiel; Stream über foxsports.com mit TV-Anbieter-Login.",
        linkText: "FOX Sports →",
        href: LINKS.fox,
      },
      {
        flag: "🇺🇸",
        title: "USA (Spanisch)",
        body: "Telemundo und Universo übertragen auf Spanisch; Stream auf Peacock.",
        linkText: "Peacock →",
        href: LINKS.peacock,
      },
      {
        flag: "🇨🇦",
        title: "Kanada",
        body: "TSN (Englisch) und RDS (Französisch) übertragen das Turnier; Stream mit TSN+.",
        linkText: "TSN →",
        href: LINKS.tsn,
      },
      {
        flag: "🇨🇳",
        title: "Festlandchina",
        body: "CCTV-5, Migu Video und Xiaohongshu halten die Rechte; Migu und Xiaohongshu streamen jedes Spiel kostenlos.",
        linkText: "Migu Video →",
        href: LINKS.migu,
      },
      {
        flag: "🌍",
        title: "Überall sonst",
        body: "Sieh in der offiziellen FIFA-Liste der Übertragungspartner für dein Land nach.",
        linkText: "FIFA.com →",
        href: LINKS.fifa,
      },
    ],
    note: "Streaming-Dienste sind regional beschränkt; die Verfügbarkeit hängt von deinem Standort ab.",
    back: "← Zurück zu den Spielen",
  },
  fr: {
    title: "Où regarder la Coupe du monde 2026 — Guide TV & streaming",
    description:
      "Comment regarder les 104 matchs de la Coupe du monde 2026 : chaînes TV et options de streaming pour les États-Unis, le Canada et les fans du monde entier. Mis à jour pendant le tournoi.",
    h1: "Où regarder la Coupe du monde 2026",
    intro: "Moyens officiels de regarder les 104 matchs, par région. Mis à jour pendant le tournoi.",
    sections: [
      {
        flag: "🇺🇸",
        title: "États-Unis (anglais)",
        body: "FOX et FS1 diffusent tous les matchs ; streaming sur foxsports.com avec un compte fournisseur TV.",
        linkText: "FOX Sports →",
        href: LINKS.fox,
      },
      {
        flag: "🇺🇸",
        title: "États-Unis (espagnol)",
        body: "Telemundo et Universo diffusent en espagnol ; streaming sur Peacock.",
        linkText: "Peacock →",
        href: LINKS.peacock,
      },
      {
        flag: "🇨🇦",
        title: "Canada",
        body: "TSN (anglais) et RDS (français) diffusent le tournoi ; streaming avec TSN+.",
        linkText: "TSN →",
        href: LINKS.tsn,
      },
      {
        flag: "🇨🇳",
        title: "Chine continentale",
        body: "CCTV-5, Migu Video et Xiaohongshu détiennent les droits ; Migu et Xiaohongshu diffusent tous les matchs gratuitement.",
        linkText: "Migu Video →",
        href: LINKS.migu,
      },
      {
        flag: "🌍",
        title: "Partout ailleurs",
        body: "Consultez la liste officielle des diffuseurs partenaires de la FIFA pour votre pays.",
        linkText: "FIFA.com →",
        href: LINKS.fifa,
      },
    ],
    note: "Les services de streaming sont limités par région ; la disponibilité dépend de votre localisation.",
    back: "← Retour aux matchs",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const c = COPY[locale] ?? COPY.en;
  return {
    title: c.title,
    description: c.description,
    alternates: localizedAlternates("/watch", locale),
  };
}

export default async function WatchPage() {
  const locale = await getLocale();
  const c = COPY[locale] ?? COPY.en;
  return (
    <PageContainer tier="standard">
      <Link href={localeHref(locale, "/")} className="text-xs text-muted">
        {c.back}
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold md:text-3xl">📺 {c.h1}</h1>
      <p className="mt-1 mb-5 text-xs text-muted">{c.intro}</p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {c.sections.map((s) => (
          <section key={s.title} className="rounded-lg border border-border bg-surface p-4">
            <h2 className="font-head text-sm font-semibold md:text-base">
              {s.flag} {s.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted md:text-base">{s.body}</p>
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

      <p className="mt-6 text-center text-[10px] leading-relaxed text-muted md:text-xs">{c.note}</p>
    </PageContainer>
  );
}
