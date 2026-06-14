import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { localeHref, type Locale } from "@/i18n";
import { localizedAlternates } from "@/lib/seo/canonical";

const META: Record<Locale, { title: string; description: string }> = {
  zh: {
    title: "关于 & 玩法 · 环球足球预测",
    description:
      "一个免费、不涉及任何金钱的足球预测娱乐小游戏：用虚拟积分预测比赛、冲排行榜、解锁段位。仅供娱乐。",
  },
  en: {
    title: "About & How to Play · World Cup Predictor 2026",
    description:
      "A free football prediction game with no real money involved: predict matches with virtual points, climb the leaderboard, unlock ranks. For fun only.",
  },
  es: {
    title: "Acerca de y cómo jugar · World Cup Predictor 2026",
    description:
      "Un juego de predicciones de fútbol gratuito y sin dinero real: predice partidos con puntos virtuales, sube en la clasificación y desbloquea rangos. Solo por diversión.",
  },
  pt: {
    title: "Sobre e como jogar · World Cup Predictor 2026",
    description:
      "Um jogo de previsões de futebol gratuito e sem dinheiro real: preveja jogos com pontos virtuais, suba no ranking e desbloqueie níveis. Só por diversão.",
  },
  de: {
    title: "Über & Spielanleitung · World Cup Predictor 2026",
    description:
      "Ein kostenloses Fußball-Vorhersagespiel ohne echtes Geld: Sage Spiele mit virtuellen Punkten voraus, klettere im Ranking und schalte Ränge frei. Nur zum Spaß.",
  },
  fr: {
    title: "À propos et comment jouer · World Cup Predictor 2026",
    description:
      "Un jeu de prédictions de football gratuit et sans argent réel : prédis des matchs avec des points virtuels, grimpe au classement et débloque des rangs. Juste pour le plaisir.",
  },
};

// 正文模板化（原为 if(locale==="en") 整段双分支硬编码）：嵌 <strong> 的段落存为 JSX。
// 合规：倍率统一用「奖励率 / reward rate / Belohnungsrate / taux de récompense」等非博彩措辞（不用 odds/Quote/cote/cuota）。
interface AboutBody {
  back: string;
  h1: string;
  sub: string;
  whatTitle: string;
  what: React.ReactNode;
  howTitle: string;
  how: string[];
  rateTitle: string;
  rate: React.ReactNode;
  aiTitle: string;
  ai: React.ReactNode;
  importantTitle: string;
  important: React.ReactNode[];
  seeAlso: string;
  privacy: string;
  disclaimer: string;
}

