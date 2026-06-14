import type { Locale } from "@/i18n/locales";

// 英文队名（football-data.org 拼写）→ 各语种译名 + ISO2 国家码（用于国旗图片）。
// 国旗用图片（flagcdn）而非 emoji——Windows 不支持国旗 emoji。
// P2-2 已激活：teamName 按 locale 读 NATIONS[name][locale]（en 直出 football-data 原名）。
interface Nation {
  zh: string;
  es: string;
  pt: string;
  de: string;
  fr: string;
  iso2: string; // flagcdn 代码（小写）；英格兰/苏格兰/威尔士用 gb-eng 等
}

const NATIONS: Record<string, Nation> = {
  Mexico: { zh: "墨西哥", es: "México", pt: "México", de: "Mexiko", fr: "Mexique", iso2: "mx" },
  "South Africa": { zh: "南非", es: "Sudáfrica", pt: "África do Sul", de: "Südafrika", fr: "Afrique du Sud", iso2: "za" },
  "South Korea": { zh: "韩国", es: "Corea del Sur", pt: "Coreia do Sul", de: "Südkorea", fr: "Corée du Sud", iso2: "kr" },
  Czechia: { zh: "捷克", es: "Chequia", pt: "Tchéquia", de: "Tschechien", fr: "Tchéquie", iso2: "cz" },
  "Czech Republic": { zh: "捷克", es: "Chequia", pt: "Tchéquia", de: "Tschechien", fr: "Tchéquie", iso2: "cz" },
  Canada: { zh: "加拿大", es: "Canadá", pt: "Canadá", de: "Kanada", fr: "Canada", iso2: "ca" },
  "Bosnia-Herzegovina": { zh: "波黑", es: "Bosnia y Herzegovina", pt: "Bósnia e Herzegovina", de: "Bosnien und Herzegowina", fr: "Bosnie-Herzégovine", iso2: "ba" },
  "United States": { zh: "美国", es: "Estados Unidos", pt: "Estados Unidos", de: "USA", fr: "États-Unis", iso2: "us" },
  USA: { zh: "美国", es: "Estados Unidos", pt: "Estados Unidos", de: "USA", fr: "États-Unis", iso2: "us" },
  Paraguay: { zh: "巴拉圭", es: "Paraguay", pt: "Paraguai", de: "Paraguay", fr: "Paraguay", iso2: "py" },
  Qatar: { zh: "卡塔尔", es: "Catar", pt: "Catar", de: "Katar", fr: "Qatar", iso2: "qa" },
  Switzerland: { zh: "瑞士", es: "Suiza", pt: "Suíça", de: "Schweiz", fr: "Suisse", iso2: "ch" },
  Brazil: { zh: "巴西", es: "Brasil", pt: "Brasil", de: "Brasilien", fr: "Brésil", iso2: "br" },
  Morocco: { zh: "摩洛哥", es: "Marruecos", pt: "Marrocos", de: "Marokko", fr: "Maroc", iso2: "ma" },
  Haiti: { zh: "海地", es: "Haití", pt: "Haiti", de: "Haiti", fr: "Haïti", iso2: "ht" },
  Scotland: { zh: "苏格兰", es: "Escocia", pt: "Escócia", de: "Schottland", fr: "Écosse", iso2: "gb-sct" },
  Australia: { zh: "澳大利亚", es: "Australia", pt: "Austrália", de: "Australien", fr: "Australie", iso2: "au" },
  Turkey: { zh: "土耳其", es: "Turquía", pt: "Turquia", de: "Türkei", fr: "Turquie", iso2: "tr" },
  "Türkiye": { zh: "土耳其", es: "Turquía", pt: "Turquia", de: "Türkei", fr: "Turquie", iso2: "tr" },
  Germany: { zh: "德国", es: "Alemania", pt: "Alemanha", de: "Deutschland", fr: "Allemagne", iso2: "de" },
  "Curaçao": { zh: "库拉索", es: "Curazao", pt: "Curaçao", de: "Curaçao", fr: "Curaçao", iso2: "cw" },
  Netherlands: { zh: "荷兰", es: "Países Bajos", pt: "Países Baixos", de: "Niederlande", fr: "Pays-Bas", iso2: "nl" },
  Japan: { zh: "日本", es: "Japón", pt: "Japão", de: "Japan", fr: "Japon", iso2: "jp" },
  "Ivory Coast": { zh: "科特迪瓦", es: "Costa de Marfil", pt: "Costa do Marfim", de: "Elfenbeinküste", fr: "Côte d'Ivoire", iso2: "ci" },
  "Côte d'Ivoire": { zh: "科特迪瓦", es: "Costa de Marfil", pt: "Costa do Marfim", de: "Elfenbeinküste", fr: "Côte d'Ivoire", iso2: "ci" },
  Ecuador: { zh: "厄瓜多尔", es: "Ecuador", pt: "Equador", de: "Ecuador", fr: "Équateur", iso2: "ec" },
  Sweden: { zh: "瑞典", es: "Suecia", pt: "Suécia", de: "Schweden", fr: "Suède", iso2: "se" },
  Tunisia: { zh: "突尼斯", es: "Túnez", pt: "Tunísia", de: "Tunesien", fr: "Tunisie", iso2: "tn" },
  Belgium: { zh: "比利时", es: "Bélgica", pt: "Bélgica", de: "Belgien", fr: "Belgique", iso2: "be" },
  Argentina: { zh: "阿根廷", es: "Argentina", pt: "Argentina", de: "Argentinien", fr: "Argentine", iso2: "ar" },
  France: { zh: "法国", es: "Francia", pt: "França", de: "Frankreich", fr: "France", iso2: "fr" },
  Spain: { zh: "西班牙", es: "España", pt: "Espanha", de: "Spanien", fr: "Espagne", iso2: "es" },
  Portugal: { zh: "葡萄牙", es: "Portugal", pt: "Portugal", de: "Portugal", fr: "Portugal", iso2: "pt" },
  England: { zh: "英格兰", es: "Inglaterra", pt: "Inglaterra", de: "England", fr: "Angleterre", iso2: "gb-eng" },
  Wales: { zh: "威尔士", es: "Gales", pt: "País de Gales", de: "Wales", fr: "Pays de Galles", iso2: "gb-wls" },
  Italy: { zh: "意大利", es: "Italia", pt: "Itália", de: "Italien", fr: "Italie", iso2: "it" },
  Croatia: { zh: "克罗地亚", es: "Croacia", pt: "Croácia", de: "Kroatien", fr: "Croatie", iso2: "hr" },
  Uruguay: { zh: "乌拉圭", es: "Uruguay", pt: "Uruguai", de: "Uruguay", fr: "Uruguay", iso2: "uy" },
  Colombia: { zh: "哥伦比亚", es: "Colombia", pt: "Colômbia", de: "Kolumbien", fr: "Colombie", iso2: "co" },
  Senegal: { zh: "塞内加尔", es: "Senegal", pt: "Senegal", de: "Senegal", fr: "Sénégal", iso2: "sn" },
  Denmark: { zh: "丹麦", es: "Dinamarca", pt: "Dinamarca", de: "Dänemark", fr: "Danemark", iso2: "dk" },
  Poland: { zh: "波兰", es: "Polonia", pt: "Polônia", de: "Polen", fr: "Pologne", iso2: "pl" },
  Serbia: { zh: "塞尔维亚", es: "Serbia", pt: "Sérvia", de: "Serbien", fr: "Serbie", iso2: "rs" },
  Ghana: { zh: "加纳", es: "Ghana", pt: "Gana", de: "Ghana", fr: "Ghana", iso2: "gh" },
  Nigeria: { zh: "尼日利亚", es: "Nigeria", pt: "Nigéria", de: "Nigeria", fr: "Nigéria", iso2: "ng" },
  Cameroon: { zh: "喀麦隆", es: "Camerún", pt: "Camarões", de: "Kamerun", fr: "Cameroun", iso2: "cm" },
  Algeria: { zh: "阿尔及利亚", es: "Argelia", pt: "Argélia", de: "Algerien", fr: "Algérie", iso2: "dz" },
  Egypt: { zh: "埃及", es: "Egipto", pt: "Egito", de: "Ägypten", fr: "Égypte", iso2: "eg" },
  "Saudi Arabia": { zh: "沙特阿拉伯", es: "Arabia Saudita", pt: "Arábia Saudita", de: "Saudi-Arabien", fr: "Arabie saoudite", iso2: "sa" },
  Iran: { zh: "伊朗", es: "Irán", pt: "Irã", de: "Iran", fr: "Iran", iso2: "ir" },
  Peru: { zh: "秘鲁", es: "Perú", pt: "Peru", de: "Peru", fr: "Pérou", iso2: "pe" },
  Chile: { zh: "智利", es: "Chile", pt: "Chile", de: "Chile", fr: "Chili", iso2: "cl" },
  Austria: { zh: "奥地利", es: "Austria", pt: "Áustria", de: "Österreich", fr: "Autriche", iso2: "at" },
  Norway: { zh: "挪威", es: "Noruega", pt: "Noruega", de: "Norwegen", fr: "Norvège", iso2: "no" },
  Greece: { zh: "希腊", es: "Grecia", pt: "Grécia", de: "Griechenland", fr: "Grèce", iso2: "gr" },
  "New Zealand": { zh: "新西兰", es: "Nueva Zelanda", pt: "Nova Zelândia", de: "Neuseeland", fr: "Nouvelle-Zélande", iso2: "nz" },
  "Costa Rica": { zh: "哥斯达黎加", es: "Costa Rica", pt: "Costa Rica", de: "Costa Rica", fr: "Costa Rica", iso2: "cr" },
  Panama: { zh: "巴拿马", es: "Panamá", pt: "Panamá", de: "Panama", fr: "Panama", iso2: "pa" },
  Jamaica: { zh: "牙买加", es: "Jamaica", pt: "Jamaica", de: "Jamaika", fr: "Jamaïque", iso2: "jm" },
  Uzbekistan: { zh: "乌兹别克斯坦", es: "Uzbekistán", pt: "Uzbequistão", de: "Usbekistan", fr: "Ouzbékistan", iso2: "uz" },
  Jordan: { zh: "约旦", es: "Jordania", pt: "Jordânia", de: "Jordanien", fr: "Jordanie", iso2: "jo" },
  "Cape Verde": { zh: "佛得角", es: "Cabo Verde", pt: "Cabo Verde", de: "Kap Verde", fr: "Cap-Vert", iso2: "cv" },
  "Cape Verde Islands": { zh: "佛得角", es: "Cabo Verde", pt: "Cabo Verde", de: "Kap Verde", fr: "Cap-Vert", iso2: "cv" },
  "Congo DR": { zh: "刚果（金）", es: "RD Congo", pt: "RD Congo", de: "DR Kongo", fr: "RD Congo", iso2: "cd" },
  Iraq: { zh: "伊拉克", es: "Irak", pt: "Iraque", de: "Irak", fr: "Irak", iso2: "iq" },
  Panama_: { zh: "巴拿马", es: "Panamá", pt: "Panamá", de: "Panama", fr: "Panama", iso2: "pa" },
};

