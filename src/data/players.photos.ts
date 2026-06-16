// 生成文件（scripts/fetch-player-photos.ts）：球员 Wikimedia Commons 自由授权头像 + 署名。
// 仅含 CC/PD/CC0 自由许可图；非自由/无图者回落国旗。请勿手改，重跑脚本刷新。

export interface PlayerPhoto {
  url: string;
  author: string;
  license: string;
}

export const PHOTOS: Record<string, PlayerPhoto> = {
  "lionel-messi": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Lionel_Messi_White_House_2026_%283x4_cropped%29.jpg/330px-Lionel_Messi_White_House_2026_%283x4_cropped%29.jpg",
    "author": "The White House",
    "license": "Public domain"
  },
  "lautaro-martinez": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Lautaro_Martinez_ARGENTINA_VS_VENEZUELA_2017.jpg/330px-Lautaro_Martinez_ARGENTINA_VS_VENEZUELA_2017.jpg",
    "author": "Agencia de Noticias ANDES",
    "license": "CC BY-SA 2.0"
  },
  "julian-alvarez": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/0/03/Argentina_national_football_team_-_2_-_2022_%28Juli%C3%A1n_%C3%81lvarez%29.jpg",
    "author": "Argentina.gob.ar",
    "license": "CC BY 4.0"
  },
  "vinicius-junior": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/2023_05_06_Final_de_la_Copa_del_Rey_-_52879242230_%28cropped%29.jpg/330px-2023_05_06_Final_de_la_Copa_del_Rey_-_52879242230_%28cropped%29.jpg",
    "author": "Junta de Andalucía",
    "license": "CC BY-SA 2.0"
  },
  "rodrygo": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Rodrygo_2023_%28cropped%29.jpg/330px-Rodrygo_2023_%28cropped%29.jpg",
    "author": "Junta de Andalucía",
    "license": "CC BY-SA 2.0"
  },
  "kylian-mbappe": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Picture_with_Mbapp%C3%A9_%28cropped_and_rotated%29.jpg/330px-Picture_with_Mbapp%C3%A9_%28cropped_and_rotated%29.jpg",
    "author": "Helfer Emilio",
    "license": "CC0"
  },
  "antoine-griezmann": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/FRA-ARG_%2810%29_%28cropped%29.jpg/330px-FRA-ARG_%2810%29_%28cropped%29.jpg",
    "author": "Антон Зайцев",
    "license": "CC BY-SA 3.0"
  },
  "aurelien-tchouameni": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/0/0f/2025_04_26_Final_de_la_Copa_del_Rey_-_Aur%C3%A9lien_Tchouam%C3%A9ni.jpg",
    "author": "Junta de Andalucía",
    "license": "CC BY-SA 2.0"
  },
  "jude-bellingham": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Jude_Bellingham_-_240422_190551-2_%28cropped%29.jpg/330px-25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Jude_Bellingham_-_240422_190551-2_%28cropped%29.jpg",
    "author": "Barcex",
    "license": "CC BY-SA 4.0"
  },
  "harry-kane": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Harry_Kane_on_October_10%2C_2023.jpg/330px-Harry_Kane_on_October_10%2C_2023.jpg",
    "author": "UK Prime Minister",
    "license": "CC BY 2.0"
  },
  "cristiano-ronaldo": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/President_Donald_Trump_meets_with_Cristiano_Ronaldo_in_the_Oval_Office_%2854933344262%29_%28cropped_and_rotated%29.jpg/330px-President_Donald_Trump_meets_with_Cristiano_Ronaldo_in_the_Oval_Office_%2854933344262%29_%28cropped_and_rotated%29.jpg",
    "author": "The White House",
    "license": "Public domain"
  },
  "bruno-fernandes": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Bruno_Fernandes_USMNT_v_Portugal_Mar_31_2026-27_%28cropped%29.jpg/330px-Bruno_Fernandes_USMNT_v_Portugal_Mar_31_2026-27_%28cropped%29.jpg",
    "author": "Bryan Berlin",
    "license": "CC BY-SA 4.0"
  },
  "rafael-leao": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/RafaelLe%C3%A3oPortugal23.jpg/330px-RafaelLe%C3%A3oPortugal23.jpg",
    "author": "Agência Lusa",
    "license": "CC BY 3.0"
  },
  "jamal-musiala": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Jamal_Musiala_2022_%28cropped%29.jpg/330px-Jamal_Musiala_2022_%28cropped%29.jpg",
    "author": "crop by ArsenalGhanaPartey",
    "license": "CC BY-SA 4.0"
  },
  "kevin-de-bruyne": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_%28cropped%29.jpg/330px-Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_%28cropped%29.jpg",
    "author": "Bryan Berlin",
    "license": "CC BY-SA 4.0"
  },
  "jeremy-doku": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/J%C3%A9r%C3%A9my_Doku_USMNT_v_Belgium_Mar_28_2026-27_%28cropped%29.jpg/330px-J%C3%A9r%C3%A9my_Doku_USMNT_v_Belgium_Mar_28_2026-27_%28cropped%29.jpg",
    "author": "Bryan Berlin",
    "license": "CC BY-SA 4.0"
  },
  "erling-haaland": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Erling_Haaland_Morocco_v_Norway_7_June_2026-51.jpg/330px-Erling_Haaland_Morocco_v_Norway_7_June_2026-51.jpg",
    "author": "Bryan Berlin",
    "license": "CC BY-SA 4.0"
  },
  "luka-modric": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Ofrenda_de_la_Liga_y_la_Champions-57-L.Mill%C3%A1n_%2852109310843%29_%28Luka_Modri%C4%87%29.jpg/330px-Ofrenda_de_la_Liga_y_la_Champions-57-L.Mill%C3%A1n_%2852109310843%29_%28Luka_Modri%C4%87%29.jpg",
    "author": "Fotografías Archimadrid.es",
    "license": "CC BY 2.0"
  },
  "federico-valverde": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Federico_Valverde_2021_%28cropped%29.jpg/330px-Federico_Valverde_2021_%28cropped%29.jpg",
    "author": "Real Madrid",
    "license": "CC BY 3.0"
  },
  "achraf-hakimi": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Achraf_Hakimi_Morocco_v_Norway_7_June_2026-32.jpg/330px-Achraf_Hakimi_Morocco_v_Norway_7_June_2026-32.jpg",
    "author": "Bryan Berlin",
    "license": "CC BY-SA 4.0"
  },
  "mohamed-salah": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mohamed_Salah_2018.jpg/330px-Mohamed_Salah_2018.jpg",
    "author": "Анна Нэсси",
    "license": "CC BY-SA 3.0"
  },
  "victor-osimhen": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Victor-osimhen-nigeria-2024-3-4.jpg/330px-Victor-osimhen-nigeria-2024-3-4.jpg",
    "author": "Fédération Guinéenne Football",
    "license": "Public domain"
  },
  "sadio-mane": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Sadio_Mane_Al-Nassr.jpg/330px-Sadio_Mane_Al-Nassr.jpg",
    "author": "Unknown authorUnknown author",
    "license": "CC BY 3.0"
  },
  "takefusa-kubo": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Takefusa_Kubo_2019.png/330px-Takefusa_Kubo_2019.png",
    "author": "Real Madrid",
    "license": "CC BY 3.0"
  },
  "bukayo-saka": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/4/44/Bukayo_Saka_2022-11-21_1.jpg",
    "author": "Hossein Zohrevand",
    "license": "CC BY 4.0"
  },
  "phil-foden": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_1DX_2613%2C_Phil_Foden.jpg/330px-2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_1DX_2613%2C_Phil_Foden.jpg",
    "author": "Steffen Prößdorf",
    "license": "CC BY-SA 4.0"
  },
  "florian-wirtz": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Florian_Wirtz%2C_2022-07-31%2C_Saisoner%C3%B6ffnung_Bayer_04%2C_Leverkusen_%281%29_%28cropped%29.jpg/330px-Florian_Wirtz%2C_2022-07-31%2C_Saisoner%C3%B6ffnung_Bayer_04%2C_Leverkusen_%281%29_%28cropped%29.jpg",
    "author": "Pyaet",
    "license": "CC BY-SA 4.0"
  },
  "kai-havertz": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/1_kai_havertz_2026_%28cropped%29.jpg/330px-1_kai_havertz_2026_%28cropped%29.jpg",
    "author": "Chensiyuan",
    "license": "CC BY-SA 4.0"
  },
  "darwin-nunez": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Darwin_N%C3%BA%C3%B1ez_%28cropped%29.jpg/330px-Darwin_N%C3%BA%C3%B1ez_%28cropped%29.jpg",
    "author": "Steffen Prößdorf",
    "license": "CC BY-SA 4.0"
  },
  "christian-pulisic": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Christian_Pulisic_USMNT_v_Belgium_Mar_28_2026-73_%28cropped%29.jpg/330px-Christian_Pulisic_USMNT_v_Belgium_Mar_28_2026-73_%28cropped%29.jpg",
    "author": "Bryan Berlin",
    "license": "CC BY-SA 4.0"
  },
  "son-heung-min": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/BFA_2023_-2_Heung-Min_Son_%28cropped%29.jpg/330px-BFA_2023_-2_Heung-Min_Son_%28cropped%29.jpg",
    "author": "Ujishadow",
    "license": "CC BY-SA 4.0"
  },
  "robert-lewandowski": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/2019147183134_2019-05-27_Fussball_1.FC_Kaiserslautern_vs_FC_Bayern_M%C3%BCnchen_-_Sven_-_1D_X_MK_II_-_0228_-_B70I8527_%28cropped%29.jpg/330px-2019147183134_2019-05-27_Fussball_1.FC_Kaiserslautern_vs_FC_Bayern_M%C3%BCnchen_-_Sven_-_1D_X_MK_II_-_0228_-_B70I8527_%28cropped%29.jpg",
    "author": "Sven Mandel",
    "license": "CC BY-SA 4.0"
  },
  "lamine-yamal": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Lamine_Yamal_in_2025.jpg/330px-Lamine_Yamal_in_2025.jpg",
    "author": "Biso",
    "license": "CC BY 4.0"
  },
  "pedri": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Pedri.jpg/330px-Pedri.jpg",
    "author": "Biso",
    "license": "CC BY 4.0"
  },
  "cody-gakpo": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Cody_Gakpo_06042025_%282%29_%28cropped%29.jpg/330px-Cody_Gakpo_06042025_%282%29_%28cropped%29.jpg",
    "author": "Timmy96",
    "license": "CC0"
  },
  "alphonso-davies": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Alphonso_Davies_in_2022.jpg/330px-Alphonso_Davies_in_2022.jpg",
    "author": "Derivative work: Indopug",
    "license": "CC BY-SA 4.0"
  },
  "santiago-gimenez": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Santiago_Gim%C3%A9nez.png/330px-Santiago_Gim%C3%A9nez.png",
    "author": "Selección Nacional de México",
    "license": "CC BY 3.0"
  },
  "endrick": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Endrick-Palmeiras-Liverpool-abr24.jpg/330px-Endrick-Palmeiras-Liverpool-abr24.jpg",
    "author": "NullReason",
    "license": "CC BY-SA 4.0"
  },
  "virgil-van-dijk": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/20160604_AUT_NED_8876_%28cropped%29.jpg/330px-20160604_AUT_NED_8876_%28cropped%29.jpg",
    "author": "Ailura",
    "license": "CC BY-SA 3.0 at"
  },
  "luis-diaz": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/FC_RB_Salzburg_gegen_FC_Bayern_M%C3%BCnchen_%282026-01-06_Testspiel%29_40_%28Luiz_D%C3%ADaz%29.jpg/330px-FC_RB_Salzburg_gegen_FC_Bayern_M%C3%BCnchen_%282026-01-06_Testspiel%29_40_%28Luiz_D%C3%ADaz%29.jpg",
    "author": "Werner100359",
    "license": "CC BY-SA 4.0"
  }
};
