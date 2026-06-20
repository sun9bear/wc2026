import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "@/i18n/server";
import { getTeamDetail, type TeamResult } from "@/lib/prob/getTeamDetail";
import { getForecast } from "@/lib/prob/pipeline";
import { getAdvanceRequirements } from "@/lib/prob/requirements";
import { getTeamSquad, type PositionGroup } from "@/lib/squad/getTeamSquad";
import { teamSlug, normalizeSlug } from "@/lib/prob/findTeam";
import { getSettledIndex } from "@/lib/seo/freshness";
import { JsonLd } from "@/lib/seo/jsonLd";
import { PageContainer } from "@/components/PageContainer";
import { HeaderShare } from "@/components/HeaderShare";
import { SetMyTeamButton } from "@/components/SetMyTeamButton";
import { LocalTime } from "@/components/LocalTime";
import { localeHref, type Locale, BCP47_LOCALE } from "@/i18n";
import { teamName } from "@/lib/football/teams";
import { localizedAlternates, selfUrl } from "@/lib/seo/canonical";
import { RelatedCommentary } from "@/components/RelatedCommentary";
import { getRelatedBlogByTeam, toBlogLocale } from "@/lib/blog/published";

export const maxDuration = 60;

const SITE = "https://www.wc2026.cool";

// 球队详情着陆页（任务 B）：出线/夺冠概率 + 模型实力评分(Elo) + 最近战绩 + 下一场 + 设为主队。
// 48 队 = 48 个 SEO 着陆页（进 sitemap）。实力评分对外只标「模型实力评分」，不写官方排名/身价（版权结论）。

const fmtP = (x: number) => {
  const v = x > 1 ? x : x * 100;
  return v >= 10 ? v.toFixed(0) : v.toFixed(1);
};

// C3：SportsTeam sameAs → 英文维基百科（最强 GEO 实体锚定信号）。键 = 球队 slug（与 sitemap 一致）。
// 仅收录确认无误的条目；未命中 → 不输出 sameAs（fail-closed，绝不指错实体）。
// US/CA/AU 用 "men's national soccer team"（football 在这些国家有歧义）；其余 "X national football team"
// 至少有重定向到现行男足条目，Google 解析 sameAs 时会跟随重定向。
const WIKI = "https://en.wikipedia.org/wiki/";
const TEAM_WIKI: Record<string, string> = {
  algeria: `${WIKI}Algeria_national_football_team`,
  argentina: `${WIKI}Argentina_national_football_team`,
  australia: `${WIKI}Australia_men%27s_national_soccer_team`,
  austria: `${WIKI}Austria_national_football_team`,
  belgium: `${WIKI}Belgium_national_football_team`,
  "bosnia-herzegovina": `${WIKI}Bosnia_and_Herzegovina_national_football_team`,
  brazil: `${WIKI}Brazil_national_football_team`,
  canada: `${WIKI}Canada_men%27s_national_soccer_team`,
  "cape-verde-islands": `${WIKI}Cape_Verde_national_football_team`,
  colombia: `${WIKI}Colombia_national_football_team`,
  "congo-dr": `${WIKI}DR_Congo_national_football_team`,
  croatia: `${WIKI}Croatia_national_football_team`,
  "curaçao": `${WIKI}Curaçao_national_football_team`,
  czechia: `${WIKI}Czech_Republic_national_football_team`,
  ecuador: `${WIKI}Ecuador_national_football_team`,
  egypt: `${WIKI}Egypt_national_football_team`,
  england: `${WIKI}England_national_football_team`,
  france: `${WIKI}France_national_football_team`,
  germany: `${WIKI}Germany_national_football_team`,
  ghana: `${WIKI}Ghana_national_football_team`,
  haiti: `${WIKI}Haiti_national_football_team`,
  iran: `${WIKI}Iran_national_football_team`,
  iraq: `${WIKI}Iraq_national_football_team`,
  "ivory-coast": `${WIKI}Ivory_Coast_national_football_team`,
  japan: `${WIKI}Japan_national_football_team`,
  jordan: `${WIKI}Jordan_national_football_team`,
  mexico: `${WIKI}Mexico_national_football_team`,
  morocco: `${WIKI}Morocco_national_football_team`,
  netherlands: `${WIKI}Netherlands_national_football_team`,
  "new-zealand": `${WIKI}New_Zealand_national_football_team`,
  norway: `${WIKI}Norway_national_football_team`,
  panama: `${WIKI}Panama_national_football_team`,
  paraguay: `${WIKI}Paraguay_national_football_team`,
  portugal: `${WIKI}Portugal_national_football_team`,
  qatar: `${WIKI}Qatar_national_football_team`,
  "saudi-arabia": `${WIKI}Saudi_Arabia_national_football_team`,
  scotland: `${WIKI}Scotland_national_football_team`,
  senegal: `${WIKI}Senegal_national_football_team`,
  "south-africa": `${WIKI}South_Africa_national_football_team`,
  "south-korea": `${WIKI}South_Korea_national_football_team`,
  spain: `${WIKI}Spain_national_football_team`,
  sweden: `${WIKI}Sweden_national_football_team`,
  switzerland: `${WIKI}Switzerland_national_football_team`,
  tunisia: `${WIKI}Tunisia_national_football_team`,
  turkey: `${WIKI}Turkey_national_football_team`,
  "united-states": `${WIKI}United_States_men%27s_national_soccer_team`,
  uruguay: `${WIKI}Uruguay_national_football_team`,
  uzbekistan: `${WIKI}Uzbekistan_national_football_team`,
};

