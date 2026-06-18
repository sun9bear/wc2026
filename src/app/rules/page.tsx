import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { localeHref } from "@/i18n";
import { localizedAlternates } from "@/lib/seo/canonical";
import { Disclaimer } from "@/components/Disclaimer";
import { PageContainer } from "@/components/PageContainer";

// 常青解释页：2026 新赛制 + 出线/第三名判据（最高需求×最低竞争长尾，最佳 AI 引用候选）。
// 判据严格对齐 src/lib/prob/standings.ts（已逐字核对 FIFA 规程）：组内相互战绩优先，第三名横排无相互战绩。

const COPY = {
  zh: {
    title: "2026 世界杯赛制与出线规则详解：48 队、12 组、8 个最佳第三名",
    description:
      "2026 世界杯新赛制完整说明：48 队分 12 组，每组前两名加 8 个最佳第三名晋级 32 强淘汰赛。含小组排名与最佳第三名的官方决胜判据。",
    h1: "2026 世界杯赛制与出线规则",
    tldr:
      "2026 世界杯共 48 支球队，分 12 个小组、每组 4 队。每组前两名（24 队）加上 12 个小组第三里最好的 8 个，共 32 队晋级新设的「32 强」淘汰赛。换句话说：一支球队可以输一场、平一场、小组排名第三，仍然出线——理论上甚至一路夺冠。",
    formatH: "赛制概览",
    formatBody:
      "全程 104 场比赛。小组赛阶段 12 组 × 4 队。小组赛后：每组前 2 名直接晋级（24 队）+ 12 个小组第三名中排名最高的 8 个（8 队）= 32 队进入 32 强（Round of 32），随后 16 强、8 强、4 强、决赛，均为单场淘汰。",
    groupH: "小组排名判据（相互战绩优先）",
    groupIntro: "同一小组内排名，依次比较：",
    groupList: [
      "全部小组赛积分（胜 3 分、平 1 分、负 0 分）。",
      "若有球队积分相同，先比这些同分球队「彼此之间」的：相互战绩积分 → 相互战绩净胜球 → 相互战绩进球。",
      "全部小组赛净胜球。",
      "全部小组赛进球总数。",
      "公平竞赛分（黄牌 −1、间接红牌 −3、直接红牌 −4、先黄后红 −5；扣分越少越靠前）。",
      "FIFA 世界排名；若仍无法区分，则抽签。",
    ],
    thirdH: "最佳第三名排名（12 取 8）",
    thirdIntro:
      "12 个小组第三名横向比较，取最好的 8 个晋级。由于它们来自不同小组、彼此没有交手，这里没有「相互战绩」一项，判据依次为：",
    thirdList: [
      "积分。",
      "净胜球。",
      "进球总数。",
      "公平竞赛分。",
      "FIFA 世界排名；仍并列则抽签。",
    ],
    thirdNote:
      "至于具体哪 8 个第三名、分别进入 32 强对阵表的哪个位置，由 FIFA 赛前确定的对照表按「哪些小组的第三名出线」的组合查表决定。",
    fairNote:
      "说明：公平竞赛分需要红黄牌数据。本站模型在缺少该数据时，以「模型实力评分」近似最末几项判据，页面均有标注——这对出线概率影响极小（只在前面所有判据都打平时才生效）。",
    ctaH: "我的队还能出线吗？",
    ctaBody:
      "用实时出线计算器改动任意剩余赛果，立刻看 12 个小组排名与最佳第三名榜如何变化；或直接看模型对每支球队的出线 / 夺冠概率。",
    calc: "🧮 打开第三名出线计算器 →",
    forecast: "📊 看出线 & 夺冠概率 →",
    back: "← 返回",
  },
  en: {
    title: "World Cup 2026 format & qualification rules explained (48 teams, 12 groups, 8 best thirds)",
    description:
      "How the new 2026 World Cup works: 48 teams in 12 groups, top two plus the 8 best third-placed teams advance to a 32-team knockout round. Includes the official group and best-third tie-breakers.",
    h1: "World Cup 2026 Format & Qualification Rules",
    tldr:
      "The 2026 World Cup has 48 teams in 12 groups of four. The top two of every group (24 teams) plus the 8 best third-placed teams advance to a new 32-team knockout round (the Round of 32). In other words: a team can lose one match, draw one, finish third in its group, and still advance — and in theory go on to win the whole thing.",
    formatH: "Format at a glance",
    formatBody:
      "104 matches in total. Group stage: 12 groups of 4. After the group stage, the top 2 of each group qualify directly (24 teams) plus the 8 highest-ranked of the 12 third-placed teams (8 teams) = 32 teams in the Round of 32, then the Round of 16, quarter-finals, semi-finals and final — all single-elimination.",
    groupH: "Group ranking tie-breakers (head-to-head first)",
    groupIntro: "Within a group, teams are ranked by, in order:",
    groupList: [
      "Most points in all group matches (win 3, draw 1, loss 0).",
      "If teams are level on points, the head-to-head record among only those tied teams is used first: head-to-head points then head-to-head goal difference then head-to-head goals scored.",
      "Goal difference across all group matches.",
      "Goals scored across all group matches.",
      "Fair-play points (yellow minus 1, indirect red minus 3, direct red minus 4, yellow-then-red minus 5; fewer deductions ranks higher).",
      "FIFA World Ranking; if still level, a drawing of lots.",
    ],
    thirdH: "Best third-placed teams (8 of 12 advance)",
    thirdIntro:
      "The 12 third-placed teams are compared across groups, and the best 8 advance. Because they come from different groups and have not played each other, there is no head-to-head step here; the criteria are, in order:",
    thirdList: [
      "Points.",
      "Goal difference.",
      "Goals scored.",
      "Fair-play points.",
      "FIFA World Ranking; a drawing of lots if still level.",
    ],
    thirdNote:
      "Exactly which 8 third-placed teams advance, and which Round-of-32 slot each takes, is set by a pre-determined FIFA table based on which groups' third-placed teams qualify.",
    fairNote:
      "Note: fair-play points require yellow/red-card data. Where that data is unavailable, this site's model approximates the lowest tie-breakers with its model strength rating (labelled on every page) — this barely affects advancement chances, since it only applies when every earlier criterion is tied.",
    ctaH: "Can my team still advance?",
    ctaBody:
      "Flip any remaining result in the live scenario calculator and instantly see how all 12 group tables and the best-thirds race change — or read the model's chance to advance and to win the title for every team.",
    calc: "🧮 Open the third-place scenario calculator →",
    forecast: "📊 See advancement & title probabilities →",
    back: "← Back",
  },
  // P2-2 staged：es/pt/de/fr 暂不被渲染（locale 仍 zh|en），激活加宽 Locale 后 COPY[locale] 自动启用。
  es: {
    title: "Formato y reglas de clasificación del Mundial 2026 explicados (48 equipos, 12 grupos, 8 mejores terceros)",
    description:
      "Cómo funciona el nuevo Mundial 2026: 48 equipos en 12 grupos; los dos primeros más los 8 mejores terceros avanzan a una fase eliminatoria de 32 equipos. Incluye los desempates oficiales de grupo y de mejores terceros.",
    h1: "Formato y reglas de clasificación del Mundial 2026",
    tldr:
      "El Mundial 2026 tiene 48 equipos en 12 grupos de cuatro. Los dos primeros de cada grupo (24 equipos) más los 8 mejores terceros avanzan a una nueva ronda eliminatoria de 32 equipos (los dieciseisavos). Dicho de otro modo: un equipo puede perder un partido, empatar otro, terminar tercero de su grupo y aun así avanzar — y en teoría llegar a ganarlo todo.",
    formatH: "El formato de un vistazo",
    formatBody:
      "104 partidos en total. Fase de grupos: 12 grupos de 4. Tras la fase de grupos, los 2 primeros de cada grupo se clasifican directamente (24 equipos) más los 8 mejor ubicados de los 12 terceros (8 equipos) = 32 equipos en los dieciseisavos, luego octavos, cuartos, semifinales y final — todo a eliminación directa.",
    groupH: "Desempates de la clasificación de grupo (enfrentamiento directo primero)",
    groupIntro: "Dentro de un grupo, los equipos se ordenan por, en orden:",
    groupList: [
      "Más puntos en todos los partidos de grupo (victoria 3, empate 1, derrota 0).",
      "Si hay equipos igualados a puntos, primero se usa el enfrentamiento directo solo entre esos equipos: puntos en el enfrentamiento directo, luego diferencia de goles particular, luego goles marcados en el enfrentamiento directo.",
      "Diferencia de goles en todos los partidos de grupo.",
      "Goles marcados en todos los partidos de grupo.",
      "Puntos de juego limpio (amarilla −1, roja indirecta −3, roja directa −4, amarilla y luego roja −5; menos deducciones, mejor posición).",
      "Ranking Mundial FIFA; si persiste el empate, sorteo.",
    ],
    thirdH: "Mejores terceros (8 de 12 avanzan)",
    thirdIntro:
      "Los 12 terceros se comparan entre grupos y los 8 mejores avanzan. Como vienen de grupos distintos y no se han enfrentado, aquí no hay paso de enfrentamiento directo; los criterios son, en orden:",
    thirdList: [
      "Puntos.",
      "Diferencia de goles.",
      "Goles marcados.",
      "Puntos de juego limpio.",
      "Ranking Mundial FIFA; sorteo si persiste el empate.",
    ],
    thirdNote:
      "Exactamente qué 8 terceros avanzan, y qué puesto ocupa cada uno en el cuadro de dieciseisavos, lo fija una tabla predeterminada de la FIFA según qué grupos aportan tercero clasificado.",
    fairNote:
      "Nota: los puntos de juego limpio requieren datos de tarjetas. Cuando esos datos no están disponibles, el modelo de este sitio aproxima los últimos desempates con su valoración de fuerza del modelo (indicada en cada página) — esto apenas afecta a las opciones de avanzar, ya que solo se aplica cuando todos los criterios anteriores están empatados.",
    ctaH: "¿Mi equipo aún puede avanzar?",
    ctaBody:
      "Cambia cualquier resultado pendiente en la calculadora de escenarios en vivo y verás al instante cómo cambian las 12 tablas de grupo y la carrera por los mejores terceros — o consulta la probabilidad del modelo de avanzar y de ganar el título para cada equipo.",
    calc: "🧮 Abre la calculadora de escenarios de terceros →",
    forecast: "📊 Ver probabilidades de avance y título →",
    back: "← Atrás",
  },
  pt: {
    title: "Formato e regras de classificação da Copa 2026 explicados (48 seleções, 12 grupos, 8 melhores terceiros)",
    description:
      "Como funciona a nova Copa de 2026: 48 seleções em 12 grupos; os dois primeiros mais os 8 melhores terceiros avançam para uma fase eliminatória de 32 seleções. Inclui os critérios oficiais de desempate de grupo e de melhores terceiros.",
    h1: "Formato e regras de classificação da Copa 2026",
    tldr:
      "A Copa de 2026 tem 48 seleções em 12 grupos de quatro. Os dois primeiros de cada grupo (24 seleções) mais os 8 melhores terceiros avançam para uma nova fase eliminatória de 32 seleções (a fase de 32). Em outras palavras: uma seleção pode perder um jogo, empatar outro, terminar em terceiro no grupo e ainda assim avançar — e, em tese, até ser campeã.",
    formatH: "O formato num relance",
    formatBody:
      "104 jogos no total. Fase de grupos: 12 grupos de 4. Após a fase de grupos, os 2 primeiros de cada grupo se classificam direto (24 seleções) mais os 8 melhores entre os 12 terceiros (8 seleções) = 32 seleções na fase de 32, depois oitavas, quartas, semifinais e final — tudo em jogo único.",
    groupH: "Critérios de desempate no grupo (confronto direto primeiro)",
    groupIntro: "Dentro de um grupo, as seleções são classificadas por, em ordem:",
    groupList: [
      "Mais pontos em todos os jogos do grupo (vitória 3, empate 1, derrota 0).",
      "Se houver seleções empatadas em pontos, usa-se primeiro o confronto direto apenas entre as empatadas: pontos no confronto direto, depois saldo de gols no confronto direto, depois gols marcados no confronto direto.",
      "Saldo de gols em todos os jogos do grupo.",
      "Gols marcados em todos os jogos do grupo.",
      "Pontos de fair play (amarelo −1, vermelho indireto −3, vermelho direto −4, amarelo seguido de vermelho −5; menos descontos fica à frente).",
      "Ranking Mundial da FIFA; se ainda houver empate, sorteio.",
    ],
    thirdH: "Melhores terceiros colocados (8 de 12 avançam)",
    thirdIntro:
      "Os 12 terceiros colocados são comparados entre os grupos, e os 8 melhores avançam. Como vêm de grupos diferentes e não se enfrentaram, aqui não há etapa de confronto direto; os critérios são, em ordem:",
    thirdList: [
      "Pontos.",
      "Saldo de gols.",
      "Gols marcados.",
      "Pontos de fair play.",
      "Ranking Mundial da FIFA; sorteio se ainda houver empate.",
    ],
    thirdNote:
      "Exatamente quais 8 terceiros avançam, e qual vaga cada um ocupa na chave da fase de 32, é definido por uma tabela pré-determinada da FIFA conforme quais grupos têm terceiro classificado.",
    fairNote:
      "Observação: os pontos de fair play exigem dados de cartões. Quando esses dados não estão disponíveis, o modelo do site aproxima os últimos critérios com seu índice de força do modelo (indicado em cada página) — isso quase não afeta as chances de avançar, pois só vale quando todos os critérios anteriores estão empatados.",
    ctaH: "Minha seleção ainda pode avançar?",
    ctaBody:
      "Mude qualquer resultado restante na calculadora de cenários ao vivo e veja na hora como mudam as 12 tabelas de grupo e a disputa pelos melhores terceiros — ou veja a probabilidade do modelo de avançar e de ser campeã para cada seleção.",
    calc: "🧮 Abra a calculadora de cenários dos terceiros →",
    forecast: "📊 Ver probabilidades de avanço e título →",
    back: "← Voltar",
  },
  de: {
    title: "WM 2026: Format & Qualifikationsregeln erklärt (48 Teams, 12 Gruppen, 8 beste Gruppendritte)",
    description:
      "So funktioniert die neue WM 2026: 48 Teams in 12 Gruppen; die zwei Ersten plus die 8 besten Gruppendritten erreichen eine K.-o.-Runde mit 32 Teams. Inklusive der offiziellen Gruppen- und Gruppendritten-Tiebreaker.",
    h1: "WM 2026: Format & Qualifikationsregeln",
    tldr:
      "Die WM 2026 hat 48 Teams in 12 Gruppen zu je vier. Die zwei Ersten jeder Gruppe (24 Teams) plus die 8 besten Gruppendritten erreichen eine neue K.-o.-Runde mit 32 Teams (das Sechzehntelfinale). Anders gesagt: Ein Team kann ein Spiel verlieren, eines unentschieden spielen, Gruppendritter werden und trotzdem weiterkommen — und theoretisch sogar den Titel holen.",
    formatH: "Das Format auf einen Blick",
    formatBody:
      "104 Spiele insgesamt. Gruppenphase: 12 Gruppen zu 4. Nach der Gruppenphase qualifizieren sich die 2 Ersten jeder Gruppe direkt (24 Teams) plus die 8 bestplatzierten der 12 Gruppendritten (8 Teams) = 32 Teams im Sechzehntelfinale, danach Achtelfinale, Viertelfinale, Halbfinale und Finale — alles im K.-o.-System.",
    groupH: "Tiebreaker der Gruppenwertung (direkter Vergleich zuerst)",
    groupIntro: "Innerhalb einer Gruppe werden die Teams gereiht nach, in dieser Reihenfolge:",
    groupList: [
      "Meiste Punkte aus allen Gruppenspielen (Sieg 3, Unentschieden 1, Niederlage 0).",
      "Bei Punktgleichheit zählt zuerst der direkte Vergleich nur unter den punktgleichen Teams: Punkte im direkten Vergleich, dann Tordifferenz im direkten Vergleich, dann erzielte Tore im direkten Vergleich.",
      "Tordifferenz aus allen Gruppenspielen.",
      "Erzielte Tore aus allen Gruppenspielen.",
      "Fair-Play-Punkte (Gelb −1, indirekte Rote −3, direkte Rote −4, Gelb-Rot −5; weniger Abzüge ist besser).",
      "FIFA-Weltrangliste; bei weiterhin Gleichstand das Los.",
    ],
    thirdH: "Beste Gruppendritte (8 von 12 kommen weiter)",
    thirdIntro:
      "Die 12 Gruppendritten werden gruppenübergreifend verglichen, und die besten 8 kommen weiter. Da sie aus verschiedenen Gruppen kommen und nicht gegeneinander gespielt haben, gibt es hier keinen direkten Vergleich; die Kriterien sind, in dieser Reihenfolge:",
    thirdList: [
      "Punkte.",
      "Tordifferenz.",
      "Erzielte Tore.",
      "Fair-Play-Punkte.",
      "FIFA-Weltrangliste; das Los bei weiterhin Gleichstand.",
    ],
    thirdNote:
      "Welche 8 Gruppendritten genau weiterkommen und welchen Sechzehntelfinal-Platz jeder einnimmt, legt eine vorab festgelegte FIFA-Tabelle fest — je nachdem, welche Gruppen einen Dritten stellen.",
    fairNote:
      "Hinweis: Fair-Play-Punkte brauchen Karten-Daten. Fehlen diese, nähert das Modell dieser Seite die letzten Tiebreaker mit seinem Modell-Stärkewert an (auf jeder Seite gekennzeichnet) — das beeinflusst die Weiterkommens-Chancen kaum, da es nur greift, wenn alle vorherigen Kriterien gleich sind.",
    ctaH: "Kann mein Team noch weiterkommen?",
    ctaBody:
      "Ändere ein beliebiges offenes Ergebnis im Live-Szenario-Rechner und sieh sofort, wie sich alle 12 Gruppentabellen und das Rennen um die besten Dritten ändern — oder lies die Modell-Chance jedes Teams auf Weiterkommen und Titel.",
    calc: "🧮 Szenario-Rechner für Gruppendritte öffnen →",
    forecast: "📊 Weiterkommens- & Titelchancen ansehen →",
    back: "← Zurück",
  },
  fr: {
    title: "Format et règles de qualification du Mondial 2026 expliqués (48 équipes, 12 groupes, 8 meilleurs troisièmes)",
    description:
      "Comment fonctionne le nouveau Mondial 2026 : 48 équipes en 12 groupes ; les deux premiers plus les 8 meilleurs troisièmes accèdent à une phase à élimination directe à 32 équipes. Avec les départages officiels de groupe et des meilleurs troisièmes.",
    h1: "Format et règles de qualification du Mondial 2026",
    tldr:
      "Le Mondial 2026 compte 48 équipes en 12 groupes de quatre. Les deux premiers de chaque groupe (24 équipes) plus les 8 meilleurs troisièmes accèdent à un nouveau tour à élimination directe à 32 équipes (les seizièmes de finale). Autrement dit : une équipe peut perdre un match, en faire match nul un autre, finir troisième de son groupe et tout de même se qualifier — et en théorie aller au bout.",
    formatH: "Le format en un coup d'œil",
    formatBody:
      "104 matchs au total. Phase de groupes : 12 groupes de 4. Après la phase de groupes, les 2 premiers de chaque groupe se qualifient directement (24 équipes) plus les 8 mieux classés des 12 troisièmes (8 équipes) = 32 équipes en seizièmes de finale, puis huitièmes, quarts, demi-finales et finale — le tout à élimination directe.",
    groupH: "Départages du classement de groupe (confrontation directe d'abord)",
    groupIntro: "Au sein d'un groupe, les équipes sont classées selon, dans l'ordre :",
    groupList: [
      "Le plus de points sur tous les matchs de groupe (victoire 3, nul 1, défaite 0).",
      "En cas d'égalité de points, on utilise d'abord la confrontation directe entre les seules équipes à égalité : points en confrontation directe, puis différence de buts particulière, puis buts marqués en confrontation directe.",
      "Différence de buts sur tous les matchs de groupe.",
      "Buts marqués sur tous les matchs de groupe.",
      "Points de fair-play (jaune −1, rouge indirect −3, rouge direct −4, jaune puis rouge −5 ; moins de pénalités, mieux classé).",
      "Classement mondial FIFA ; en cas d'égalité persistante, tirage au sort.",
    ],
    thirdH: "Meilleurs troisièmes (8 sur 12 se qualifient)",
    thirdIntro:
      "Les 12 troisièmes sont comparés entre les groupes, et les 8 meilleurs se qualifient. Comme ils viennent de groupes différents et ne se sont pas affrontés, il n'y a pas d'étape de confrontation directe ici ; les critères sont, dans l'ordre :",
    thirdList: [
      "Points.",
      "Différence de buts.",
      "Buts marqués.",
      "Points de fair-play.",
      "Classement mondial FIFA ; tirage au sort en cas d'égalité persistante.",
    ],
    thirdNote:
      "Quels 8 troisièmes se qualifient exactement, et quelle place chacun occupe dans le tableau des seizièmes, sont fixés par une grille FIFA prédéterminée selon les groupes dont le troisième se qualifie.",
    fairNote:
      "Note : les points de fair-play nécessitent les données de cartons. Lorsque ces données manquent, le modèle du site approxime les derniers départages avec son indice de force du modèle (indiqué sur chaque page) — cela n'affecte quasiment pas les chances de qualification, car il ne s'applique que si tous les critères précédents sont à égalité.",
    ctaH: "Mon équipe peut-elle encore se qualifier ?",
    ctaBody:
      "Modifie n'importe quel résultat restant dans le calculateur de scénarios en direct et vois aussitôt comment évoluent les 12 classements de groupe et la course aux meilleurs troisièmes — ou consulte la probabilité du modèle de se qualifier et de gagner le titre pour chaque équipe.",
    calc: "🧮 Ouvrir le calculateur de scénarios des troisièmes →",
    forecast: "📊 Voir les probabilités de qualification et de titre →",
    back: "← Retour",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const c = COPY[locale];
  return {
    title: c.title,
    description: c.description,
    alternates: localizedAlternates("/rules", locale),
  };
}

export default async function RulesPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  return (
    <PageContainer tier="prose">
      <Link href={localeHref(locale, "/")} className="text-xs text-muted">
        {c.back}
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold md:text-3xl">{c.h1}</h1>

      {/* 前置可提取答案 / TL;DR（GEO：答案前置 + 统计数字 + 年份）。 */}
      <p className="mt-3 rounded-lg border border-green/30 bg-surface p-4 text-sm leading-relaxed md:text-base">
        {c.tldr}
      </p>

      <section className="mt-6">
        <h2 className="font-head mb-2 text-sm font-semibold text-green md:text-base">{c.formatH}</h2>
        <p className="text-sm leading-relaxed text-text/90 md:text-base">{c.formatBody}</p>
      </section>

      <section className="mt-6">
        <h2 className="font-head mb-2 text-sm font-semibold text-green md:text-base">{c.groupH}</h2>
        <p className="mb-2 text-sm text-text/90 md:text-base">{c.groupIntro}</p>
        <ol className="ml-5 list-decimal space-y-1.5 text-sm leading-relaxed text-text/90 md:text-base">
          {c.groupList.map((li, i) => (
            <li key={i}>{li}</li>
          ))}
        </ol>
      </section>

      <section className="mt-6">
        <h2 className="font-head mb-2 text-sm font-semibold text-green md:text-base">{c.thirdH}</h2>
        <p className="mb-2 text-sm text-text/90 md:text-base">{c.thirdIntro}</p>
        <ol className="ml-5 list-decimal space-y-1.5 text-sm leading-relaxed text-text/90 md:text-base">
          {c.thirdList.map((li, i) => (
            <li key={i}>{li}</li>
          ))}
        </ol>
        <p className="mt-2 text-xs leading-relaxed text-muted md:text-sm">{c.thirdNote}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">{c.fairNote}</p>
      </section>

      <section className="mt-7 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-head mb-1 text-sm font-semibold md:text-base">{c.ctaH}</h2>
        <p className="text-sm leading-relaxed text-text/90 md:text-base">{c.ctaBody}</p>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          <Link
            href={localeHref(locale, "/calculator")}
            className="block rounded-md border border-green/50 px-3 py-2 text-sm font-semibold text-green"
          >
            {c.calc}
          </Link>
          <Link
            href={localeHref(locale, "/forecast")}
            className="block rounded-md border border-border px-3 py-2 text-sm text-text/90"
          >
            {c.forecast}
          </Link>
        </div>
      </section>

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </PageContainer>
  );
}
