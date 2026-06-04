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
  Panama_: { zh: "巴拿马", iso2: "pa" },
};

/** 英文队名 → 中文名（未知则原样返回）。 */
export function teamZh(name: string): string {
  return NATIONS[name]?.zh ?? name;
}

/** 英文队名 → 国旗图片 URL（未知返回 null）。 */
export function flagUrl(name: string): string | null {
  const iso2 = NATIONS[name]?.iso2;
  return iso2 ? `https://flagcdn.com/w80/${iso2}.png` : null;
}
