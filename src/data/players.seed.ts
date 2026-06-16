// 球员人气榜候选种子（策展 ~40 球星 + 后续射手榜自动补充）。
// 真理源：docs/PLAYER-POPULARITY-DESIGN.md §3-4。
// teamName 必须是 src/lib/football/teams.ts NATIONS 的键（否则国旗/译名解析失败——见 players.seed.test.ts 守卫）。
// nameZh = 大陆常用译名（zh 树渲染用；非 zh 仍显示拉丁原名）。日韩用本名汉字（久保建英/孙兴慜）。
// wikiTitle = 英文维基条目名（下划线连接），供 L2 热度分（维基 pageviews）按此抓取。
// MVP 无照片（版权干净）、无球衣号（各届号码不稳，留空避免错误数据）。

export type PlayerPosition = "GK" | "DF" | "MF" | "FW";

export interface PlayerSeed {
  slug: string; // ASCII kebab-case，URL/QR 用，全局唯一
  name: string; // 拉丁原名（en/es/pt/de/fr 显示用）
  nameZh: string; // 大陆常用中文译名（zh 显示用）
  teamName: string; // 必须 ∈ NATIONS 键（football-data 英文拼写）
  countryIso: string; // ISO2 小写（flagcdn；英伦三队用 gb-eng 等）
  position: PlayerPosition;
  wikiTitle: string; // 英文维基条目名（下划线）
}