/** 英文队名 → 中文名（未知则原样返回）。 */
export function teamZh(name: string): string {
  return NATIONS[name]?.zh ?? name;
}

/** 按语言取队名：DB 存的就是英文原名（football-data 拼写），en 直出、其余查 NATIONS 表（未知回落英文原名）。 */
export function teamName(name: string, locale: Locale): string {
  if (locale === "en") return name;
  return NATIONS[name]?.[locale] ?? name;
}

// DB 的 stage/grp 存中文（如 "小组赛"、"A 组"）——非 zh 视图在渲染层反查，不动库。
// key = 去空白后的 zh 赛段名；值含全部非-zh locale。32 队淘汰赛 = Round of 32（2026 新制）。
type NonZhLocale = Exclude<Locale, "zh">;
const STAGE_NAMES: Record<string, Record<NonZhLocale, string>> = {
  小组赛: { en: "Group Stage", es: "Fase de grupos", pt: "Fase de grupos", de: "Gruppenphase", fr: "Phase de groupes" },
  "32强": { en: "Round of 32", es: "Dieciseisavos de final", pt: "16 avos de final", de: "Sechzehntelfinale", fr: "Seizièmes de finale" },
  "1/16决赛": { en: "Round of 32", es: "Dieciseisavos de final", pt: "16 avos de final", de: "Sechzehntelfinale", fr: "Seizièmes de finale" },
  "1/8决赛": { en: "Round of 16", es: "Octavos de final", pt: "Oitavas de final", de: "Achtelfinale", fr: "Huitièmes de finale" },
  "16强": { en: "Round of 16", es: "Octavos de final", pt: "Oitavas de final", de: "Achtelfinale", fr: "Huitièmes de finale" },
  "1/4决赛": { en: "Quarter-final", es: "Cuartos de final", pt: "Quartas de final", de: "Viertelfinale", fr: "Quarts de finale" },
  "8强": { en: "Quarter-final", es: "Cuartos de final", pt: "Quartas de final", de: "Viertelfinale", fr: "Quarts de finale" },
  半决赛: { en: "Semi-final", es: "Semifinal", pt: "Semifinal", de: "Halbfinale", fr: "Demi-finale" },
  季军赛: { en: "Third place", es: "Tercer puesto", pt: "Terceiro lugar", de: "Spiel um Platz 3", fr: "Match pour la 3e place" },
  决赛: { en: "Final", es: "Final", pt: "Final", de: "Finale", fr: "Finale" },
};

/** 赛段名（zh 原样；其余查表，未知原样返回）。 */
export function stageName(stage: string, locale: Locale): string {
  if (locale === "zh") return stage;
  return STAGE_NAMES[stage.replace(/\s/g, "")]?.[locale] ?? stage;
}

/** 组名（"A 组" ↔ "Group A / Grupo A / Gruppe A / Groupe A"，按 A-L 字母提取）。 */
const GROUP_PREFIX: Record<NonZhLocale, string> = {
  en: "Group",
  es: "Grupo",
  pt: "Grupo",
  de: "Gruppe",
  fr: "Groupe",
};
export function groupName(grp: string, locale: Locale): string {
  const letter = grp.match(/[A-L]/)?.[0];
  if (!letter) return grp;
  return locale === "zh" ? `${letter} 组` : `${GROUP_PREFIX[locale]} ${letter}`;
}

/** 英文队名 → 国旗图片 URL（未知返回 null）。 */
export function flagUrl(name: string): string | null {
  const iso2 = NATIONS[name]?.iso2;
  return iso2 ? `https://flagcdn.com/w80/${iso2}.png` : null;
}
