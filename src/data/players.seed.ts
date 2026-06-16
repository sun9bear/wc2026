// 球员人气榜候选种子（策展 ~40 球星 + 后续射手榜自动补充）。
// 真理源：docs/PLAYER-POPULARITY-DESIGN.md §3-4。
// teamName 必须是 src/lib/football/teams.ts NATIONS 的键（否则国旗/译名解析失败——见 players.seed.test.ts 守卫）。
// wikiTitle = 英文维基条目名（下划线连接），供 L2 热度分（维基 pageviews）按此抓取。
// MVP 无照片（版权干净）、无球衣号（各届号码不稳，留空避免错误数据）。

export type PlayerPosition = "GK" | "DF" | "MF" | "FW";

export interface PlayerSeed {
  slug: string; // ASCII kebab-case，URL/QR 用，全局唯一
  name: string; // 拉丁原名（显示用）
  teamName: string; // 必须 ∈ NATIONS 键（football-data 英文拼写）
  countryIso: string; // ISO2 小写（flagcdn；英伦三队用 gb-eng 等）
  position: PlayerPosition;
  wikiTitle: string; // 英文维基条目名（下划线）
}

export const PLAYERS: PlayerSeed[] = [
  { slug: "lionel-messi", name: "Lionel Messi", teamName: "Argentina", countryIso: "ar", position: "FW", wikiTitle: "Lionel_Messi" },
  { slug: "lautaro-martinez", name: "Lautaro Martínez", teamName: "Argentina", countryIso: "ar", position: "FW", wikiTitle: "Lautaro_Martínez" },
  { slug: "julian-alvarez", name: "Julián Álvarez", teamName: "Argentina", countryIso: "ar", position: "FW", wikiTitle: "Julián_Álvarez" },
  { slug: "vinicius-junior", name: "Vinícius Júnior", teamName: "Brazil", countryIso: "br", position: "FW", wikiTitle: "Vinícius_Júnior" },
  { slug: "rodrygo", name: "Rodrygo", teamName: "Brazil", countryIso: "br", position: "FW", wikiTitle: "Rodrygo" },
  { slug: "endrick", name: "Endrick", teamName: "Brazil", countryIso: "br", position: "FW", wikiTitle: "Endrick" },
  { slug: "kylian-mbappe", name: "Kylian Mbappé", teamName: "France", countryIso: "fr", position: "FW", wikiTitle: "Kylian_Mbappé" },
  { slug: "antoine-griezmann", name: "Antoine Griezmann", teamName: "France", countryIso: "fr", position: "FW", wikiTitle: "Antoine_Griezmann" },
  { slug: "aurelien-tchouameni", name: "Aurélien Tchouaméni", teamName: "France", countryIso: "fr", position: "MF", wikiTitle: "Aurélien_Tchouaméni" },
  { slug: "jude-bellingham", name: "Jude Bellingham", teamName: "England", countryIso: "gb-eng", position: "MF", wikiTitle: "Jude_Bellingham" },
  { slug: "harry-kane", name: "Harry Kane", teamName: "England", countryIso: "gb-eng", position: "FW", wikiTitle: "Harry_Kane" },
  { slug: "bukayo-saka", name: "Bukayo Saka", teamName: "England", countryIso: "gb-eng", position: "FW", wikiTitle: "Bukayo_Saka" },
  { slug: "phil-foden", name: "Phil Foden", teamName: "England", countryIso: "gb-eng", position: "MF", wikiTitle: "Phil_Foden" },
  { slug: "lamine-yamal", name: "Lamine Yamal", teamName: "Spain", countryIso: "es", position: "FW", wikiTitle: "Lamine_Yamal" },
  { slug: "pedri", name: "Pedri", teamName: "Spain", countryIso: "es", position: "MF", wikiTitle: "Pedri" },
  { slug: "rodri", name: "Rodri", teamName: "Spain", countryIso: "es", position: "MF", wikiTitle: "Rodri" },
  { slug: "cristiano-ronaldo", name: "Cristiano Ronaldo", teamName: "Portugal", countryIso: "pt", position: "FW", wikiTitle: "Cristiano_Ronaldo" },
  { slug: "bruno-fernandes", name: "Bruno Fernandes", teamName: "Portugal", countryIso: "pt", position: "MF", wikiTitle: "Bruno_Fernandes" },
  { slug: "rafael-leao", name: "Rafael Leão", teamName: "Portugal", countryIso: "pt", position: "FW", wikiTitle: "Rafael_Leão" },
  { slug: "jamal-musiala", name: "Jamal Musiala", teamName: "Germany", countryIso: "de", position: "MF", wikiTitle: "Jamal_Musiala" },
  { slug: "florian-wirtz", name: "Florian Wirtz", teamName: "Germany", countryIso: "de", position: "MF", wikiTitle: "Florian_Wirtz" },
  { slug: "kai-havertz", name: "Kai Havertz", teamName: "Germany", countryIso: "de", position: "FW", wikiTitle: "Kai_Havertz" },
  { slug: "virgil-van-dijk", name: "Virgil van Dijk", teamName: "Netherlands", countryIso: "nl", position: "DF", wikiTitle: "Virgil_van_Dijk" },
  { slug: "cody-gakpo", name: "Cody Gakpo", teamName: "Netherlands", countryIso: "nl", position: "FW", wikiTitle: "Cody_Gakpo" },
  { slug: "kevin-de-bruyne", name: "Kevin De Bruyne", teamName: "Belgium", countryIso: "be", position: "MF", wikiTitle: "Kevin_De_Bruyne" },
  { slug: "jeremy-doku", name: "Jérémy Doku", teamName: "Belgium", countryIso: "be", position: "FW", wikiTitle: "Jérémy_Doku" },
  { slug: "erling-haaland", name: "Erling Haaland", teamName: "Norway", countryIso: "no", position: "FW", wikiTitle: "Erling_Haaland" },
  { slug: "luka-modric", name: "Luka Modrić", teamName: "Croatia", countryIso: "hr", position: "MF", wikiTitle: "Luka_Modrić" },
  { slug: "federico-valverde", name: "Federico Valverde", teamName: "Uruguay", countryIso: "uy", position: "MF", wikiTitle: "Federico_Valverde" },
  { slug: "darwin-nunez", name: "Darwin Núñez", teamName: "Uruguay", countryIso: "uy", position: "FW", wikiTitle: "Darwin_Núñez" },
  { slug: "christian-pulisic", name: "Christian Pulisic", teamName: "United States", countryIso: "us", position: "FW", wikiTitle: "Christian_Pulisic" },
  { slug: "alphonso-davies", name: "Alphonso Davies", teamName: "Canada", countryIso: "ca", position: "DF", wikiTitle: "Alphonso_Davies" },
  { slug: "santiago-gimenez", name: "Santiago Giménez", teamName: "Mexico", countryIso: "mx", position: "FW", wikiTitle: "Santiago_Giménez" },
  { slug: "achraf-hakimi", name: "Achraf Hakimi", teamName: "Morocco", countryIso: "ma", position: "DF", wikiTitle: "Achraf_Hakimi" },
  { slug: "mohamed-salah", name: "Mohamed Salah", teamName: "Egypt", countryIso: "eg", position: "FW", wikiTitle: "Mohamed_Salah" },
  { slug: "victor-osimhen", name: "Victor Osimhen", teamName: "Nigeria", countryIso: "ng", position: "FW", wikiTitle: "Victor_Osimhen" },
  { slug: "sadio-mane", name: "Sadio Mané", teamName: "Senegal", countryIso: "sn", position: "FW", wikiTitle: "Sadio_Mané" },
  { slug: "takefusa-kubo", name: "Takefusa Kubo", teamName: "Japan", countryIso: "jp", position: "FW", wikiTitle: "Takefusa_Kubo" },
  { slug: "son-heung-min", name: "Son Heung-min", teamName: "South Korea", countryIso: "kr", position: "FW", wikiTitle: "Son_Heung-min" },
  { slug: "robert-lewandowski", name: "Robert Lewandowski", teamName: "Poland", countryIso: "pl", position: "FW", wikiTitle: "Robert_Lewandowski" },
  { slug: "luis-diaz", name: "Luis Díaz", teamName: "Colombia", countryIso: "co", position: "FW", wikiTitle: "Luis_Díaz" },
];
