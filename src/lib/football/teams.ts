// 英文队名（football-data.org 拼写）→ 中文名 + ISO2 国家码（用于国旗图片）。
// 国旗用图片（flagcdn）而非 emoji——Windows 不支持国旗 emoji。
interface Nation {
  zh: string;
  iso2: string; // flagcdn 代码（小写）；英格兰/苏格兰/威尔士用 gb-eng 等
}

const NATIONS: Record<string, Nation> = {
  Mexico: { zh: "墨西哥", iso2: "mx" },
  "South Africa": { zh: "南非", iso2: "za" },
  "South Korea": { zh: "韩国", iso2: "kr" },
  Czechia: { zh: "捷克", iso2: "cz" },
  "Czech Republic": { zh: "捷克", iso2: "cz" },
  Canada: { zh: "加拿大", iso2: "ca" },
  "Bosnia-Herzegovina": { zh: "波黑", iso2: "ba" },
  "United States": { zh: "美国", iso2: "us" },
  USA: { zh: "美国", iso2: "us" },
  Paraguay: { zh: "巴拉圭", iso2: "py" },
  Qatar: { zh: "卡塔尔", iso2: "qa" },
  Switzerland: { zh: "瑞士", iso2: "ch" },
  Brazil: { zh: "巴西", iso2: "br" },
  Morocco: { zh: "摩洛哥", iso2: "ma" },
  Haiti: { zh: "海地", iso2: "ht" },
  Scotland: { zh: "苏格兰", iso2: "gb-sct" },
  Australia: { zh: "澳大利亚", iso2: "au" },
  Turkey: { zh: "土耳其", iso2: "tr" },
  "Türkiye": { zh: "土耳其", iso2: "tr" },
  Germany: { zh: "德国", iso2: "de" },
  "Curaçao": { zh: "库拉索", iso2: "cw" },
  Netherlands: { zh: "荷兰", iso2: "nl" },
  Japan: { zh: "日本", iso2: "jp" },
  "Ivory Coast": { zh: "科特迪瓦", iso2: "ci" },
  "Côte d'Ivoire": { zh: "科特迪瓦", iso2: "ci" },
  Ecuador: { zh: "厄瓜多尔", iso2: "ec" },
  Sweden: { zh: "瑞典", iso2: "se" },
  Tunisia: { zh: "突尼斯", iso2: "tn" },
  Belgium: { zh: "比利时", iso2: "be" },
  Argentina: { zh: "阿根廷", iso2: "ar" },
  France: { zh: "法国", iso2: "fr" },
  Spain: { zh: "西班牙", iso2: "es" },
  Portugal: { zh: "葡萄牙", iso2: "pt" },
  England: { zh: "英格兰", iso2: "gb-eng" },
  Wales: { zh: "威尔士", iso2: "gb-wls" },
  Italy: { zh: "意大利", iso2: "it" },
  Croatia: { zh: "克罗地亚", iso2: "hr" },
  Uruguay: { zh: "乌拉圭", iso2: "uy" },
  Colombia: { zh: "哥伦比亚", iso2: "co" },
  Senegal: { zh: "塞内加尔", iso2: "sn" },
  Denmark: { zh: "丹麦", iso2: "dk" },
  Poland: { zh: "波兰", iso2: "pl" },
  Serbia: { zh: "塞尔维亚", iso2: "rs" },
  Ghana: { zh: "加纳", iso2: "gh" },
  Nigeria: { zh: "尼日利亚", iso2: "ng" },
  Cameroon: { zh: "喀麦隆", iso2: "cm" },
  Algeria: { zh: "阿尔及利亚", iso2: "dz" },
  Egypt: { zh: "埃及", iso2: "eg" },
  "Saudi Arabia": { zh: "沙特阿拉伯", iso2: "sa" },
  Iran: { zh: "伊朗", iso2: "ir" },
  Peru: { zh: "秘鲁", iso2: "pe" },
  Chile: { zh: "智利", iso2: "cl" },
  Austria: { zh: "奥地利", iso2: "at" },
  Norway: { zh: "挪威", iso2: "no" },
  Greece: { zh: "希腊", iso2: "gr" },
  "New Zealand": { zh: "新西兰", iso2: "nz" },
  "Costa Rica": { zh: "哥斯达黎加", iso2: "cr" },
  Panama: { zh: "巴拿马", iso2: "pa" },
  Jamaica: { zh: "牙买加", iso2: "jm" },
  Uzbekistan: { zh: "乌兹别克斯坦", iso2: "uz" },
  Jordan: { zh: "约旦", iso2: "jo" },
  "Cape Verde": { zh: "佛得角", iso2: "cv" },
  "Cape Verde Islands": { zh: "佛得角", iso2: "cv" },
  "Congo DR": { zh: "刚果（金）", iso2: "cd" },
  Iraq: { zh: "伊拉克", iso2: "iq" },
  Panama_: { zh: "巴拿马", iso2: "pa" },
};

/** 英文队名 → 中文名（未知则原样返回）。 */
export function teamZh(name: string): string {
  return NATIONS[name]?.zh ?? name;
}

/** 按语言取队名：DB 存的就是英文原名（football-data 拼写），en 直出、zh 查表。 */
export function teamName(name: string, locale: "zh" | "en"): string {
  return locale === "en" ? name : teamZh(name);
}

// DB 的 stage/grp 存中文（如 "小组赛"、"A 组"）——en 视图在渲染层反查，不动库。
const STAGE_EN: Record<string, string> = {
  小组赛: "Group Stage",
  "32强": "Round of 32",
  "1/16决赛": "Round of 32",
  "1/8决赛": "Round of 16",
  "16强": "Round of 16",
  "1/4决赛": "Quarter-final",
  "8强": "Quarter-final",
  半决赛: "Semi-final",
  季军赛: "Third place",
  决赛: "Final",
};

/** 赛段名（zh 原样；en 反查表，未知原样返回）。 */
export function stageName(stage: string, locale: "zh" | "en"): string {
  if (locale === "zh") return stage;
  return STAGE_EN[stage.replace(/\s/g, "")] ?? stage;
}

/** 组名（"A 组" ↔ "Group A"，按 A-L 字母提取）。 */
export function groupName(grp: string, locale: "zh" | "en"): string {
  const letter = grp.match(/[A-L]/)?.[0];
  if (!letter) return grp;
  return locale === "en" ? `Group ${letter}` : `${letter} 组`;
}

/** 英文队名 → 国旗图片 URL（未知返回 null）。 */
export function flagUrl(name: string): string | null {
  const iso2 = NATIONS[name]?.iso2;
  return iso2 ? `https://flagcdn.com/w80/${iso2}.png` : null;
}
