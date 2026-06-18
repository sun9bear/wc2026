import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { localeHref } from "@/i18n";
import { localizedAlternates } from "@/lib/seo/canonical";
import { PageContainer } from "@/components/PageContainer";

// 双语隐私政策：/privacy 出英文、/zh/privacy 出中文，使既有 reciprocal hreflang 成立
// （与 /disclaimer、/about 同等待遇——避免「根 URL 声明 en 却渲染中文」的 hreflang/内容矛盾）。
// ⚠️ es/pt/de/fr 法务文案为忠实翻译（镜像 en 含义）；de/fr 辖区建议上线后过母语/法务复核再视为定稿。
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
  es: {
    title: "Política de privacidad · WorldCup Predictor",
    description:
      "Política de privacidad de WorldCup Predictor: qué información recopilamos, cómo usamos las cookies y detalles sobre la publicidad de terceros (Google AdSense).",
  },
  pt: {
    title: "Política de Privacidade · WorldCup Predictor",
    description:
      "Política de privacidade do WorldCup Predictor: que informações coletamos, como usamos cookies e detalhes sobre a publicidade de terceiros (Google AdSense).",
  },
  de: {
    title: "Datenschutzerklärung · WorldCup Predictor",
    description:
      "Datenschutzerklärung von WorldCup Predictor: welche Informationen wir erfassen, wie wir Cookies verwenden und Details zur Werbung von Drittanbietern (Google AdSense).",
  },
  fr: {
    title: "Politique de confidentialité · WorldCup Predictor",
    description:
      "Politique de confidentialité de WorldCup Predictor : quelles informations nous collectons, comment nous utilisons les cookies et des détails sur la publicité tierce (Google AdSense).",
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
  es: {
    back: "← Volver",
    h1: "Política de privacidad",
    updated: "Última actualización: junio de 2026",
    overviewH: "Resumen",
    overviewP:
      "Esta política explica qué información recopila WorldCup Predictor (el «Sitio») cuando lo usas, cómo se utiliza esa información y detalles sobre la publicidad de terceros y las cookies. El Sitio es un juego gratuito, sin dinero, con fines de entretenimiento.",
    collectH: "Información que recopilamos",
    collectP1:
      "El Sitio usa inicio de sesión anónimo y no recopila información de identificación personal como tu nombre, correo electrónico o número de teléfono.",
    collectP2:
      "Para ofrecer el juego, almacenamos datos de juego vinculados a tu cuenta anónima (como tus predicciones, tu saldo de puntos virtuales y tu historial de registro diario), además de registros de acceso básicos usados para seguridad y estadísticas.",
    cookiesH: "Cookies y almacenamiento local",
    cookiesP:
      "El Sitio usa cookies / almacenamiento local del navegador para mantener tu sesión iniciada, recordar tus preferencias y mejorar tu experiencia. Puedes borrar o restringir este almacenamiento en tu navegador, pero algunas funciones podrían dejar de funcionar.",
    adsH: "Publicidad de terceros (Google AdSense)",
    adsP1: "El Sitio usa el proveedor de publicidad de terceros Google AdSense para mostrar anuncios.",
    adsP2:
      "Google y otros proveedores externos usan cookies para mostrar anuncios según tus visitas a este y otros sitios web.",
    adsBefore: "Puedes visitar ",
    adsLink1: "Configuración de anuncios de Google",
    adsMid: " para desactivar los anuncios personalizados, o visitar ",
    adsLink2: "aboutads.info",
    adsAfter: " para saber cómo desactivar las cookies publicitarias de proveedores externos.",
    storageH: "Almacenamiento y seguridad de los datos",
    storageP1:
      "El Sitio está alojado en servicios en la nube en el extranjero (Vercel / Supabase). Tomamos medidas razonables para proteger los datos, pero ninguna transmisión por internet puede garantizarse como completamente segura.",
    storageP2: "El Sitio no vende tu información a terceros.",
    childrenH: "Menores",
    childrenP:
      "El Sitio es un producto de entretenimiento para el público general y no se dirige a menores de 13 años ni recopila su información.",
    updatesH: "Actualizaciones y contacto",
    updatesP1: "Esta política puede actualizarse de vez en cuando; las actualizaciones se publicarán en esta página.",
    contact: "¿Preguntas? Contacto:",
  },
  pt: {
    back: "← Voltar",
    h1: "Política de Privacidade",
    updated: "Última atualização: junho de 2026",
    overviewH: "Visão geral",
    overviewP:
      "Esta política explica quais informações o WorldCup Predictor (o «Site») coleta quando você o usa, como essas informações são usadas e detalhes sobre a publicidade de terceiros e os cookies. O Site é um jogo gratuito, sem dinheiro, para entretenimento.",
    collectH: "Informações que coletamos",
    collectP1:
      "O Site usa login anônimo e não coleta informações de identificação pessoal, como nome, e-mail ou número de telefone.",
    collectP2:
      "Para oferecer o jogo, armazenamos dados de jogo vinculados à sua conta anônima (como suas previsões, seu saldo de pontos virtuais e seu histórico de check-in), além de registros de acesso básicos usados para segurança e estatísticas.",
    cookiesH: "Cookies e armazenamento local",
    cookiesP:
      "O Site usa cookies / armazenamento local do navegador para manter você conectado, lembrar suas preferências e melhorar sua experiência. Você pode limpar ou restringir esse armazenamento no navegador, mas alguns recursos podem parar de funcionar.",
    adsH: "Publicidade de terceiros (Google AdSense)",
    adsP1: "O Site usa o provedor de publicidade de terceiros Google AdSense para exibir anúncios.",
    adsP2:
      "O Google e outros fornecedores terceiros usam cookies para exibir anúncios com base nas suas visitas a este e a outros sites.",
    adsBefore: "Você pode acessar ",
    adsLink1: "Configurações de anúncios do Google",
    adsMid: " para desativar os anúncios personalizados, ou acessar ",
    adsLink2: "aboutads.info",
    adsAfter: " para saber como desativar os cookies de publicidade de fornecedores terceiros.",
    storageH: "Armazenamento e segurança dos dados",
    storageP1:
      "O Site é hospedado em serviços de nuvem no exterior (Vercel / Supabase). Tomamos medidas razoáveis para proteger os dados, mas nenhuma transmissão pela internet pode ser garantida como totalmente segura.",
    storageP2: "O Site não vende suas informações a terceiros.",
    childrenH: "Crianças",
    childrenP:
      "O Site é um produto de entretenimento para o público geral e não se destina a crianças menores de 13 anos nem coleta suas informações.",
    updatesH: "Atualizações e contato",
    updatesP1: "Esta política pode ser atualizada periodicamente; as atualizações serão publicadas nesta página.",
    contact: "Dúvidas? Contato:",
  },
  de: {
    back: "← Zurück",
    h1: "Datenschutzerklärung",
    updated: "Zuletzt aktualisiert: Juni 2026",
    overviewH: "Überblick",
    overviewP:
      "Diese Erklärung beschreibt, welche Informationen WorldCup Predictor (die „Website“) bei der Nutzung erfasst, wie diese Informationen verwendet werden, sowie Details zu Werbung von Drittanbietern und Cookies. Die Website ist ein kostenloses Unterhaltungsspiel, bei dem es nicht um echtes Geld geht.",
    collectH: "Welche Informationen wir erfassen",
    collectP1:
      "Die Website verwendet eine anonyme Anmeldung und erfasst keine personenbezogenen Daten wie deinen Namen, deine E-Mail-Adresse oder deine Telefonnummer.",
    collectP2:
      "Um das Spiel bereitzustellen, speichern wir mit deinem anonymen Konto verknüpfte Spieldaten (wie deine Vorhersagen, deinen Punktestand und deinen Check-in-Verlauf) sowie grundlegende Zugriffsprotokolle für Sicherheit und Statistik.",
    cookiesH: "Cookies & lokaler Speicher",
    cookiesP:
      "Die Website verwendet Cookies / lokalen Browserspeicher, um dich angemeldet zu halten, Einstellungen zu speichern und dein Erlebnis zu verbessern. Du kannst diesen Speicher im Browser löschen oder einschränken, einige Funktionen stehen dann jedoch möglicherweise nicht mehr zur Verfügung.",
    adsH: "Werbung von Drittanbietern (Google AdSense)",
    adsP1: "Die Website nutzt den Drittanbieter Google AdSense, um Werbung anzuzeigen.",
    adsP2:
      "Google und andere Drittanbieter verwenden Cookies, um Werbung basierend auf deinen Besuchen dieser und anderer Websites auszuspielen.",
    adsBefore: "Du kannst die ",
    adsLink1: "Google-Anzeigeneinstellungen",
    adsMid: " aufrufen, um personalisierte Werbung zu deaktivieren, oder ",
    adsLink2: "aboutads.info",
    adsAfter: " besuchen, um zu erfahren, wie du die Werbe-Cookies von Drittanbietern deaktivierst.",
    storageH: "Datenspeicherung & Sicherheit",
    storageP1:
      "Die Website wird über Cloud-Dienste (Vercel / Supabase) bereitgestellt, deren Server sich außerhalb der EU, unter anderem in den USA, befinden. Bei dieser Übermittlung in Drittländer stützen wir uns auf geeignete Garantien wie die Standardvertragsklauseln der EU-Kommission. Wir treffen angemessene Maßnahmen zum Schutz der Daten, doch eine vollständig sichere Übertragung über das Internet kann nicht garantiert werden.",
    storageP2: "Die Website verkauft deine Daten nicht an Dritte.",
    childrenH: "Kinder",
    childrenP:
      "Die Website ist ein Unterhaltungsangebot für ein allgemeines Publikum. Sie richtet sich nicht an Kinder unter 16 Jahren und erfasst wissentlich keine Daten von ihnen.",
    updatesH: "Aktualisierungen & Kontakt",
    updatesP1: "Diese Erklärung kann von Zeit zu Zeit aktualisiert werden; Aktualisierungen werden auf dieser Seite veröffentlicht.",
    contact: "Fragen? Kontakt:",
  },
  fr: {
    back: "← Retour",
    h1: "Politique de confidentialité",
    updated: "Dernière mise à jour : juin 2026",
    overviewH: "Aperçu",
    overviewP:
      "Cette politique explique quelles informations WorldCup Predictor (le « Site ») collecte lorsque vous l'utilisez, comment ces informations sont utilisées, ainsi que des détails sur la publicité tierce et les cookies. Le Site est un jeu gratuit, sans argent réel, à but de divertissement.",
    collectH: "Informations que nous collectons",
    collectP1:
      "Le Site utilise une connexion anonyme et ne collecte pas de données personnelles permettant de vous identifier, telles que votre nom, votre adresse e-mail ou votre numéro de téléphone.",
    collectP2:
      "Pour fournir le jeu, nous conservons des données de jeu liées à votre compte anonyme (comme vos prédictions, votre solde de points virtuels et votre historique de connexion quotidienne), ainsi que des journaux d'accès de base utilisés pour la sécurité et les statistiques.",
    cookiesH: "Cookies et stockage local",
    cookiesP:
      "Le Site utilise des cookies / le stockage local du navigateur pour vous maintenir connecté, mémoriser vos préférences et améliorer votre expérience. Vous pouvez effacer ou restreindre ce stockage dans votre navigateur, mais certaines fonctionnalités risquent de ne plus fonctionner.",
    adsH: "Publicité tierce (Google AdSense)",
    adsP1: "Le Site utilise le fournisseur de publicité tiers Google AdSense pour afficher des annonces.",
    adsP2:
      "Google et d'autres fournisseurs tiers utilisent des cookies pour diffuser des annonces en fonction de vos visites sur ce site et d'autres.",
    adsBefore: "Vous pouvez consulter ",
    adsLink1: "les paramètres des annonces Google",
    adsMid: " pour désactiver les annonces personnalisées, ou consulter ",
    adsLink2: "aboutads.info",
    adsAfter: " pour savoir comment désactiver les cookies publicitaires des fournisseurs tiers.",
    storageH: "Stockage et sécurité des données",
    storageP1:
      "Le Site est hébergé sur des services cloud (Vercel / Supabase) dont les serveurs sont situés hors de l'Union européenne, notamment aux États-Unis. Pour ces transferts vers des pays tiers, nous nous appuyons sur des garanties appropriées telles que les clauses contractuelles types de la Commission européenne. Nous prenons des mesures raisonnables pour protéger les données, mais aucune transmission sur Internet ne peut être totalement sécurisée.",
    storageP2: "Le Site ne vend pas vos informations à des tiers.",
    childrenH: "Enfants",
    childrenP:
      "Le Site est un produit de divertissement tout public ; il ne s'adresse pas aux enfants de moins de 15 ans et ne collecte pas leurs informations.",
    updatesH: "Mises à jour et contact",
    updatesP1: "Cette politique peut être mise à jour de temps à autre ; les mises à jour seront publiées sur cette page.",
    contact: "Des questions ? Contact :",
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
      <h2 className="font-head mb-2 text-sm font-semibold text-green md:text-base">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-text/90 md:text-base">{children}</div>
    </section>
  );
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  return (
    <PageContainer tier="prose">
      <Link href={localeHref(locale, "/")} className="text-xs text-muted">
        {c.back}
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold md:text-3xl">{c.h1}</h1>
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
    </PageContainer>
  );
}