const COPY = {
  zh: {
    back: "← 返回",
    title: (nm: string) => `${nm}还能出线吗？出线 & 夺冠概率 · 2026 世界杯`,
    desc: (nm: string, adv: string, champ: string) =>
      `${nm}在 2026 世界杯的实时出线概率 ${adv}%、夺冠概率 ${champ}%（万次蒙特卡洛模拟），含模型实力评分、最近战绩与下一场。免费、无需注册。`,
    advance: "出线概率",
    champion: "夺冠概率",
    rating: "模型实力评分",
    ratingNote: "实力评分 = 模型用的 Elo 评分（概率输入因子之一），非官方排名。",
    group: (x: string, r: number) => `${x} 组 · 当前第 ${r}`,
    recent: "最近战绩",
    noRecent: "暂无已完成的比赛",
    next: "下一场",
    noNext: "暂无后续赛程",
    home: "主",
    away: "客",
    W: "胜",
    D: "平",
    L: "负",
    calc: (nm: string) => `🧮 ${nm}还能怎样出线？打开计算器 →`,
    sims: "万次蒙特卡洛模拟（公开预测数据 + Elo 融合），每小时更新",
    latest: "最新赛果",
    lead: (nm: string, adv: string, champ: string, x: string) =>
      `2026 世界杯：${nm} 从 ${x} 组出线概率 ${adv}%、夺冠概率 ${champ}%（万次蒙特卡洛模拟）。`,
    shareText: (nm: string, adv: string) => `${nm} 出线概率 ${adv}%（2026 世界杯模型）`,
  },
  en: {
    back: "← Back",
    title: (nm: string) => `Can ${nm} still advance? · World Cup 2026`,
    desc: (nm: string, adv: string, champ: string) =>
      `${nm}'s live World Cup 2026 chance to advance ${adv}% and to win ${champ}% (10,000 Monte Carlo sims), with model strength rating, recent form and next match. Free, no sign-up.`,
    advance: "Chance to advance",
    champion: "Title chance",
    rating: "Model strength rating",
    ratingNote: "Strength rating = the Elo rating the model uses (one input to its probabilities), not an official ranking.",
    group: (x: string, r: number) => `Group ${x} · currently ${r}${["st", "nd", "rd"][r - 1] ?? "th"}`,
    recent: "Recent form",
    noRecent: "No completed matches yet",
    next: "Next match",
    noNext: "No upcoming fixtures",
    home: "H",
    away: "A",
    W: "W",
    D: "D",
    L: "L",
    calc: (nm: string) => `🧮 How can ${nm} still advance? Open the calculator →`,
    sims: "10,000 Monte Carlo simulations (public forecasting data + Elo), refreshed hourly",
    latest: "Latest result",
    lead: (nm: string, adv: string, champ: string, x: string) =>
      `At the 2026 World Cup, ${nm} has a ${adv}% chance to advance from Group ${x} and a ${champ}% chance to win the title, per a 10,000-run simulation.`,
    shareText: (nm: string, adv: string) => `${nm} has a ${adv}% chance to advance (World Cup 2026 model)`,
  },
  // P2-2 staged：es/pt/de/fr 暂不被渲染（locale 仍 zh|en），激活加宽 Locale 后 COPY[locale] 自动启用。
  // 注：ResultChip 的 locale 形参仍是 "zh"|"en"（A0 加宽项），队名 nm/oppName、"看X组/规则"链接、JsonLd 仍 locale 三元（A4），激活前 es/pt/de/fr 先回退英文分支（队名显英文名）。
  es: {
    back: "← Atrás",
    title: (nm: string) => `¿${nm} todavía puede clasificar? Probabilidad de avanzar y de título · Mundial 2026`,
    desc: (nm: string, adv: string, champ: string) =>
      `Probabilidad en vivo de ${nm} en el Mundial 2026: ${adv}% de avanzar y ${champ}% de ganar el título (10.000 simulaciones de Montecarlo), con valoración de fuerza del modelo, forma reciente y próximo partido. Gratis, sin registro.`,
    advance: "Probabilidad de avanzar",
    champion: "Probabilidad de título",
    rating: "Valoración de fuerza del modelo",
    ratingNote: "Valoración de fuerza = la puntuación Elo que usa el modelo (uno de los factores de sus probabilidades), no un ranking oficial.",
    group: (x: string, r: number) => `Grupo ${x} · actualmente ${r}.º`,
    recent: "Forma reciente",
    noRecent: "Aún no hay partidos disputados",
    next: "Próximo partido",
    noNext: "No hay próximos partidos",
    home: "C",
    away: "F",
    W: "V",
    D: "E",
    L: "D",
    calc: (nm: string) => `🧮 ¿Cómo puede ${nm} todavía clasificar? Abre la calculadora →`,
    sims: "10.000 simulaciones de Montecarlo (datos públicos de predicción + Elo), actualizadas cada hora",
    latest: "Último resultado",
    lead: (nm: string, adv: string, champ: string, x: string) =>
      `Mundial 2026: ${nm} tiene un ${adv}% de probabilidad de avanzar desde el Grupo ${x} y un ${champ}% de ganar el título (10.000 simulaciones de Montecarlo).`,
    shareText: (nm: string, adv: string) => `${nm} tiene un ${adv}% de probabilidad de avanzar (modelo Mundial 2026)`,
  },
  pt: {
    back: "← Voltar",
    title: (nm: string) => `${nm} ainda pode se classificar? Probabilidade de avanço e de título · Copa 2026`,
    desc: (nm: string, adv: string, champ: string) =>
      `Probabilidade ao vivo de ${nm} na Copa 2026: ${adv}% de avançar e ${champ}% de ganhar o título (10.000 simulações de Monte Carlo), com avaliação de força do modelo, desempenho recente e próximo jogo. Grátis, sem cadastro.`,
    advance: "Chance de avançar",
    champion: "Chance de título",
    rating: "Avaliação de força do modelo",
    ratingNote: "Avaliação de força = a pontuação Elo que o modelo usa (um dos fatores das suas probabilidades), não um ranking oficial.",
    group: (x: string, r: number) => `Grupo ${x} · atualmente ${r}.º`,
    recent: "Desempenho recente",
    noRecent: "Ainda não há jogos disputados",
    next: "Próximo jogo",
    noNext: "Sem próximos jogos",
    home: "C",
    away: "F",
    W: "V",
    D: "E",
    L: "D",
    calc: (nm: string) => `🧮 Como ${nm} ainda pode se classificar? Abra a calculadora →`,
    sims: "10.000 simulações de Monte Carlo (dados públicos de previsão + Elo), atualizadas a cada hora",
    latest: "Último resultado",
    lead: (nm: string, adv: string, champ: string, x: string) =>
      `Copa 2026: ${nm} tem ${adv}% de chance de avançar do Grupo ${x} e ${champ}% de ganhar o título (10.000 simulações de Monte Carlo).`,
    shareText: (nm: string, adv: string) => `${nm} tem ${adv}% de chance de avançar (modelo Copa 2026)`,
  },
  de: {
    back: "← Zurück",
    title: (nm: string) => `Kann ${nm} noch weiterkommen? Weiterkommen- & Titelchance · WM 2026`,
    desc: (nm: string, adv: string, champ: string) =>
      `Live-Chance von ${nm} bei der WM 2026: ${adv}% Weiterkommen und ${champ}% Titelgewinn (10.000 Monte-Carlo-Simulationen), mit Modell-Stärkewert, aktueller Form und nächstem Spiel. Kostenlos, ohne Anmeldung.`,
    advance: "Weiterkommen-Chance",
    champion: "Titelchance",
    rating: "Modell-Stärkewert",
    ratingNote: "Stärkewert = der Elo-Wert, den das Modell verwendet (einer der Faktoren seiner Wahrscheinlichkeiten), kein offizielles Ranking.",
    group: (x: string, r: number) => `Gruppe ${x} · aktuell ${r}.`,
    recent: "Aktuelle Form",
    noRecent: "Noch keine absolvierten Spiele",
    next: "Nächstes Spiel",
    noNext: "Keine anstehenden Spiele",
    home: "H",
    away: "A",
    W: "S",
    D: "U",
    L: "N",
    calc: (nm: string) => `🧮 Wie kann ${nm} noch weiterkommen? Rechner öffnen →`,
    sims: "10.000 Monte-Carlo-Simulationen (öffentliche Prognosedaten + Elo), stündlich aktualisiert",
    latest: "Letztes Ergebnis",
    lead: (nm: string, adv: string, champ: string, x: string) =>
      `WM 2026: ${nm} hat ${adv}% Chance auf das Weiterkommen aus Gruppe ${x} und ${champ}% auf den Titelgewinn (10.000 Monte-Carlo-Simulationen).`,
    shareText: (nm: string, adv: string) => `${nm} hat ${adv}% Chance auf das Weiterkommen (WM-2026-Modell)`,
  },
  fr: {
    back: "← Retour",
    title: (nm: string) => `${nm} peut-il encore se qualifier ? Probabilité de qualification et de titre · Mondial 2026`,
    desc: (nm: string, adv: string, champ: string) =>
      `Probabilité en direct de ${nm} au Mondial 2026 : ${adv}% de se qualifier et ${champ}% de remporter le titre (10 000 simulations de Monte-Carlo), avec note de force du modèle, forme récente et prochain match. Gratuit, sans inscription.`,
    advance: "Probabilité de qualification",
    champion: "Probabilité de titre",
    rating: "Note de force du modèle",
    ratingNote: "Note de force = la note Elo utilisée par le modèle (l'un des facteurs de ses probabilités), pas un classement officiel.",
    group: (x: string, r: number) => `Groupe ${x} · actuellement ${r}${r === 1 ? "er" : "e"}`,
    recent: "Forme récente",
    noRecent: "Aucun match disputé pour l'instant",
    next: "Prochain match",
    noNext: "Aucun match à venir",
    home: "Dom",
    away: "Ext",
    W: "V",
    D: "N",
    L: "D",
    calc: (nm: string) => `🧮 Comment ${nm} peut-il encore se qualifier ? Ouvre le calculateur →`,
    sims: "10 000 simulations de Monte-Carlo (données publiques de prévision + Elo), actualisées chaque heure",
    latest: "Dernier résultat",
    lead: (nm: string, adv: string, champ: string, x: string) =>
      `Mondial 2026 : ${nm} a ${adv}% de probabilité de se qualifier depuis le Groupe ${x} et ${champ}% de remporter le titre (10 000 simulations de Monte-Carlo).`,
    shareText: (nm: string, adv: string) => `${nm} a ${adv}% de probabilité de se qualifier (modèle Mondial 2026)`,
  },
} as const;