export const PLAYERS: PlayerSeed[] = [
  { slug: "lionel-messi", name: "Lionel Messi", nameZh: "梅西", teamName: "Argentina", countryIso: "ar", position: "FW", wikiTitle: "Lionel_Messi" },
  { slug: "lautaro-martinez", name: "Lautaro Martínez", nameZh: "劳塔罗", teamName: "Argentina", countryIso: "ar", position: "FW", wikiTitle: "Lautaro_Martínez" },
  { slug: "julian-alvarez", name: "Julián Álvarez", nameZh: "J·阿尔瓦雷斯", teamName: "Argentina", countryIso: "ar", position: "FW", wikiTitle: "Julián_Álvarez" },
  { slug: "vinicius-junior", name: "Vinícius Júnior", nameZh: "维尼修斯", teamName: "Brazil", countryIso: "br", position: "FW", wikiTitle: "Vinícius_Júnior" },
  { slug: "rodrygo", name: "Rodrygo", nameZh: "罗德里戈", teamName: "Brazil", countryIso: "br", position: "FW", wikiTitle: "Rodrygo" },
  { slug: "endrick", name: "Endrick", nameZh: "恩德里克", teamName: "Brazil", countryIso: "br", position: "FW", wikiTitle: "Endrick_(footballer,_born_2006)" },
  { slug: "kylian-mbappe", name: "Kylian Mbappé", nameZh: "姆巴佩", teamName: "France", countryIso: "fr", position: "FW", wikiTitle: "Kylian_Mbappé" },
  { slug: "antoine-griezmann", name: "Antoine Griezmann", nameZh: "格列兹曼", teamName: "France", countryIso: "fr", position: "FW", wikiTitle: "Antoine_Griezmann" },
  { slug: "aurelien-tchouameni", name: "Aurélien Tchouaméni", nameZh: "楚阿梅尼", teamName: "France", countryIso: "fr", position: "MF", wikiTitle: "Aurélien_Tchouaméni" },
  { slug: "jude-bellingham", name: "Jude Bellingham", nameZh: "贝林厄姆", teamName: "England", countryIso: "gb-eng", position: "MF", wikiTitle: "Jude_Bellingham" },
  { slug: "harry-kane", name: "Harry Kane", nameZh: "凯恩", teamName: "England", countryIso: "gb-eng", position: "FW", wikiTitle: "Harry_Kane" },
  { slug: "bukayo-saka", name: "Bukayo Saka", nameZh: "萨卡", teamName: "England", countryIso: "gb-eng", position: "FW", wikiTitle: "Bukayo_Saka" },
  { slug: "phil-foden", name: "Phil Foden", nameZh: "福登", teamName: "England", countryIso: "gb-eng", position: "MF", wikiTitle: "Phil_Foden" },
  { slug: "lamine-yamal", name: "Lamine Yamal", nameZh: "亚马尔", teamName: "Spain", countryIso: "es", position: "FW", wikiTitle: "Lamine_Yamal" },
  { slug: "pedri", name: "Pedri", nameZh: "佩德里", teamName: "Spain", countryIso: "es", position: "MF", wikiTitle: "Pedri" },
  { slug: "rodri", name: "Rodri", nameZh: "罗德里", teamName: "Spain", countryIso: "es", position: "MF", wikiTitle: "Rodri" },
  { slug: "cristiano-ronaldo", name: "Cristiano Ronaldo", nameZh: "C罗", teamName: "Portugal", countryIso: "pt", position: "FW", wikiTitle: "Cristiano_Ronaldo" },
  { slug: "bruno-fernandes", name: "Bruno Fernandes", nameZh: "B费", teamName: "Portugal", countryIso: "pt", position: "MF", wikiTitle: "Bruno_Fernandes" },
  { slug: "rafael-leao", name: "Rafael Leão", nameZh: "莱奥", teamName: "Portugal", countryIso: "pt", position: "FW", wikiTitle: "Rafael_Leão" },
  { slug: "jamal-musiala", name: "Jamal Musiala", nameZh: "穆西亚拉", teamName: "Germany", countryIso: "de", position: "MF", wikiTitle: "Jamal_Musiala" },
  { slug: "florian-wirtz", name: "Florian Wirtz", nameZh: "维尔茨", teamName: "Germany", countryIso: "de", position: "MF", wikiTitle: "Florian_Wirtz" },
  { slug: "kai-havertz", name: "Kai Havertz", nameZh: "哈弗茨", teamName: "Germany", countryIso: "de", position: "FW", wikiTitle: "Kai_Havertz" },
  { slug: "virgil-van-dijk", name: "Virgil van Dijk", nameZh: "范戴克", teamName: "Netherlands", countryIso: "nl", position: "DF", wikiTitle: "Virgil_van_Dijk" },
  { slug: "cody-gakpo", name: "Cody Gakpo", nameZh: "加克波", teamName: "Netherlands", countryIso: "nl", position: "FW", wikiTitle: "Cody_Gakpo" },
  { slug: "kevin-de-bruyne", name: "Kevin De Bruyne", nameZh: "德布劳内", teamName: "Belgium", countryIso: "be", position: "MF", wikiTitle: "Kevin_De_Bruyne" },
  { slug: "jeremy-doku", name: "Jérémy Doku", nameZh: "多库", teamName: "Belgium", countryIso: "be", position: "FW", wikiTitle: "Jérémy_Doku" },
  { slug: "erling-haaland", name: "Erling Haaland", nameZh: "哈兰德", teamName: "Norway", countryIso: "no", position: "FW", wikiTitle: "Erling_Haaland" },
  { slug: "luka-modric", name: "Luka Modrić", nameZh: "莫德里奇", teamName: "Croatia", countryIso: "hr", position: "MF", wikiTitle: "Luka_Modrić" },
  { slug: "federico-valverde", name: "Federico Valverde", nameZh: "巴尔韦德", teamName: "Uruguay", countryIso: "uy", position: "MF", wikiTitle: "Federico_Valverde" },
  { slug: "darwin-nunez", name: "Darwin Núñez", nameZh: "努涅斯", teamName: "Uruguay", countryIso: "uy", position: "FW", wikiTitle: "Darwin_Núñez" },
  { slug: "christian-pulisic", name: "Christian Pulisic", nameZh: "普利西奇", teamName: "United States", countryIso: "us", position: "FW", wikiTitle: "Christian_Pulisic" },
  { slug: "alphonso-davies", name: "Alphonso Davies", nameZh: "戴维斯", teamName: "Canada", countryIso: "ca", position: "DF", wikiTitle: "Alphonso_Davies" },
  { slug: "santiago-gimenez", name: "Santiago Giménez", nameZh: "希门尼斯", teamName: "Mexico", countryIso: "mx", position: "FW", wikiTitle: "Santiago_Giménez" },
  { slug: "achraf-hakimi", name: "Achraf Hakimi", nameZh: "阿什拉夫", teamName: "Morocco", countryIso: "ma", position: "DF", wikiTitle: "Achraf_Hakimi" },
  { slug: "mohamed-salah", name: "Mohamed Salah", nameZh: "萨拉赫", teamName: "Egypt", countryIso: "eg", position: "FW", wikiTitle: "Mohamed_Salah" },
  { slug: "victor-osimhen", name: "Victor Osimhen", nameZh: "奥斯梅恩", teamName: "Nigeria", countryIso: "ng", position: "FW", wikiTitle: "Victor_Osimhen" },
  { slug: "sadio-mane", name: "Sadio Mané", nameZh: "马内", teamName: "Senegal", countryIso: "sn", position: "FW", wikiTitle: "Sadio_Mané" },
  { slug: "takefusa-kubo", name: "Takefusa Kubo", nameZh: "久保建英", teamName: "Japan", countryIso: "jp", position: "FW", wikiTitle: "Takefusa_Kubo" },
  { slug: "son-heung-min", name: "Son Heung-min", nameZh: "孙兴慜", teamName: "South Korea", countryIso: "kr", position: "FW", wikiTitle: "Son_Heung-min" },
  { slug: "robert-lewandowski", name: "Robert Lewandowski", nameZh: "莱万多夫斯基", teamName: "Poland", countryIso: "pl", position: "FW", wikiTitle: "Robert_Lewandowski" },
  { slug: "luis-diaz", name: "Luis Díaz", nameZh: "路易斯·迪亚斯", teamName: "Colombia", countryIso: "co", position: "FW", wikiTitle: "Luis_Díaz_(footballer,_born_1997)" },
];

/** slug → 中文常用译名（zh 渲染用；非 zh 仍显示拉丁原名）。 */
export const nameZhBySlug = new Map<string, string>(PLAYERS.map((p) => [p.slug, p.nameZh]));