const BODY: Record<Locale, AboutBody> = {
  zh: {
    back: "← 返回",
    h1: "关于 & 玩法",
    sub: "环球足球预测 · 2026",
    whatTitle: "这是什么",
    what: (
      <>
        「环球足球预测」是一个面向全球球迷的<strong>免费、纯娱乐</strong>足球预测小游戏。
        它<strong>不涉及任何真实金钱</strong>，只使用虚拟积分，让大家一起预测比赛、看谁眼光更准。
      </>
    ),
    howTitle: "怎么玩",
    how: [
      "1. 进入即获赠虚拟积分（无需注册手机号/邮箱，匿名即可玩）。",
      "2. 在比赛页选择你看好的结果（主胜 / 平局 / 客胜），投入一些虚拟积分。",
      "3. 比赛结束后，命中的预测会按当时锁定的倍率折算虚拟积分。",
      "4. 用积分冲排行榜、解锁段位、完成成就、每日签到攒连胜。",
    ],
    rateTitle: "关于倍率",
    rate: (
      <>
        倍率由社区的预测分布<strong>动态生成</strong>——越多人看好的结果倍率越低，冷门结果倍率越高，
        纯粹用来增加趣味和盘感，<strong>不代表任何真实概率或建议</strong>。
      </>
    ),
    aiTitle: "AI 趣味内容",
    ai: (
      <>
        赛前前瞻、冷热门看点、赛后小结由 AI 自动生成，<strong>仅供娱乐</strong>，
        不构成任何形式的建议。
      </>
    ),
    importantTitle: "重要说明",
    important: [
      (
        <>
          本站的积分为<strong>虚拟道具</strong>，<strong>无任何现实价值</strong>，
          无法购买、兑换、提现或转让，纯属球迷娱乐。
        </>
      ),
      "本站为独立运营的球迷自制娱乐产品。",
    ],
    seeAlso: "另见：",
    privacy: "隐私政策",
    disclaimer: "免责声明",
  },
  en: {
    back: "← Back",
    h1: "About & How to Play",
    sub: "World Cup Predictor · 2026",
    whatTitle: "What is this?",
    what: (
      <>
        World Cup Predictor is a <strong>free, just-for-fun</strong> football prediction game for
        fans worldwide. It involves <strong>no real money</strong> — only virtual points — so
        everyone can predict matches and see who reads the game best.
      </>
    ),
    howTitle: "How to play",
    how: [
      "1. You get free virtual points the moment you join (no phone/email — play anonymously).",
      "2. On any match page, pick the result you believe in (Home win / Draw / Away win) and put in some points.",
      "3. After the final whistle, correct predictions earn points at the reward rate locked when you submitted.",
      "4. Use points to climb the leaderboard, unlock ranks, earn achievements and keep a daily check-in streak.",
    ],
    rateTitle: "About reward rates",
    rate: (
      <>
        Reward rates are <strong>generated dynamically</strong> from how the community predicts —
        popular picks earn less, unpopular picks earn more. They exist purely for fun and{" "}
        <strong>do not represent real probabilities or advice</strong>.
      </>
    ),
    aiTitle: "AI content",
    ai: (
      <>
        Match previews, hot takes and recaps are AI-generated, <strong>for entertainment only</strong>,
        and do not constitute advice of any kind.
      </>
    ),
    importantTitle: "Important",
    important: [
      (
        <>
          Points are <strong>virtual items with no real-world value</strong>. They cannot be
          purchased, redeemed, withdrawn or transferred — this is fan entertainment, nothing more.
        </>
      ),
      "This is an independent, fan-made site for entertainment.",
    ],
    seeAlso: "See also: ",
    privacy: "Privacy",
    disclaimer: "Disclaimer",
  },
  es: {
    back: "← Volver",
    h1: "Acerca de y cómo jugar",
    sub: "World Cup Predictor · 2026",
    whatTitle: "¿Qué es esto?",
    what: (
      <>
        World Cup Predictor es un juego de predicciones de fútbol <strong>gratuito y solo por
        diversión</strong> para aficionados de todo el mundo. <strong>No implica dinero real</strong>{" "}
        — solo puntos virtuales — para que todos puedan predecir partidos y ver quién entiende mejor
        el juego.
      </>
    ),
    howTitle: "Cómo jugar",
    how: [
      "1. Recibes puntos virtuales gratis al unirte (sin teléfono ni correo — juega de forma anónima).",
      "2. En cualquier página de partido, elige el resultado en el que confías (victoria local / empate / victoria visitante) y pon algunos puntos.",
      "3. Tras el pitido final, las predicciones acertadas ganan puntos según la tasa de recompensa fijada al enviar.",
      "4. Usa los puntos para subir en la clasificación, desbloquear rangos, conseguir logros y mantener tu racha de registro diario.",
    ],
    rateTitle: "Sobre las tasas de recompensa",
    rate: (
      <>
        Las tasas de recompensa se <strong>generan dinámicamente</strong> según cómo predice la
        comunidad: las opciones populares ganan menos y las poco populares ganan más. Existen solo
        por diversión y <strong>no representan probabilidades reales ni consejos</strong>.
      </>
    ),
    aiTitle: "Contenido con IA",
    ai: (
      <>
        Los avances, los comentarios y los resúmenes se generan con IA, <strong>solo para
        entretenimiento</strong>, y no constituyen ningún tipo de consejo.
      </>
    ),
    importantTitle: "Importante",
    important: [
      (
        <>
          Los puntos son <strong>objetos virtuales sin valor en el mundo real</strong>. No se pueden
          comprar, canjear, retirar ni transferir — esto es entretenimiento para aficionados, nada
          más.
        </>
      ),
      "Este es un sitio independiente hecho por aficionados con fines de entretenimiento.",
    ],
    seeAlso: "Ver también: ",
    privacy: "Privacidad",
    disclaimer: "Aviso legal",
  },
  pt: {
    back: "← Voltar",
    h1: "Sobre e como jogar",
    sub: "World Cup Predictor · 2026",
    whatTitle: "O que é isto?",
    what: (
      <>
        World Cup Predictor é um jogo de previsões de futebol <strong>gratuito e só por
        diversão</strong> para torcedores do mundo todo. <strong>Não envolve dinheiro real</strong>{" "}
        — apenas pontos virtuais — para que todos possam prever jogos e ver quem entende melhor do
        jogo.
      </>
    ),
    howTitle: "Como jogar",
    how: [
      "1. Você ganha pontos virtuais grátis assim que entra (sem telefone nem e-mail — jogue de forma anônima).",
      "2. Em qualquer página de jogo, escolha o resultado em que acredita (vitória da casa / empate / vitória de fora) e coloque alguns pontos.",
      "3. Após o apito final, as previsões certas ganham pontos pela taxa de recompensa fixada no envio.",
      "4. Use os pontos para subir no ranking, desbloquear níveis, conquistar conquistas e manter sua sequência de check-in diário.",
    ],
    rateTitle: "Sobre as taxas de recompensa",
    rate: (
      <>
        As taxas de recompensa são <strong>geradas dinamicamente</strong> conforme a comunidade
        prevê: escolhas populares rendem menos e escolhas impopulares rendem mais. Existem apenas
        por diversão e <strong>não representam probabilidades reais nem aconselhamento</strong>.
      </>
    ),
    aiTitle: "Conteúdo com IA",
    ai: (
      <>
        As prévias, os comentários e os resumos são gerados por IA, <strong>apenas para
        entretenimento</strong>, e não constituem qualquer tipo de aconselhamento.
      </>
    ),
    importantTitle: "Importante",
    important: [
      (
        <>
          Os pontos são <strong>itens virtuais sem valor no mundo real</strong>. Não podem ser
          comprados, resgatados, sacados nem transferidos — isto é entretenimento para torcedores,
          nada mais.
        </>
      ),
      "Este é um site independente feito por torcedores para entretenimento.",
    ],
    seeAlso: "Veja também: ",
    privacy: "Privacidade",
    disclaimer: "Aviso legal",
  },
  de: {
    back: "← Zurück",
    h1: "Über & Spielanleitung",
    sub: "World Cup Predictor · 2026",
    whatTitle: "Was ist das?",
    what: (
      <>
        World Cup Predictor ist ein <strong>kostenloses Fußball-Vorhersagespiel nur zum
        Spaß</strong> für Fans weltweit. Es <strong>beinhaltet kein echtes Geld</strong> — nur
        virtuelle Punkte — damit alle Spiele vorhersagen und sehen können, wer das Spiel am besten
        einschätzt.
      </>
    ),
    howTitle: "So funktioniert's",
    how: [
      "1. Du erhältst beim Beitritt kostenlose virtuelle Punkte (ohne Telefon/E-Mail — spiele anonym).",
      "2. Wähle auf jeder Spielseite das Ergebnis, an das du glaubst (Heimsieg / Unentschieden / Auswärtssieg), und setze einige Punkte ein.",
      "3. Nach dem Schlusspfiff bringen richtige Vorhersagen Punkte zur Belohnungsrate, die beim Absenden festgelegt wurde.",
      "4. Nutze Punkte, um im Ranking aufzusteigen, Ränge freizuschalten, Erfolge zu sammeln und eine tägliche Check-in-Serie zu halten.",
    ],
    rateTitle: "Über die Belohnungsraten",
    rate: (
      <>
        Belohnungsraten werden <strong>dynamisch erzeugt</strong>, je nachdem, wie die Community
        tippt — beliebte Tipps bringen weniger, unbeliebte mehr. Sie dienen rein dem Spaß und{" "}
        <strong>stellen keine echten Wahrscheinlichkeiten oder Ratschläge dar</strong>.
      </>
    ),
    aiTitle: "KI-Inhalte",
    ai: (
      <>
        Spielvorschauen, Kommentare und Zusammenfassungen werden von KI erstellt, <strong>nur zur
        Unterhaltung</strong>, und stellen keinerlei Ratschlag dar.
      </>
    ),
    importantTitle: "Wichtig",
    important: [
      (
        <>
          Punkte sind <strong>virtuelle Gegenstände ohne realen Wert</strong>. Sie können nicht
          gekauft, eingelöst, ausgezahlt oder übertragen werden — das ist Fan-Unterhaltung, nicht
          mehr.
        </>
      ),
      "Dies ist eine unabhängige, von Fans erstellte Website zur Unterhaltung.",
    ],
    seeAlso: "Siehe auch: ",
    privacy: "Datenschutz",
    disclaimer: "Haftungsausschluss",
  },
  fr: {
    back: "← Retour",
    h1: "À propos et comment jouer",
    sub: "World Cup Predictor · 2026",
    whatTitle: "Qu'est-ce que c'est ?",
    what: (
      <>
        World Cup Predictor est un jeu de prédictions de football <strong>gratuit et juste pour le
        plaisir</strong> pour les fans du monde entier. Il <strong>n’implique aucun argent
        réel</strong> — seulement des points virtuels — pour que chacun puisse prédire les matchs et
        voir qui lit le mieux le jeu.
      </>
    ),
    howTitle: "Comment jouer",
    how: [
      "1. Tu reçois des points virtuels gratuits dès ton arrivée (sans téléphone ni e-mail — joue de façon anonyme).",
      "2. Sur n'importe quelle page de match, choisis le résultat auquel tu crois (victoire à domicile / nul / victoire à l'extérieur) et mise quelques points.",
      "3. Après le coup de sifflet final, les bonnes prédictions rapportent des points selon le taux de récompense fixé au moment de l'envoi.",
      "4. Utilise les points pour grimper au classement, débloquer des rangs, obtenir des succès et garder une série de connexions quotidiennes.",
    ],
    rateTitle: "À propos des taux de récompense",
    rate: (
      <>
        Les taux de récompense sont <strong>générés dynamiquement</strong> selon les prédictions de
        la communauté — les choix populaires rapportent moins, les choix impopulaires rapportent
        plus. Ils existent uniquement pour le plaisir et <strong>ne représentent pas de
        probabilités réelles ni de conseils</strong>.
      </>
    ),
    aiTitle: "Contenu IA",
    ai: (
      <>
        Les aperçus, les commentaires et les résumés sont générés par IA, <strong>uniquement à but
        de divertissement</strong>, et ne constituent aucun conseil.
      </>
    ),
    importantTitle: "Important",
    important: [
      (
        <>
          Les points sont des <strong>objets virtuels sans valeur dans le monde réel</strong>. Ils
          ne peuvent être achetés, échangés, retirés ni transférés — c’est du divertissement pour
          fans, rien de plus.
        </>
      ),
      "Ce site est indépendant, créé par des fans à des fins de divertissement.",
    ],
    seeAlso: "Voir aussi : ",
    privacy: "Confidentialité",
    disclaimer: "Mentions légales",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { ...(META[locale] ?? META.en), alternates: localizedAlternates("/about", locale) };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="font-head mb-2 text-sm font-semibold text-green">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-text/90">{children}</div>
    </section>
  );
}

export default async function AboutPage() {
  const locale = await getLocale();
  const c = BODY[locale] ?? BODY.en;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href={localeHref(locale, "/")} className="text-xs text-muted">
        {c.back}
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold">{c.h1}</h1>
      <p className="mt-1 text-xs text-muted">{c.sub}</p>

      <div className="mt-5 space-y-4">
        <Section title={c.whatTitle}>
          <p>{c.what}</p>
        </Section>

        <Section title={c.howTitle}>
          {c.how.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </Section>

        <Section title={c.rateTitle}>
          <p>{c.rate}</p>
        </Section>

        <Section title={c.aiTitle}>
          <p>{c.ai}</p>
        </Section>

        <Section title={c.importantTitle}>
          {c.important.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </Section>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted">
        {c.seeAlso}
        <Link href={localeHref(locale, "/privacy")} className="underline hover:text-text">
          {c.privacy}
        </Link>
        {" · "}
        <Link href={localeHref(locale, "/disclaimer")} className="underline hover:text-text">
          {c.disclaimer}
        </Link>
      </p>
    </main>
  );
}