// 小组积分榜（复用 getForecast 的 group.table，高亮本队）。
const STANDINGS_COPY: Record<
  Locale,
  { h: (x: string) => string; cols: [string, string, string, string, string, string]; note: string }
> = {
  zh: { h: (x) => `${x} 组积分榜`, cols: ["#", "球队", "赛", "积分", "净胜", "出线"], note: "前两名直接出线；第三名进入「最佳第三名」榜竞争 8 个名额。出线概率来自万次蒙特卡洛模拟。" },
  en: { h: (x) => `Group ${x} table`, cols: ["#", "Team", "P", "Pts", "GD", "Adv"], note: "Top two advance directly; third place enters the best-thirds race for 8 spots. Advance chance from 10,000 Monte Carlo sims." },
  es: { h: (x) => `Clasificación del Grupo ${x}`, cols: ["#", "Equipo", "PJ", "Pts", "DG", "Avan"], note: "Los dos primeros avanzan directo; el tercero entra en la carrera por los 8 mejores terceros. Probabilidad de 10.000 simulaciones de Montecarlo." },
  pt: { h: (x) => `Classificação do Grupo ${x}`, cols: ["#", "Seleção", "J", "Pts", "SG", "Avan"], note: "Os dois primeiros avançam direto; o terceiro entra na disputa pelos 8 melhores terceiros. Probabilidade de 10.000 simulações de Monte Carlo." },
  de: { h: (x) => `Tabelle Gruppe ${x}`, cols: ["#", "Team", "Sp", "Pkt", "TD", "Chance"], note: "Die zwei Ersten kommen direkt weiter; der Dritte kämpft um die 8 besten Gruppendritten. Chance aus 10.000 Monte-Carlo-Simulationen." },
  fr: { h: (x) => `Classement du Groupe ${x}`, cols: ["#", "Équipe", "J", "Pts", "Diff", "Qual"], note: "Les deux premiers se qualifient directement ; le troisième entre dans la course aux 8 meilleurs troisièmes. Probabilité issue de 10 000 simulations de Monte-Carlo." },
};

