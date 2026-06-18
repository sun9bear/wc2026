import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { localeHref } from "@/i18n";
import { localizedAlternates } from "@/lib/seo/canonical";
import { PageContainer } from "@/components/PageContainer";

// 免责声明（双语，locale-adaptive）：EN-first 爬虫/英文用户看到英文版——尤其「无官方关联」段
// 是商标抗辩 + AdSense IP 审核的关键面，必须对英文受众可读。英文文案避开雷词（用 reward 不用 multiplier）。
const COPY = {
  zh: {
    title: "免责声明 · 环球足球预测",
    description:
      "环球足球预测免责声明：纯娱乐产品，虚拟积分无现实价值、不可兑换，与 FIFA 及任何官方组织无关。",
    back: "← 返回",
    h1: "免责声明",
    sub: "环球足球预测 · 2026",
    s1: "娱乐性质",
    s1body: "本站为球迷自制的趣味娱乐产品，所有功能与内容仅供娱乐。",
    s2: "虚拟积分",
    s2body:
      "本站使用的积分为虚拟道具，不涉及任何真实金钱，无任何现实价值，无法购买、兑换、提现或转让。",
    s3: "AI 与数据",
    s3body1:
      "赛前前瞻、冷热门看点、赛后小结等由 AI 自动生成，得分奖励由社区数据动态计算，均仅供娱乐，不构成任何建议。",
    s3body2: "赛程与比分来自公开数据源，可能存在延迟或误差，请以官方公布为准。",
    s4: "无官方关联",
    s4body:
      "本站为非官方、球迷自制产品，与 FIFA、世界杯及任何赛事官方组织、球队、赞助商均无任何关联或授权。相关名称仅用于客观描述比赛。",
    s5: "责任限制",
    s5body:
      "在适用法律允许的范围内，本站对因使用本产品而产生的任何直接或间接损失不承担责任。继续使用本站即表示你已阅读并同意以上条款。",
    seeAlso: "另见：",
    about: "关于 & 玩法",
    privacy: "隐私政策",
  },
  en: {
    title: "Disclaimer · World Cup Predictor 2026",
    description:
      "World Cup Predictor disclaimer: a free, fan-made entertainment product. Virtual points have no real value and are non-redeemable. Not affiliated with or endorsed by FIFA or any official World Cup organization.",
    back: "← Back",
    h1: "Disclaimer",
    sub: "World Cup Predictor · 2026",
    s1: "For entertainment only",
    s1body: "This is a fan-made, just-for-fun product. All features and content are for entertainment only.",
    s2: "Virtual points",
    s2body:
      "Points on this site are virtual items with no real-world value. They involve no real money and cannot be bought, redeemed, withdrawn, or transferred.",
    s3: "AI & data",
    s3body1:
      "Match previews, talking points and recaps are generated automatically by AI, and scoring rewards are computed from community data — all for entertainment only and not advice of any kind.",
    s3body2:
      "Fixtures and scores come from public data sources and may be delayed or inaccurate; official announcements prevail.",
    s4: "No official affiliation",
    s4body:
      "This is an unofficial, fan-made product. It is not affiliated with, authorized by, or endorsed by FIFA, the World Cup, or any official tournament body, team, or sponsor. Such names are used only to describe the matches.",
    s5: "Limitation of liability",
    s5body:
      "To the extent permitted by applicable law, this site is not liable for any direct or indirect loss arising from use of this product. By continuing to use this site, you confirm that you have read and agree to the terms above.",
    seeAlso: "See also: ",
    about: "About & how to play",
    privacy: "Privacy policy",
  },
  es: {
    title: "Aviso legal · World Cup Predictor 2026",
    description:
      "Aviso legal de World Cup Predictor: un producto de entretenimiento gratuito hecho por aficionados. Los puntos virtuales no tienen valor real y no son canjeables. No está afiliado ni respaldado por la FIFA ni por ninguna organización oficial del Mundial.",
    back: "← Volver",
    h1: "Aviso legal",
    sub: "World Cup Predictor · 2026",
    s1: "Solo para entretenimiento",
    s1body: "Este es un producto hecho por aficionados, solo por diversión. Todas las funciones y contenidos son únicamente para entretenimiento.",
    s2: "Puntos virtuales",
    s2body:
      "Los puntos de este sitio son objetos virtuales sin valor en el mundo real. No implican dinero real y no se pueden comprar, canjear, retirar ni transferir.",
    s3: "IA y datos",
    s3body1:
      "Los avances de los partidos, los puntos de interés y los resúmenes se generan automáticamente con IA, y las recompensas de puntuación se calculan a partir de datos de la comunidad; todo es solo para entretenimiento y no constituye ningún tipo de consejo.",
    s3body2:
      "Los calendarios y marcadores provienen de fuentes de datos públicas y pueden tener retrasos o errores; prevalecen los anuncios oficiales.",
    s4: "Sin afiliación oficial",
    s4body:
      "Este es un producto no oficial hecho por aficionados. No está afiliado, autorizado ni respaldado por la FIFA, el Mundial ni ningún organismo oficial del torneo, equipo o patrocinador. Dichos nombres se usan solo para describir los partidos.",
    s5: "Limitación de responsabilidad",
    s5body:
      "En la medida permitida por la ley aplicable, este sitio no se hace responsable de ninguna pérdida directa o indirecta derivada del uso de este producto. Al seguir usando este sitio, confirmas que has leído y aceptas los términos anteriores.",
    seeAlso: "Ver también: ",
    about: "Acerca de y cómo jugar",
    privacy: "Política de privacidad",
  },
  pt: {
    title: "Aviso legal · World Cup Predictor 2026",
    description:
      "Aviso legal do World Cup Predictor: um produto de entretenimento gratuito feito por torcedores. Os pontos virtuais não têm valor real e não são resgatáveis. Não é afiliado nem endossado pela FIFA ou por qualquer organização oficial da Copa.",
    back: "← Voltar",
    h1: "Aviso legal",
    sub: "World Cup Predictor · 2026",
    s1: "Apenas para entretenimento",
    s1body: "Este é um produto feito por torcedores, só por diversão. Todos os recursos e conteúdos são apenas para entretenimento.",
    s2: "Pontos virtuais",
    s2body:
      "Os pontos deste site são itens virtuais sem valor no mundo real. Não envolvem dinheiro real e não podem ser comprados, resgatados, sacados nem transferidos.",
    s3: "IA e dados",
    s3body1:
      "As prévias dos jogos, os destaques e os resumos são gerados automaticamente por IA, e as recompensas de pontuação são calculadas a partir de dados da comunidade — tudo apenas para entretenimento e não constitui qualquer tipo de aconselhamento.",
    s3body2:
      "As tabelas e os placares vêm de fontes de dados públicas e podem ter atrasos ou imprecisões; os anúncios oficiais prevalecem.",
    s4: "Sem afiliação oficial",
    s4body:
      "Este é um produto não oficial feito por torcedores. Não é afiliado, autorizado nem endossado pela FIFA, pela Copa do Mundo ou por qualquer órgão oficial do torneio, time ou patrocinador. Esses nomes são usados apenas para descrever os jogos.",
    s5: "Limitação de responsabilidade",
    s5body:
      "Na medida permitida pela lei aplicável, este site não se responsabiliza por qualquer perda direta ou indireta decorrente do uso deste produto. Ao continuar a usar este site, você confirma que leu e concorda com os termos acima.",
    seeAlso: "Veja também: ",
    about: "Sobre e como jogar",
    privacy: "Política de Privacidade",
  },
  de: {
    title: "Haftungsausschluss · World Cup Predictor 2026",
    description:
      "Haftungsausschluss von World Cup Predictor: ein kostenloses, von Fans erstelltes Unterhaltungsprodukt. Virtuelle Punkte haben keinen realen Wert und sind nicht einlösbar. Nicht mit der FIFA oder einer offiziellen WM-Organisation verbunden oder von ihr unterstützt.",
    back: "← Zurück",
    h1: "Haftungsausschluss",
    sub: "World Cup Predictor · 2026",
    s1: "Nur zur Unterhaltung",
    s1body: "Dies ist ein von Fans erstelltes Produkt, nur zum Spaß. Alle Funktionen und Inhalte dienen ausschließlich der Unterhaltung.",
    s2: "Virtuelle Punkte",
    s2body:
      "Die Punkte auf dieser Website sind virtuelle Gegenstände ohne realen Wert. Sie sind nicht mit echtem Geld verbunden und können nicht gekauft, eingelöst, ausgezahlt oder übertragen werden.",
    s3: "KI & Daten",
    s3body1:
      "Spielvorschauen, Höhepunkte und Zusammenfassungen werden automatisch von KI erstellt, und Punktebelohnungen werden aus Community-Daten berechnet – alles dient ausschließlich der Unterhaltung und stellt keine Beratung dar.",
    s3body2:
      "Spielpläne und Ergebnisse stammen aus öffentlichen Datenquellen und können verzögert oder fehlerhaft sein; offizielle Bekanntmachungen haben Vorrang.",
    s4: "Keine offizielle Verbindung",
    s4body:
      "Dies ist ein inoffizielles, von Fans erstelltes Produkt. Es steht in keiner Verbindung zur FIFA, zur Weltmeisterschaft oder zu offiziellen Turniergremien, Teams oder Sponsoren und wird von diesen weder autorisiert noch unterstützt. Entsprechende Namen werden ausschließlich zur Beschreibung der Spiele verwendet.",
    s5: "Haftungsbeschränkung",
    s5body:
      "Soweit nach geltendem Recht zulässig, übernehmen wir keine Haftung für direkte oder indirekte Schäden, die aus der Nutzung dieses Produkts entstehen. Unberührt bleibt die Haftung für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit. Durch die weitere Nutzung dieser Website bestätigst du, dass du die obigen Bedingungen gelesen hast und ihnen zustimmst.",
    seeAlso: "Siehe auch: ",
    about: "Über & Spielanleitung",
    privacy: "Datenschutzerklärung",
  },
  fr: {
    title: "Mentions légales · World Cup Predictor 2026",
    description:
      "Mentions légales de World Cup Predictor : un produit de divertissement gratuit créé par des fans. Les points virtuels n'ont aucune valeur réelle et ne sont pas échangeables. Non affilié ni approuvé par la FIFA ou toute organisation officielle de la Coupe du monde.",
    back: "← Retour",
    h1: "Mentions légales",
    sub: "World Cup Predictor · 2026",
    s1: "À but de divertissement uniquement",
    s1body: "Il s'agit d'un produit créé par des fans, juste pour le plaisir. Toutes les fonctionnalités et tous les contenus sont uniquement à but de divertissement.",
    s2: "Points virtuels",
    s2body:
      "Les points de ce site sont des objets virtuels sans valeur dans le monde réel. Ils n'impliquent aucun argent réel et ne peuvent être achetés, échangés, retirés ni transférés.",
    s3: "IA et données",
    s3body1:
      "Les aperçus des matchs, les points forts et les résumés sont générés automatiquement par IA, et les récompenses de score sont calculées à partir de données communautaires — le tout sert uniquement au divertissement et ne constitue en aucun cas un conseil.",
    s3body2:
      "Les calendriers et les scores proviennent de sources de données publiques et peuvent être retardés ou inexacts ; les annonces officielles font foi.",
    s4: "Aucune affiliation officielle",
    s4body:
      "Il s'agit d'un produit non officiel créé par des fans. Il n'est ni affilié, ni autorisé, ni approuvé par la FIFA, la Coupe du monde ou tout organisme officiel du tournoi, toute équipe ou tout sponsor. Ces noms sont utilisés uniquement pour décrire les matchs.",
    s5: "Limitation de responsabilité",
    s5body:
      "Dans la mesure permise par la loi applicable, nous déclinons toute responsabilité pour les dommages directs ou indirects résultant de l'utilisation de ce produit. Cette limitation ne s'applique pas en cas de faute intentionnelle ou de faute lourde, ni en cas de dommages corporels. En continuant à utiliser ce site, vous confirmez avoir lu et accepté les conditions ci-dessus.",
    seeAlso: "Voir aussi : ",
    about: "À propos et comment jouer",
    privacy: "Politique de confidentialité",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const c = COPY[locale];
  return {
    title: c.title,
    description: c.description,
    alternates: localizedAlternates("/disclaimer", locale),
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="font-head mb-2 text-sm font-semibold text-green md:text-base">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-text/90 md:text-base">{children}</div>
    </section>
  );
}

export default async function DisclaimerPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  return (
    <PageContainer tier="prose">
      <Link href={localeHref(locale, "/")} className="text-xs text-muted">
        {c.back}
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold md:text-3xl">{c.h1}</h1>
      <p className="mt-1 text-xs text-muted">{c.sub}</p>

      <div className="mt-5 space-y-4">
        <Section title={c.s1}>
          <p>{c.s1body}</p>
        </Section>

        <Section title={c.s2}>
          <p>{c.s2body}</p>
        </Section>

        <Section title={c.s3}>
          <p>{c.s3body1}</p>
          <p>{c.s3body2}</p>
        </Section>

        <Section title={c.s4}>
          <p>{c.s4body}</p>
        </Section>

        <Section title={c.s5}>
          <p>{c.s5body}</p>
        </Section>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted md:text-xs">
        {c.seeAlso}
        <Link href={localeHref(locale, "/about")} className="underline hover:text-text">
          {c.about}
        </Link>
        {" · "}
        <Link href={localeHref(locale, "/privacy")} className="underline hover:text-text">
          {c.privacy}
        </Link>
      </p>
    </PageContainer>
  );
}