// 官方阵容（读 squad_* 表）。
const SQUAD_COPY: Record<
  Locale,
  {
    h: string;
    coach: string;
    avgAge: string;
    avgHt: string;
    caps: string;
    pos: Record<PositionGroup, string>;
    cols: { player: string; club: string; age: string; caps: string; goals: string };
    note: string;
  }
> = {
  zh: {
    h: "官方阵容", coach: "主教练", avgAge: "平均年龄", avgHt: "平均身高", caps: "总出场",
    pos: { GK: "门将", DF: "后卫", MF: "中场", FW: "前锋" },
    cols: { player: "球员", club: "俱乐部", age: "年龄", caps: "出场", goals: "进球" },
    note: "各队官方公布的 2026 世界杯 26 人名单；出场与进球为国家队生涯累计。",
  },
  en: {
    h: "Official squad", coach: "Head coach", avgAge: "Avg age", avgHt: "Avg height", caps: "Total caps",
    pos: { GK: "Goalkeepers", DF: "Defenders", MF: "Midfielders", FW: "Forwards" },
    cols: { player: "Player", club: "Club", age: "Age", caps: "Caps", goals: "Goals" },
    note: "Official 26-player World Cup 2026 squad; caps and goals are career totals for the national team.",
  },
  es: {
    h: "Plantilla oficial", coach: "Seleccionador", avgAge: "Edad media", avgHt: "Altura media", caps: "Internac.",
    pos: { GK: "Porteros", DF: "Defensas", MF: "Centrocampistas", FW: "Delanteros" },
    cols: { player: "Jugador", club: "Club", age: "Edad", caps: "Part.", goals: "Goles" },
    note: "Lista oficial de 26 jugadores para el Mundial 2026; partidos y goles son totales con la selección.",
  },
  pt: {
    h: "Elenco oficial", coach: "Técnico", avgAge: "Idade média", avgHt: "Altura média", caps: "Jogos",
    pos: { GK: "Goleiros", DF: "Defensores", MF: "Meio-campistas", FW: "Atacantes" },
    cols: { player: "Jogador", club: "Clube", age: "Idade", caps: "Jogos", goals: "Gols" },
    note: "Lista oficial de 26 jogadores para a Copa 2026; jogos e gols são totais pela seleção.",
  },
  de: {
    h: "Offizieller Kader", coach: "Cheftrainer", avgAge: "Ø Alter", avgHt: "Ø Größe", caps: "Länderspiele",
    pos: { GK: "Torhüter", DF: "Abwehr", MF: "Mittelfeld", FW: "Sturm" },
    cols: { player: "Spieler", club: "Verein", age: "Alter", caps: "Sp.", goals: "Tore" },
    note: "Offizieller 26-Mann-Kader für die WM 2026; Länderspiele und Tore sind Karrierewerte für die Nationalmannschaft.",
  },
  fr: {
    h: "Effectif officiel", coach: "Sélectionneur", avgAge: "Âge moyen", avgHt: "Taille moy.", caps: "Sélections",
    pos: { GK: "Gardiens", DF: "Défenseurs", MF: "Milieux", FW: "Attaquants" },
    cols: { player: "Joueur", club: "Club", age: "Âge", caps: "Sél.", goals: "Buts" },
    note: "Liste officielle de 26 joueurs pour le Mondial 2026 ; sélections et buts sont les totaux en équipe nationale.",
  },
};

// B2：出线门槛 prose（复用 getAdvanceRequirements 缓存的蒙卡门槛，渲染成可被搜索/AI 抓取的服务端文字）。
const REQ_COPY: Record<
  Locale,
  {
    h: (nm: string) => string;
    already: (nm: string) => string;
    clinch: (nm: string, pts: number, gd: string, need: number) => string;
    depends: (nm: string) => string;
    outcome: (rec: string, p: number, rank: string) => string;
    rank: (lo: number, hi: number) => string;
    W: string;
    D: string;
    L: string;
  }
> = {
  zh: {
    h: (nm) => `${nm}还能怎样出线？`,
    already: (nm) => `${nm}已经锁定 32 强席位。`,
    clinch: (nm, pts, gd, need) => `${nm}只要拿到 ${pts} 分（净胜球 ${gd}）即可锁定出线，目前还差 ${need} 分。`,
    depends: (nm) => `${nm}能否出线还要看其他小组的结果；以下是其剩余小组赛各种战绩的出线前景：`,
    outcome: (rec, p, rank) => `${rec}：约 ${p}% 出线（${rank}）。`,
    rank: (lo, hi) => (lo === hi ? `小组第 ${lo}` : `小组第 ${lo}-${hi}`),
    W: "胜", D: "平", L: "负",
  },
  en: {
    h: (nm) => `Can ${nm} still advance?`,
    already: (nm) => `${nm} has already secured a place in the Round of 32.`,
    clinch: (nm, pts, gd, need) =>
      `${nm} clinches a Round-of-32 place with ${pts} points (goal difference ${gd}) — ${need} more point${need === 1 ? "" : "s"} to go.`,
    depends: (nm) =>
      `Whether ${nm} advances also depends on other groups; here is how each finish in its remaining group games projects:`,
    outcome: (rec, p, rank) => `${rec}: about ${p}% chance to advance (${rank}).`,
    rank: (lo, hi) => (lo === hi ? `finishing #${lo} in the group` : `finishing #${lo}–${hi} in the group`),
    W: "W", D: "D", L: "L",
  },
  es: {
    h: (nm) => `¿Cómo puede ${nm} todavía clasificar?`,
    already: (nm) => `${nm} ya tiene asegurada su plaza en los dieciseisavos.`,
    clinch: (nm, pts, gd, need) =>
      `${nm} asegura su plaza con ${pts} puntos (diferencia de goles ${gd}); le faltan ${need} punto${need === 1 ? "" : "s"}.`,
    depends: (nm) =>
      `Que ${nm} clasifique también depende de otros grupos; así se proyecta cada registro en sus partidos restantes:`,
    outcome: (rec, p, rank) => `${rec}: alrededor del ${p}% de avanzar (${rank}).`,
    rank: (lo, hi) => (lo === hi ? `${lo}.º del grupo` : `${lo}.º–${hi}.º del grupo`),
    W: "V", D: "E", L: "D",
  },
  pt: {
    h: (nm) => `Como ${nm} ainda pode se classificar?`,
    already: (nm) => `${nm} já garantiu sua vaga nos 16-avos.`,
    clinch: (nm, pts, gd, need) =>
      `${nm} garante a vaga com ${pts} pontos (saldo de gols ${gd}); faltam ${need} ponto${need === 1 ? "" : "s"}.`,
    depends: (nm) =>
      `A classificação de ${nm} também depende de outros grupos; veja como cada campanha nos jogos restantes se projeta:`,
    outcome: (rec, p, rank) => `${rec}: cerca de ${p}% de avançar (${rank}).`,
    rank: (lo, hi) => (lo === hi ? `${lo}.º do grupo` : `${lo}.º–${hi}.º do grupo`),
    W: "V", D: "E", L: "D",
  },
  de: {
    h: (nm) => `Wie kann ${nm} noch weiterkommen?`,
    already: (nm) => `${nm} hat das Sechzehntelfinale bereits sicher.`,
    clinch: (nm, pts, gd, need) =>
      `${nm} kommt mit ${pts} Punkten (Tordifferenz ${gd}) sicher weiter — noch ${need} Punkt${need === 1 ? "" : "e"}.`,
    depends: (nm) =>
      `Ob ${nm} weiterkommt, hängt auch von anderen Gruppen ab; so projiziert sich jede Bilanz in den restlichen Spielen:`,
    outcome: (rec, p, rank) => `${rec}: rund ${p}% Weiterkommen (${rank}).`,
    rank: (lo, hi) => (lo === hi ? `Gruppenplatz ${lo}` : `Gruppenplatz ${lo}–${hi}`),
    W: "S", D: "U", L: "N",
  },
  fr: {
    h: (nm) => `Comment ${nm} peut-il encore se qualifier ?`,
    already: (nm) => `${nm} a déjà validé sa place en seizièmes de finale.`,
    clinch: (nm, pts, gd, need) =>
      `${nm} valide sa place avec ${pts} points (différence de buts ${gd}) ; il reste ${need} point${need === 1 ? "" : "s"}.`,
    depends: (nm) =>
      `La qualification de ${nm} dépend aussi des autres groupes ; voici la projection de chaque bilan sur ses matchs restants :`,
    outcome: (rec, p, rank) => `${rec} : environ ${p}% de se qualifier (${rank}).`,
    rank: (lo, hi) => (lo === hi ? `${lo}ᵉ du groupe` : `${lo}ᵉ–${hi}ᵉ du groupe`),
    W: "V", D: "N", L: "D",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug); // 解码 + NFC：Next 对非 ASCII 段在 page/metadata 间解码不一致
  const locale = await getLocale();
  const d = await getTeamDetail(slug).catch(() => null);
  if (!d) notFound(); // 在 generateMetadata（流式前）判，避免 loading.tsx Suspense 流式致软 404（200）
  const c = COPY[locale];
  const nm = locale === "zh" ? d.zh : teamName(d.name, locale);
  const og = `/api/og?team=${d.slug}&locale=${locale}&u=${encodeURIComponent(localeHref(locale, `/team/${d.slug}`))}`;
  return {
    title: c.title(nm),
    description: c.desc(nm, fmtP(d.pAdvance), fmtP(d.pChampion)),
    alternates: localizedAlternates(`/team/${d.slug}`, locale),
    openGraph: { title: c.title(nm), url: selfUrl(`/team/${d.slug}`, locale), images: [{ url: og, width: 1080, height: 1440 }] },
    twitter: { card: "summary_large_image", images: [og] },
  };
}

function ResultChip({
  r,
  c,
  locale,
}: {
  r: TeamResult;
  c: { home: string; away: string; W: string; D: string; L: string };
  locale: Locale;
}) {
  const color = r.outcome === "W" ? "text-green" : r.outcome === "L" ? "text-red" : "text-amber";
  const oppName = locale === "zh" ? r.oppZh : teamName(r.oppName, locale);
  return (
    <Link
      href={localeHref(locale, `/match/${r.matchId}`)}
      className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm transition hover:border-green/50"
    >
      <span className="flex items-center gap-2">
        <span className={`font-head w-4 shrink-0 font-bold ${color}`}>{c[r.outcome]}</span>
        <span className="text-[10px] text-muted md:text-xs">{r.home ? c.home : c.away}</span>
        {r.oppFlag && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.oppFlag} alt="" width={16} height={12} loading="lazy" decoding="async" className="h-3 w-4 rounded-[2px] object-cover" />
        )}
        <span className="truncate">{oppName}</span>
      </span>
      <span className="font-head tabular-nums">
        {r.gf}-{r.ga}
      </span>
    </Link>
  );
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug); // 解码 + NFC：Next 对非 ASCII 段在 page/metadata 间解码不一致
  const locale = await getLocale();
  const d = await getTeamDetail(slug);
  if (!d) notFound();
  const [fc, squad, reqs] = await Promise.all([
    getForecast().catch(() => null),
    getTeamSquad(d.name).catch(() => null),
    getAdvanceRequirements(d.id).catch(() => null),
  ]);
  const group = fc?.groups.find((g) => g.letter === d.letter) ?? null;
  const sc = STANDINGS_COPY[locale] ?? STANDINGS_COPY.en;
  const qc = SQUAD_COPY[locale] ?? SQUAD_COPY.en;
  const pct = (x: number) => `${(x > 1 ? x : x * 100).toFixed(0)}%`;
  const idx = await getSettledIndex().catch(() => null);
  const lastResult = idx?.byTeam[d.id] ?? null; // 真实 settled_at，非伪新鲜
  // P5：本队相关的已发布事件解读（无则不渲染）。
  const related = await getRelatedBlogByTeam(d.id, toBlogLocale(locale)).catch(() => []);
  const c = COPY[locale];
  const nm = locale === "zh" ? d.zh : teamName(d.name, locale);
  const adv = fmtP(d.pAdvance);
  const champ = fmtP(d.pChampion);
  const advHigh = (d.pAdvance > 1 ? d.pAdvance : d.pAdvance * 100) >= 50;
  const nextOpp = d.next ? (locale === "zh" ? d.next.oppZh : teamName(d.next.oppName, locale)) : "";
  const ogUrl = `${SITE}/api/og?team=${d.slug}&locale=${locale}&u=${encodeURIComponent(localeHref(locale, `/team/${d.slug}`))}`;

  const HOME_LABEL: Record<Locale, string> = {
    zh: "首页",
    en: "Home",
    es: "Inicio",
    pt: "Início",
    de: "Startseite",
    fr: "Accueil",
  };
  const GROUP_LINK: Record<Locale, string> = {
    zh: `🧮 看 ${d.letter} 组完整出线形势 →`,
    en: `🧮 See full Group ${d.letter} scenarios →`,
    es: `🧮 Ver escenarios completos del Grupo ${d.letter} →`,
    pt: `🧮 Ver cenários completos do Grupo ${d.letter} →`,
    de: `🧮 Alle Szenarien der Gruppe ${d.letter} ansehen →`,
    fr: `🧮 Voir tous les scénarios du Groupe ${d.letter} →`,
  };
  const RULES_LINK: Record<Locale, string> = {
    zh: "📖 出线规则详解（第三名怎么算）",
    en: "📖 How World Cup 2026 qualification works",
    es: "📖 Cómo funciona la clasificación del Mundial 2026",
    pt: "📖 Como funciona a classificação da Copa 2026",
    de: "📖 So funktioniert die WM-2026-Qualifikation",
    fr: "📖 Comment fonctionne la qualification du Mondial 2026",
  };

  // SportsTeam + 面包屑实体（只填真实字段；实力评分对外不写官方排名）。
  const teamJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsTeam",
        "@id": `${selfUrl(`/team/${d.slug}`, locale)}#team`,
        name: d.name,
        sport: "Soccer",
        ...(TEAM_WIKI[d.slug] ? { sameAs: [TEAM_WIKI[d.slug]] } : {}),
        ...(d.flag ? { logo: d.flag.replace("/w80/", "/w160/") } : {}),
        ...(squad?.coach ? { coach: { "@type": "Person", name: squad.coach } } : {}),
        url: selfUrl(`/team/${d.slug}`, locale),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: HOME_LABEL[locale] ?? "Home", item: selfUrl("/", locale) },
          { "@type": "ListItem", position: 2, name: nm, item: selfUrl(`/team/${d.slug}`, locale) },
        ],
      },
    ],
  };

  return (
    <PageContainer tier="prose">
      <JsonLd data={teamJsonLd} />
      <div className="flex items-center justify-between">
        <Link href={localeHref(locale, "/")} className="text-xs text-muted">
          {c.back}
        </Link>
        <HeaderShare
          locale={locale}
          shareUrl={selfUrl(`/team/${d.slug}`, locale)}
          text={c.shareText(nm, adv)}
          ogUrl={ogUrl}
          source="team"
        />
      </div>

      {/* 主体卡：国旗 + 队名 + 组/排名 */}
      <div className="mt-3 flex items-center gap-4 rounded-lg border border-border bg-surface p-5">
        {d.flag ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.flag.replace("/w80/", "/w160/")} alt="" width={64} height={48} decoding="async" className="h-12 w-16 rounded-sm object-cover ring-1 ring-border" />
        ) : (
          <span className="text-5xl">⚽</span>
        )}
        <div>
          <h1 className="font-head text-2xl font-bold md:text-3xl">{nm}</h1>
          <div className="text-xs text-muted">{c.group(d.letter, d.rank)}</div>
        </div>
      </div>

      {/* 前置可提取答案（GEO：答案前置 + 统计数字 + 年份；EN-first）+ 最新赛果（真实 settled_at）。 */}
      <p className="mt-3 text-sm leading-relaxed md:text-base">{c.lead(nm, adv, champ, d.letter)}</p>
      {lastResult && (
        <p className="mt-1 text-[11px] text-muted md:text-xs">
          {c.latest} · {new Date(lastResult).toLocaleDateString(BCP47_LOCALE[locale] ?? "en-US")}
        </p>
      )}

      {/* 概率 + 实力评分 */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-md border border-border bg-surface-2 p-4">
          <div className={`font-head text-3xl font-bold ${advHigh ? "text-green" : "text-amber"}`}>{adv}%</div>
          <div className="mt-1 text-[11px] text-muted md:text-xs">{c.advance}</div>
        </div>
        <div className="rounded-md border border-border bg-surface-2 p-4">
          <div className="font-head text-3xl font-bold text-gold">{champ}%</div>
          <div className="mt-1 text-[11px] text-muted md:text-xs">{c.champion}</div>
        </div>
        <div className="rounded-md border border-border bg-surface-2 p-4">
          <div className="font-head text-3xl font-bold">{d.rating}</div>
          <div className="mt-1 text-[11px] text-muted md:text-xs">{c.rating}</div>
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted md:text-xs">{c.ratingNote}</p>

      {/* B2：出线门槛 prose —— 服务端可抓取，精确命中「can X advance / X 还能出线吗」查询，也是 AI 直接引用的答案。 */}
      {reqs && reqs.remaining.length > 0 && reqs.records.length > 0 && (() => {
        const rq = REQ_COPY[locale] ?? REQ_COPY.en;
        const rPct = (p: number) => (p >= 0.995 ? 100 : p <= 0.005 ? 0 : Math.round(p * 100));
        const sgd = (n: number) => `${n > 0 ? "+" : ""}${n}`;
        const recLabel = (r: { w: number; d: number; l: number }) =>
          [r.w ? `${r.w}${rq.W}` : "", r.d ? `${r.d}${rq.D}` : "", r.l ? `${r.l}${rq.L}` : ""]
            .filter(Boolean)
            .join(" ");
        const need = reqs.clinchPts !== null ? reqs.clinchPts - reqs.curPts : null;
        const alreadyThrough = reqs.clinchPts !== null && need !== null && need <= 0;
        const lead = alreadyThrough
          ? rq.already(nm)
          : reqs.clinchPts !== null
            ? rq.clinch(nm, reqs.clinchPts, sgd(reqs.clinchGd ?? 0), need ?? 0)
            : rq.depends(nm);
        return (
          <>
            <h2 className="font-head mb-2 mt-6 text-sm font-semibold md:text-base">{rq.h(nm)}</h2>
            <p className="text-sm leading-relaxed md:text-base">{lead}</p>
            {!alreadyThrough && (
              <ul className="mt-2 space-y-1.5 text-sm md:text-base">
                {reqs.records.slice(0, 3).map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green/70" />
                    <span>{rq.outcome(recLabel(r), rPct(r.p), rq.rank(r.rankLo, r.rankHi))}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        );
      })()}

      <div className="mt-4">
        <SetMyTeamButton slug={d.slug} locale={locale} />
      </div>

      {/* 小组积分榜（高亮本队，可点击同组其他队） */}
      {group && (
        <>
          <h2 className="font-head mb-2 mt-6 text-sm font-semibold md:text-base">{sc.h(d.letter)}</h2>
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] text-muted md:text-xs">
                  {sc.cols.map((col, i) => (
                    <th key={i} className={`px-2 py-2 font-normal ${i >= 2 ? "text-right" : "text-left"}`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.table.map((t, i) => {
                  const isSelf = t.id === d.id;
                  const tn = locale === "zh" ? t.zh : teamName(t.name, locale);
                  return (
                    <tr
                      key={t.id}
                      className={
                        isSelf
                          ? "bg-surface-2 font-semibold text-text"
                          : i < 2
                            ? "text-text"
                            : "text-muted"
                      }
                    >
                      <td className="px-2 py-2 font-head">{i + 1}</td>
                      <td className="px-2 py-2">
                        <span className="inline-flex items-center gap-1.5">
                          {t.flag && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.flag} alt="" width={16} height={12} loading="lazy" decoding="async" className="h-3 w-4 rounded-[2px] object-cover" />
                          )}
                          {isSelf ? (
                            tn
                          ) : (
                            <Link
                              href={localeHref(locale, `/team/${teamSlug(t.name)}`)}
                              className="hover:text-green"
                            >
                              {tn}
                            </Link>
                          )}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right font-head tabular-nums">{t.played}</td>
                      <td className="px-2 py-2 text-right font-head tabular-nums">{t.pts}</td>
                      <td className="px-2 py-2 text-right font-head tabular-nums">
                        {t.gd > 0 ? `+${t.gd}` : t.gd}
                      </td>
                      <td className="px-2 py-2 text-right font-head tabular-nums text-green">
                        {pct(t.pAdvance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-muted md:text-xs">{sc.note}</p>
        </>
      )}

      {/* 下一场 */}
      <h2 className="font-head mb-2 mt-6 text-sm font-semibold md:text-base">{c.next}</h2>
      {d.next ? (
        <Link
          href={localeHref(locale, `/match/${d.next.matchId}`)}
          className="flex items-center justify-between rounded-lg border border-green/40 bg-surface p-3 text-sm transition hover:border-green"
        >
          <span className="flex items-center gap-2">
            <span className="text-[10px] text-muted md:text-xs">{d.next.home ? c.home : c.away}</span>
            {d.next.oppFlag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.next.oppFlag} alt="" width={16} height={12} loading="lazy" decoding="async" className="h-3 w-4 rounded-[2px] object-cover" />
            )}
            <span>{nextOpp}</span>
          </span>
          <span className="text-xs text-muted">
            <LocalTime iso={d.next.kickoff} locale={locale} mode="datetime" />
          </span>
        </Link>
      ) : (
        <p className="rounded-md border border-border bg-surface-2 p-3 text-sm text-muted md:text-base">{c.noNext}</p>
      )}

      {/* 最近战绩 */}
      <h2 className="font-head mb-2 mt-6 text-sm font-semibold md:text-base">{c.recent}</h2>
      {d.recent.length > 0 ? (
        <div className="space-y-1.5">
          {d.recent.map((r) => (
            <ResultChip key={r.matchId} r={r} c={c} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-border bg-surface-2 p-3 text-sm text-muted md:text-base">{c.noRecent}</p>
      )}

      {/* 官方阵容（squad_* 表；只展示公开事实，无队徽/照片/游戏属性） */}
      {squad && (
        <>
          <h2 className="font-head mb-2 mt-6 text-sm font-semibold md:text-base">{qc.h}</h2>
          <div className="rounded-lg border border-border bg-surface p-3 text-sm">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-text/90">
              {squad.coach && (
                <span>
                  {qc.coach}:{" "}
                  <strong className="text-text">{squad.coach}</strong>
                  {squad.coachNationality ? ` (${squad.coachNationality})` : ""}
                </span>
              )}
              {squad.avgAge != null && (
                <span>
                  {qc.avgAge}: <strong className="text-text">{squad.avgAge.toFixed(1)}</strong>
                </span>
              )}
              {squad.avgHeightCm != null && (
                <span>
                  {qc.avgHt}: <strong className="text-text">{Math.round(squad.avgHeightCm)} cm</strong>
                </span>
              )}
              {squad.totalCaps != null && (
                <span>
                  {qc.caps}: <strong className="text-text">{squad.totalCaps}</strong>
                </span>
              )}
            </div>
          </div>
          {(["GK", "DF", "MF", "FW"] as PositionGroup[]).map((pg) => {
            const list = squad.players.filter((p) => p.pos === pg);
            if (list.length === 0) return null;
            return (
              <div key={pg} className="mt-3">
                <h3 className="font-head mb-1 text-xs font-semibold text-green md:text-sm">
                  {qc.pos[pg]} <span className="text-muted">({list.length})</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border bg-surface">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-[11px] text-muted md:text-xs">
                        <th className="w-8 px-2 py-1.5 text-left font-normal">#</th>
                        <th className="px-2 py-1.5 text-left font-normal">{qc.cols.player}</th>
                        <th className="px-2 py-1.5 text-left font-normal">{qc.cols.club}</th>
                        <th className="px-2 py-1.5 text-right font-normal">{qc.cols.age}</th>
                        <th className="px-2 py-1.5 text-right font-normal">{qc.cols.caps}</th>
                        <th className="px-2 py-1.5 text-right font-normal">{qc.cols.goals}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((p) => (
                        <tr key={`${pg}-${p.no}-${p.name}`} className="border-b border-border/50 last:border-0">
                          <td className="px-2 py-1.5 font-head tabular-nums text-muted">{p.no ?? "–"}</td>
                          <td className="px-2 py-1.5">
                            {p.popSlug ? (
                              <Link
                                href={localeHref(locale, `/player/${p.popSlug}`)}
                                className="text-green hover:underline"
                              >
                                {locale === "zh" ? p.nameZh ?? p.name : p.name}
                              </Link>
                            ) : locale === "zh" ? (
                              p.nameZh ?? p.name
                            ) : (
                              p.name
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-xs text-muted">{p.club ?? "–"}</td>
                          <td className="px-2 py-1.5 text-right font-head tabular-nums">{p.age ?? "–"}</td>
                          <td className="px-2 py-1.5 text-right font-head tabular-nums">{p.caps ?? "–"}</td>
                          <td className="px-2 py-1.5 text-right font-head tabular-nums">{p.goals ?? "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          <p className="mt-1.5 text-[10px] leading-relaxed text-muted md:text-xs">{qc.note}</p>
        </>
      )}

      {/* 交叉链接：计算器 */}
      <Link
        href={localeHref(locale, `/calculator?team=${d.slug}`)}
        className="mt-6 block rounded-lg border border-border bg-surface p-3 text-sm text-green transition-colors hover:border-green/50"
      >
        {c.calc(nm)}
      </Link>
      <Link
        href={localeHref(locale, `/calculator/group/${d.letter.toLowerCase()}`)}
        className="mt-2 block rounded-lg border border-border bg-surface p-3 text-sm text-muted transition-colors hover:border-green/50"
      >
        {GROUP_LINK[locale] ?? GROUP_LINK.en}
      </Link>
      <Link href={localeHref(locale, "/rules")} className="mt-2 block rounded-lg border border-border bg-surface p-3 text-sm text-muted transition-colors hover:border-green/50">
        {RULES_LINK[locale] ?? RULES_LINK.en}
      </Link>

      <p className="mt-4 text-[10px] text-muted md:text-xs">{c.sims}</p>

      <RelatedCommentary items={related} locale={locale} />

    </PageContainer>
  );
}
