// 生成文件（scripts/fetch-player-gallery.ts）：球员 Wikimedia Commons 自由授权相册（≤6 张）+ 逐图署名。
// 仅含 CC/PD/CC0 自由许可图；非自由/不足 2 张者无相册。请勿手改，重跑脚本刷新（只增不减）。

export interface PlayerGalleryItem {
  url: string;
  author: string;
  license: string;
  file: string;
}

export const GALLERY: Record<string, PlayerGalleryItem[]> = {
  "lionel-messi": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Lionel_Messi_White_House_2026_%283x4_cropped%29.jpg/330px-Lionel_Messi_White_House_2026_%283x4_cropped%29.jpg",
      "author": "The White House",
      "license": "Public domain",
      "file": "File:Lionel Messi White House 2026 (3x4 cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Academy_Sports_%2B_Outdoors_-_Sarah_Stierch_-_May_2024_21.jpg/330px-Academy_Sports_%2B_Outdoors_-_Sarah_Stierch_-_May_2024_21.jpg",
      "author": "Missvain",
      "license": "CC BY 4.0",
      "file": "File:Academy Sports + Outdoors - Sarah Stierch - May 2024 21.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Camp_Nou_Experience_%28Ank_Kumar%2C_INFOSYS%29_01.jpg/330px-Camp_Nou_Experience_%28Ank_Kumar%2C_INFOSYS%29_01.jpg",
      "author": "Ank Kumar",
      "license": "CC BY-SA 4.0",
      "file": "File:Camp Nou Experience (Ank Kumar, INFOSYS) 01.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Camp_Nou_Experience_%28Ank_Kumar%2C_INFOSYS%29_02.jpg/330px-Camp_Nou_Experience_%28Ank_Kumar%2C_INFOSYS%29_02.jpg",
      "author": "Ank Kumar",
      "license": "CC BY-SA 4.0",
      "file": "File:Camp Nou Experience (Ank Kumar, INFOSYS) 02.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Predio_Deportivo_Lionel_Andr%C3%A9s_Messi_-_BugWarp_11.jpg/330px-Predio_Deportivo_Lionel_Andr%C3%A9s_Messi_-_BugWarp_11.jpg",
      "author": "BugWarp",
      "license": "CC BY-SA 4.0",
      "file": "File:Predio Deportivo Lionel Andrés Messi - BugWarp 11.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/FIFA_Ballon_D%E2%80%98OR_Awards%2C_FIFA_Museum%2C_Zurich_09.jpg/330px-FIFA_Ballon_D%E2%80%98OR_Awards%2C_FIFA_Museum%2C_Zurich_09.jpg",
      "author": "Ank kumar",
      "license": "CC BY-SA 4.0",
      "file": "File:FIFA Ballon D‘OR Awards, FIFA Museum, Zurich 09.jpg"
    }
  ],
  "lautaro-martinez": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lautaro_Mart%C3%ADnez_%28cropped%29.jpg/330px-Lautaro_Mart%C3%ADnez_%28cropped%29.jpg",
      "author": "Agencia de Noticias ANDES",
      "license": "CC BY-SA 2.0",
      "file": "File:Lautaro Martínez (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/ARGENTINA_vs_COLOMBIA_SUDAMERICANO_SUB_20_%2832673012475%29.jpg/330px-ARGENTINA_vs_COLOMBIA_SUDAMERICANO_SUB_20_%2832673012475%29.jpg",
      "author": "Agencia de Noticias ANDES",
      "license": "CC BY-SA 2.0",
      "file": "File:ARGENTINA vs COLOMBIA SUDAMERICANO SUB 20 (32673012475).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/ARGENTINA_VS_VENEZUELA_SUB_20_5.jpg/330px-ARGENTINA_VS_VENEZUELA_SUB_20_5.jpg",
      "author": "Agencia de Noticias ANDES",
      "license": "CC BY-SA 2.0",
      "file": "File:ARGENTINA VS VENEZUELA SUB 20 5.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/02_07_2019_Partida_de_futebol_Brasil_x_Argentina_%2848190424142%29.jpg/330px-02_07_2019_Partida_de_futebol_Brasil_x_Argentina_%2848190424142%29.jpg",
      "author": "Palácio do Planalto from Brasilia, Brasil",
      "license": "CC BY 2.0",
      "file": "File:02 07 2019 Partida de futebol Brasil x Argentina (48190424142).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/FC_Internazionale_Milano_v_US_Sassuolo_Calcio%2C_21_September_2025_-_06.jpg/330px-FC_Internazionale_Milano_v_US_Sassuolo_Calcio%2C_21_September_2025_-_06.jpg",
      "author": "SonoGrazy",
      "license": "CC BY-SA 4.0",
      "file": "File:FC Internazionale Milano v US Sassuolo Calcio, 21 September 2025 - 06.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Edison_ndreca_inter_egnatia_italy.jpg/330px-Edison_ndreca_inter_egnatia_italy.jpg",
      "author": "Erjonallaraj",
      "license": "CC BY-SA 4.0",
      "file": "File:Edison ndreca inter egnatia italy.jpg"
    }
  ],
  "julian-alvarez": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Juli%C3%A1n_%C3%81lvarez_%28footballer%29_2023.jpg/330px-Juli%C3%A1n_%C3%81lvarez_%28footballer%29_2023.jpg",
      "author": "pantkiewicz",
      "license": "CC BY-SA 2.0",
      "file": "File:Julián Álvarez (footballer) 2023.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Manchester_City_dressing_room_2022.jpg/330px-Manchester_City_dressing_room_2022.jpg",
      "author": "Christian David",
      "license": "CC BY-SA 4.0",
      "file": "File:Manchester City dressing room 2022.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Yokohama_F._Marinos_-_Manchester_City_%283-5%29_-_53075490460.jpg/330px-Yokohama_F._Marinos_-_Manchester_City_%283-5%29_-_53075490460.jpg",
      "author": "pantkiewicz",
      "license": "CC BY-SA 2.0",
      "file": "File:Yokohama F. Marinos - Manchester City (3-5) - 53075490460.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Yokohama_F._Marinos_-_Manchester_City_%283-5%29_-_53074500142.jpg/330px-Yokohama_F._Marinos_-_Manchester_City_%283-5%29_-_53074500142.jpg",
      "author": "pantkiewicz",
      "license": "CC BY-SA 2.0",
      "file": "File:Yokohama F. Marinos - Manchester City (3-5) - 53074500142.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Yokohama_F._Marinos_-_Manchester_City_%283-5%29_-_53075072816.jpg/330px-Yokohama_F._Marinos_-_Manchester_City_%283-5%29_-_53075072816.jpg",
      "author": "pantkiewicz",
      "license": "CC BY-SA 2.0",
      "file": "File:Yokohama F. Marinos - Manchester City (3-5) - 53075072816.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Yokohama_F._Marinos_-_Manchester_City_%283-5%29_-_53075578208.jpg/330px-Yokohama_F._Marinos_-_Manchester_City_%283-5%29_-_53075578208.jpg",
      "author": "pantkiewicz",
      "license": "CC BY-SA 2.0",
      "file": "File:Yokohama F. Marinos - Manchester City (3-5) - 53075578208.jpg"
    }
  ],
  "rodrygo": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Rodrygo_2023_%28cropped%29.jpg/330px-Rodrygo_2023_%28cropped%29.jpg",
      "author": "Junta de Andalucía",
      "license": "CC BY-SA 2.0",
      "file": "File:Rodrygo 2023 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Ofrenda_de_la_Liga_y_la_Champions-50-L.Mill%C3%A1n_%2852109789010%29.jpg/330px-Ofrenda_de_la_Liga_y_la_Champions-50-L.Mill%C3%A1n_%2852109789010%29.jpg",
      "author": "Fotografías Archimadrid.es",
      "license": "CC BY 2.0",
      "file": "File:Ofrenda de la Liga y la Champions-50-L.Millán (52109789010).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Ofrenda_de_la_Liga_y_la_Champions-57-L.Mill%C3%A1n_%2852109310843%29.jpg/330px-Ofrenda_de_la_Liga_y_la_Champions-57-L.Mill%C3%A1n_%2852109310843%29.jpg",
      "author": "Fotografías Archimadrid.es",
      "license": "CC BY 2.0",
      "file": "File:Ofrenda de la Liga y la Champions-57-L.Millán (52109310843).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/2023_05_06_Final_de_la_Copa_del_Rey_-_52878867076.jpg/330px-2023_05_06_Final_de_la_Copa_del_Rey_-_52878867076.jpg",
      "author": "Junta de Andalucía",
      "license": "CC BY-SA 2.0",
      "file": "File:2023 05 06 Final de la Copa del Rey - 52878867076.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/2023_05_06_Final_de_la_Copa_del_Rey_-_52879244560.jpg/330px-2023_05_06_Final_de_la_Copa_del_Rey_-_52879244560.jpg",
      "author": "Junta de Andalucía",
      "license": "CC BY-SA 2.0",
      "file": "File:2023 05 06 Final de la Copa del Rey - 52879244560.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/2023_05_06_Final_de_la_Copa_del_Rey_-_52879024229.jpg/330px-2023_05_06_Final_de_la_Copa_del_Rey_-_52879024229.jpg",
      "author": "Junta de Andalucía",
      "license": "CC BY-SA 2.0",
      "file": "File:2023 05 06 Final de la Copa del Rey - 52879024229.jpg"
    }
  ],
  "endrick": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Endrick_sele%C3%A7%C3%A3o_vs_inglaterra.jpg/330px-Endrick_sele%C3%A7%C3%A3o_vs_inglaterra.jpg",
      "author": "Thiago Arantes",
      "license": "CC BY-SA 4.0",
      "file": "File:Endrick seleção vs inglaterra.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Angel-Arteaga-Endrick-Palmeiras-Liverpool-abr24.jpg/330px-Angel-Arteaga-Endrick-Palmeiras-Liverpool-abr24.jpg",
      "author": "Sepguilherme",
      "license": "CC BY-SA 4.0",
      "file": "File:Angel-Arteaga-Endrick-Palmeiras-Liverpool-abr24.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Jude_Bellingham_and_Endrick_in_2024.jpg/330px-Jude_Bellingham_and_Endrick_in_2024.jpg",
      "author": "MohaESP88",
      "license": "CC BY 3.0",
      "file": "File:Jude Bellingham and Endrick in 2024.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Endrick-Palmeiras-Liverpool-abr24-4.jpg/330px-Endrick-Palmeiras-Liverpool-abr24-4.jpg",
      "author": "Sepguilherme",
      "license": "CC BY-SA 4.0",
      "file": "File:Endrick-Palmeiras-Liverpool-abr24-4.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Palmeiras-bragantino-fev2023-01.jpg/330px-Palmeiras-bragantino-fev2023-01.jpg",
      "author": "Sepguilherme",
      "license": "CC BY-SA 4.0",
      "file": "File:Palmeiras-bragantino-fev2023-01.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Palmeiras-bragantino-fev2023-02.jpg/330px-Palmeiras-bragantino-fev2023-02.jpg",
      "author": "Sepguilherme",
      "license": "CC BY-SA 4.0",
      "file": "File:Palmeiras-bragantino-fev2023-02.jpg"
    }
  ],
  "kylian-mbappe": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Mbappe_Messi_Neymar.jpg/330px-Mbappe_Messi_Neymar.jpg",
      "author": "Bigmatbasket",
      "license": "CC BY-SA 4.0",
      "file": "File:Mbappe Messi Neymar.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Picture_with_Mbapp%C3%A9_%28cropped_and_rotated%29.jpg/330px-Picture_with_Mbapp%C3%A9_%28cropped_and_rotated%29.jpg",
      "author": "Helfer Emilio",
      "license": "CC0",
      "file": "File:Picture with Mbappé (cropped and rotated).jpg"
    }
  ],
  "antoine-griezmann": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Antoine_Griezmann_%2851100409504%29_%28cropped%29.jpg/330px-Antoine_Griezmann_%2851100409504%29_%28cropped%29.jpg",
      "author": "Biser Todorov (User:Biso) from Sofia, Bulgaria",
      "license": "CC BY-SA 2.0",
      "file": "File:Antoine Griezmann (51100409504) (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/PSG_attacking_vs_Atletico_Madrid_Club_World_Cup.jpg/330px-PSG_attacking_vs_Atletico_Madrid_Club_World_Cup.jpg",
      "author": "Paul Vaurie",
      "license": "CC0",
      "file": "File:PSG attacking vs Atletico Madrid Club World Cup.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Bulgaria_vs_France_7-10-2017.jpg/330px-Bulgaria_vs_France_7-10-2017.jpg",
      "author": "Biser Todorov",
      "license": "CC BY 4.0",
      "file": "File:Bulgaria vs France 7-10-2017.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/FC_Red_Bull_Salzburg_gegen_CF_Barcelona_%28Testspiel_4._August_2021%29_48.jpg/330px-FC_Red_Bull_Salzburg_gegen_CF_Barcelona_%28Testspiel_4._August_2021%29_48.jpg",
      "author": "Werner100359",
      "license": "CC0",
      "file": "File:FC Red Bull Salzburg gegen CF Barcelona (Testspiel 4. August 2021) 48.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Antoine_Griezmann_-_CdR_-_RM_v_ATL.jpg/330px-Antoine_Griezmann_-_CdR_-_RM_v_ATL.jpg",
      "author": "DSanchez17 from Hertfordshire, England",
      "license": "CC BY 2.0",
      "file": "File:Antoine Griezmann - CdR - RM v ATL.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Stade_France_-_Saint-Denis_%28FR93%29_-_2024-02-17_-_16.jpg/330px-Stade_France_-_Saint-Denis_%28FR93%29_-_2024-02-17_-_16.jpg",
      "author": "Chabe01",
      "license": "CC BY-SA 4.0",
      "file": "File:Stade France - Saint-Denis (FR93) - 2024-02-17 - 16.jpg"
    }
  ],
  "jude-bellingham": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Jude_Bellingham_during_an_EA_Sports_event_in_September_2024_2.jpg/330px-Jude_Bellingham_during_an_EA_Sports_event_in_September_2024_2.jpg",
      "author": "MohaESP88",
      "license": "CC BY 3.0",
      "file": "File:Jude Bellingham during an EA Sports event in September 2024 2.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/25th_Laureus_World_Sports_Awards_-_240422_205212_%28cropped%29.jpg/330px-25th_Laureus_World_Sports_Awards_-_240422_205212_%28cropped%29.jpg",
      "author": "Barcex",
      "license": "CC BY-SA 4.0",
      "file": "File:25th Laureus World Sports Awards - 240422 205212 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Jude_Bellingham_-_240422_190551-2_%28cropped%29.jpg/330px-25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Jude_Bellingham_-_240422_190551-2_%28cropped%29.jpg",
      "author": "Barcex",
      "license": "CC BY-SA 4.0",
      "file": "File:25th Laureus World Sports Awards - Red Carpet - Jude Bellingham - 240422 190551-2 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/2025_04_26_Final_de_la_Copa_del_Rey_-_54482387776_%28Vin%C3%ADcius_J%C3%BAnior%2C_Jude_Bellingham_e_Rodrygo_Go%C3%A9s%29_%28cropped%29.jpg/330px-2025_04_26_Final_de_la_Copa_del_Rey_-_54482387776_%28Vin%C3%ADcius_J%C3%BAnior%2C_Jude_Bellingham_e_Rodrygo_Go%C3%A9s%29_%28cropped%29.jpg",
      "author": "Junta de Andalucía",
      "license": "CC BY-SA 2.0",
      "file": "File:2025 04 26 Final de la Copa del Rey - 54482387776 (Vinícius Júnior, Jude Bellingham e Rodrygo Goés) (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Jude_Bellingham_Birmingham_2019.jpg/330px-Jude_Bellingham_Birmingham_2019.jpg",
      "author": "Struway2",
      "license": "CC BY-SA 4.0",
      "file": "File:Jude Bellingham Birmingham 2019.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/5/56/Jude_Bellingham_2020_%28cropped2%29.jpg",
      "author": "Vyacheslav Evdokimov",
      "license": "CC BY-SA 3.0",
      "file": "File:Jude Bellingham 2020 (cropped2).jpg"
    }
  ],
  "harry-kane": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Harry_Kane_2023.jpg/330px-Harry_Kane_2023.jpg",
      "author": "Number 10",
      "license": "CC BY 2.0",
      "file": "File:Harry Kane 2023.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Manchester_United_v_Tottenham_Hotspur%2C_December_2016_%2808%29.JPG/330px-Manchester_United_v_Tottenham_Hotspur%2C_December_2016_%2808%29.JPG",
      "author": "Ardfern",
      "license": "CC BY-SA 4.0",
      "file": "File:Manchester United v Tottenham Hotspur, December 2016 (08).JPG"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/FC_Red_Bull_Salzburg_gegen_Bayern_M%C3%BCnchen_%282025-01-06_Testspiel%29_28.jpg/330px-FC_Red_Bull_Salzburg_gegen_Bayern_M%C3%BCnchen_%282025-01-06_Testspiel%29_28.jpg",
      "author": "Werner100359",
      "license": "CC BY-SA 4.0",
      "file": "File:FC Red Bull Salzburg gegen Bayern München (2025-01-06 Testspiel) 28.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Harry_Kane_%2835805453874%29.jpg/330px-Harry_Kane_%2835805453874%29.jpg",
      "author": "Brad Tutterow",
      "license": "CC BY 2.0",
      "file": "File:Harry Kane (35805453874).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Spurs_5_Chelsea_3_%2816175596592%29.jpg/330px-Spurs_5_Chelsea_3_%2816175596592%29.jpg",
      "author": "CFCUnofficial (Chelsea Debs)",
      "license": "CC BY-SA 2.0",
      "file": "File:Spurs 5 Chelsea 3 (16175596592).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Harry_Kane_%2824685589756%29.jpg/330px-Harry_Kane_%2824685589756%29.jpg",
      "author": "enviro warrior from england",
      "license": "CC BY-SA 2.0",
      "file": "File:Harry Kane (24685589756).jpg"
    }
  ],
  "phil-foden": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_1DX_2613%2C_Phil_Foden.jpg/330px-2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_1DX_2613%2C_Phil_Foden.jpg",
      "author": "Steffen Prößdorf",
      "license": "CC BY-SA 4.0",
      "file": "File:2023-10-04 Fußball, Männer, UEFA Champions League, RB Leipzig - Manchester City FC 1DX 2613, Phil Foden.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Foden_tattoo.jpg/330px-Foden_tattoo.jpg",
      "author": "AdamaiYugo",
      "license": "CC BY-SA 4.0",
      "file": "File:Foden tattoo.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/National_Football_Museum_displays_2.jpg/330px-National_Football_Museum_displays_2.jpg",
      "author": "Hmickey",
      "license": "CC BY-SA 4.0",
      "file": "File:National Football Museum displays 2.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_1DX_2724_%28cropped%29.jpg/330px-2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_1DX_2724_%28cropped%29.jpg",
      "author": "Original: Steffen Prößdorf; Derivative work: Goodreg3",
      "license": "CC BY-SA 4.0",
      "file": "File:2023-10-04 Fußball, Männer, UEFA Champions League, RB Leipzig - Manchester City FC 1DX 2724 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Phil_Foden_%2836502388741%29.jpg/330px-Phil_Foden_%2836502388741%29.jpg",
      "author": "Brad Tutterow",
      "license": "CC BY 2.0",
      "file": "File:Phil Foden (36502388741).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Phil_Foden_2022.jpeg/330px-Phil_Foden_2022.jpeg",
      "author": "Egghead06",
      "license": "CC BY-SA 4.0",
      "file": "File:Phil Foden 2022.jpeg"
    }
  ],
  "lamine-yamal": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Lamine_Yamal_in_2025_%28cropped2%29.jpg/330px-Lamine_Yamal_in_2025_%28cropped2%29.jpg",
      "author": "Biso",
      "license": "CC BY 4.0",
      "file": "File:Lamine Yamal in 2025 (cropped2).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Spain_football_team_in_2025.jpg/330px-Spain_football_team_in_2025.jpg",
      "author": "Biso",
      "license": "CC BY 4.0",
      "file": "File:Spain football team in 2025.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/2025_04_26_Final_de_la_Copa_del_Rey_%28cropped%29.jpg/330px-2025_04_26_Final_de_la_Copa_del_Rey_%28cropped%29.jpg",
      "author": "Junta de Andalucía",
      "license": "CC BY-SA 2.0",
      "file": "File:2025 04 26 Final de la Copa del Rey (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Lamine_Yamal_a_Xina.png/330px-Lamine_Yamal_a_Xina.png",
      "author": "中国新闻社",
      "license": "CC BY 3.0",
      "file": "File:Lamine Yamal a Xina.png"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Lamine_Yamal_a_Xina_%282025%29.png/330px-Lamine_Yamal_a_Xina_%282025%29.png",
      "author": "中国新闻社",
      "license": "CC BY 3.0",
      "file": "File:Lamine Yamal a Xina (2025).png"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Lamine_Yamal_in_2025_%28cropped%29.jpg/330px-Lamine_Yamal_in_2025_%28cropped%29.jpg",
      "author": "Biso",
      "license": "CC BY 4.0",
      "file": "File:Lamine Yamal in 2025 (cropped).jpg"
    }
  ],
  "cristiano-ronaldo": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/2025_Cristiano_Ronaldo_%28cropped%29.jpg/330px-2025_Cristiano_Ronaldo_%28cropped%29.jpg",
      "author": "The White House",
      "license": "Public domain",
      "file": "File:2025 Cristiano Ronaldo (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/1_cristiano_ronaldo_2016.jpg/330px-1_cristiano_ronaldo_2016.jpg",
      "author": "Chensiyuan",
      "license": "CC BY-SA 4.0",
      "file": "File:1 cristiano ronaldo 2016.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Cristiano_Ronaldo_figure_at_Madame_Tussauds_London_%2831094131932%29.jpg/330px-Cristiano_Ronaldo_figure_at_Madame_Tussauds_London_%2831094131932%29.jpg",
      "author": "Luke Rauscher",
      "license": "CC BY 2.0",
      "file": "File:Cristiano Ronaldo figure at Madame Tussauds London (31094131932).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Cristiano_Ronaldo_and_Lionel_Messi_-_Portugal_vs_Argentina%2C_9th_February_2011.jpg/330px-Cristiano_Ronaldo_and_Lionel_Messi_-_Portugal_vs_Argentina%2C_9th_February_2011.jpg",
      "author": "Fanny Schertzer",
      "license": "CC BY 3.0",
      "file": "File:Cristiano Ronaldo and Lionel Messi - Portugal vs Argentina, 9th February 2011.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Cristiano_Ronaldo_-_Ballon_d%27Or_%28cropped%29.jpg/330px-Cristiano_Ronaldo_-_Ballon_d%27Or_%28cropped%29.jpg",
      "author": "Anish Morarji from St Albans, England",
      "license": "CC BY 2.0",
      "file": "File:Cristiano Ronaldo - Ballon d'Or (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cristiano_Ronaldo_and_Andriy_Shevchenko%2C_2007_%28cropped%29.jpg/330px-Cristiano_Ronaldo_and_Andriy_Shevchenko%2C_2007_%28cropped%29.jpg",
      "author": "Sam & Emer",
      "license": "CC BY 2.0",
      "file": "File:Cristiano Ronaldo and Andriy Shevchenko, 2007 (cropped).jpg"
    }
  ],
  "bruno-fernandes": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Bruno_Fernandes_USMNT_v_Portugal_Mar_31_2026-27_%28cropped%29.jpg/330px-Bruno_Fernandes_USMNT_v_Portugal_Mar_31_2026-27_%28cropped%29.jpg",
      "author": "Bryan Berlin",
      "license": "CC BY-SA 4.0",
      "file": "File:Bruno Fernandes USMNT v Portugal Mar 31 2026-27 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Bruno_Miguel_Borges_Fernandes.jpg/330px-Bruno_Miguel_Borges_Fernandes.jpg",
      "author": "Agência Brasília",
      "license": "CC BY 2.0",
      "file": "File:Bruno Miguel Borges Fernandes.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Manchester_United_v_Leeds_United%2C_14_August_2021_%2814%29.jpg/330px-Manchester_United_v_Leeds_United%2C_14_August_2021_%2814%29.jpg",
      "author": "Ardfern",
      "license": "CC BY-SA 4.0",
      "file": "File:Manchester United v Leeds United, 14 August 2021 (14).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Bruno_Fernandes_2018_%28cropped%29.jpg/330px-Bruno_Fernandes_2018_%28cropped%29.jpg",
      "author": "Alexander Veprev",
      "license": "CC BY-SA 4.0",
      "file": "File:Bruno Fernandes 2018 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Bruno_Fernandes_00-07-14.16.png/330px-Bruno_Fernandes_00-07-14.16.png",
      "author": "AFC Bournemouth",
      "license": "CC BY 3.0",
      "file": "File:Bruno Fernandes 00-07-14.16.png"
    }
  ],
  "rafael-leao": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/LeaoFCSalzburg2022%28cropped%29.jpg/330px-LeaoFCSalzburg2022%28cropped%29.jpg",
      "author": "Werner100359",
      "license": "CC BY-SA 4.0",
      "file": "File:LeaoFCSalzburg2022(cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/FC_Salzburg_vs._AC_Mailand_%28UEFA_Championsleague_2022-09-06%29_31.jpg/330px-FC_Salzburg_vs._AC_Mailand_%28UEFA_Championsleague_2022-09-06%29_31.jpg",
      "author": "Werner100359",
      "license": "CC BY-SA 4.0",
      "file": "File:FC Salzburg vs. AC Mailand (UEFA Championsleague 2022-09-06) 31.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/FC_Salzburg_gegen_Sporting_Lissabon_%28UEFA_Youth_League_Play_off%2C_7._Februar_2018%29_24.jpg/330px-FC_Salzburg_gegen_Sporting_Lissabon_%28UEFA_Youth_League_Play_off%2C_7._Februar_2018%29_24.jpg",
      "author": "Werner100359",
      "license": "CC BY-SA 4.0",
      "file": "File:FC Salzburg gegen Sporting Lissabon (UEFA Youth League Play off, 7. Februar 2018) 24.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/FC_Salzburg_gegen_Sporting_Lissabon_%28UEFA_Youth_League_Play_off%2C_7._Februar_2018%29_27.jpg/330px-FC_Salzburg_gegen_Sporting_Lissabon_%28UEFA_Youth_League_Play_off%2C_7._Februar_2018%29_27.jpg",
      "author": "Werner100359",
      "license": "CC BY-SA 4.0",
      "file": "File:FC Salzburg gegen Sporting Lissabon (UEFA Youth League Play off, 7. Februar 2018) 27.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Milan_Lecce_2023_3.jpg/330px-Milan_Lecce_2023_3.jpg",
      "author": "Saggittarius A",
      "license": "CC BY-SA 4.0",
      "file": "File:Milan Lecce 2023 3.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/20231107_110839_Leao.jpg/330px-20231107_110839_Leao.jpg",
      "author": "UserBG",
      "license": "CC0",
      "file": "File:20231107 110839 Leao.jpg"
    }
  ],
  "jamal-musiala": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Jamal_Musiala_2022_%28cropped%29.jpg/330px-Jamal_Musiala_2022_%28cropped%29.jpg",
      "author": "crop by ArsenalGhanaPartey",
      "license": "CC BY-SA 4.0",
      "file": "File:Jamal Musiala 2022 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/2022-07-30_Fu%C3%9Fball%2C_M%C3%A4nner%2C_DFL-Supercup%2C_RB_Leipzig_-_FC_Bayern_M%C3%BCnchen_1DX_3230_by_Stepro.jpg/330px-2022-07-30_Fu%C3%9Fball%2C_M%C3%A4nner%2C_DFL-Supercup%2C_RB_Leipzig_-_FC_Bayern_M%C3%BCnchen_1DX_3230_by_Stepro.jpg",
      "author": "Steffen Prößdorf",
      "license": "CC BY-SA 4.0",
      "file": "File:2022-07-30 Fußball, Männer, DFL-Supercup, RB Leipzig - FC Bayern München 1DX 3230 by Stepro.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/2022-07-30_Fu%C3%9Fball%2C_M%C3%A4nner%2C_DFL-Supercup%2C_RB_Leipzig_-_FC_Bayern_M%C3%BCnchen_1DX_3386_by_Stepro.jpg/330px-2022-07-30_Fu%C3%9Fball%2C_M%C3%A4nner%2C_DFL-Supercup%2C_RB_Leipzig_-_FC_Bayern_M%C3%BCnchen_1DX_3386_by_Stepro.jpg",
      "author": "Steffen Prößdorf",
      "license": "CC BY-SA 4.0",
      "file": "File:2022-07-30 Fußball, Männer, DFL-Supercup, RB Leipzig - FC Bayern München 1DX 3386 by Stepro.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Klostermann_and_Musiala_2022.jpg/330px-Klostermann_and_Musiala_2022.jpg",
      "author": "Steffen Prößdorf",
      "license": "CC BY-SA 4.0",
      "file": "File:Klostermann and Musiala 2022.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Allianz_Arena_%2825-11-2023%29_09.jpg/330px-Allianz_Arena_%2825-11-2023%29_09.jpg",
      "author": "SonoGrazy",
      "license": "CC BY-SA 4.0",
      "file": "File:Allianz Arena (25-11-2023) 09.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Esapana-inglaterra-2_%2848899962191%29.jpg/330px-Esapana-inglaterra-2_%2848899962191%29.jpg",
      "author": "Pedro Semitiel from Cehegín, España",
      "license": "CC BY 2.0",
      "file": "File:Esapana-inglaterra-2 (48899962191).jpg"
    }
  ],
  "kai-havertz": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/2019-06-11_Fu%C3%9Fball%2C_M%C3%A4nner%2C_L%C3%A4nderspiel%2C_Deutschland-Estland_StP_2059_LR10_by_Stepro.jpg/330px-2019-06-11_Fu%C3%9Fball%2C_M%C3%A4nner%2C_L%C3%A4nderspiel%2C_Deutschland-Estland_StP_2059_LR10_by_Stepro.jpg",
      "author": "Steffen Prößdorf",
      "license": "CC BY-SA 4.0",
      "file": "File:2019-06-11 Fußball, Männer, Länderspiel, Deutschland-Estland StP 2059 LR10 by Stepro.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_117.jpg/330px-2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_117.jpg",
      "author": "Voltmetro",
      "license": "CC BY-SA 4.0",
      "file": "File:2021-12-08 - FC Zenit Saint Petersburg v Chelsea F.C. - Photo 117.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_128.jpg/330px-2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_128.jpg",
      "author": "Voltmetro",
      "license": "CC BY-SA 4.0",
      "file": "File:2021-12-08 - FC Zenit Saint Petersburg v Chelsea F.C. - Photo 128.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_129.jpg/330px-2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_129.jpg",
      "author": "Voltmetro",
      "license": "CC BY-SA 4.0",
      "file": "File:2021-12-08 - FC Zenit Saint Petersburg v Chelsea F.C. - Photo 129.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_130.jpg/330px-2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_130.jpg",
      "author": "Voltmetro",
      "license": "CC BY-SA 4.0",
      "file": "File:2021-12-08 - FC Zenit Saint Petersburg v Chelsea F.C. - Photo 130.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_167.jpg/330px-2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_167.jpg",
      "author": "Voltmetro",
      "license": "CC BY-SA 4.0",
      "file": "File:2021-12-08 - FC Zenit Saint Petersburg v Chelsea F.C. - Photo 167.jpg"
    }
  ],
  "virgil-van-dijk": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/20160604_AUT_NED_8876_%28cropped%29.jpg/330px-20160604_AUT_NED_8876_%28cropped%29.jpg",
      "author": "Ailura",
      "license": "CC BY-SA 3.0 at",
      "file": "File:20160604 AUT NED 8876 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/LFC_Parade_2019_01.jpg/330px-LFC_Parade_2019_01.jpg",
      "author": "Eric The Fish from UK",
      "license": "CC BY 2.0",
      "file": "File:LFC Parade 2019 01.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Chelsea_1_Liverpool_2_%2848782238673%29.jpg/330px-Chelsea_1_Liverpool_2_%2848782238673%29.jpg",
      "author": "@cfcunofficial (Chelsea Debs) London from London, UK",
      "license": "CC BY-SA 2.0",
      "file": "File:Chelsea 1 Liverpool 2 (48782238673).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Alisson_Becker_and_Virgil_van_Dijk_04012026_%281%29.jpg/330px-Alisson_Becker_and_Virgil_van_Dijk_04012026_%281%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Alisson Becker and Virgil van Dijk 04012026 (1).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Liverpool%27s_Free-Kick_04012026_%281%29.jpg/330px-Liverpool%27s_Free-Kick_04012026_%281%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Liverpool's Free-Kick 04012026 (1).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Dominik_Szoboszlai%2C_Virgil_van_Dijk_and_Ryan_Gravenberch_04012026_%281%29.jpg/330px-Dominik_Szoboszlai%2C_Virgil_van_Dijk_and_Ryan_Gravenberch_04012026_%281%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Dominik Szoboszlai, Virgil van Dijk and Ryan Gravenberch 04012026 (1).jpg"
    }
  ],
  "kevin-de-bruyne": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_%28cropped%29.jpg/330px-Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_%28cropped%29.jpg",
      "author": "Bryan Berlin",
      "license": "CC BY-SA 4.0",
      "file": "File:Kevin De Bruyne USMNT v Belgium Mar 28 2026-64 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/2014-10-26_Wolfsburg07_%2815669411695%29.jpg/330px-2014-10-26_Wolfsburg07_%2815669411695%29.jpg",
      "author": "Markus Unger from Vienna, Austria",
      "license": "CC BY 2.0",
      "file": "File:2014-10-26 Wolfsburg07 (15669411695).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/2014-10-26_Wolfsburg08_%2815483443767%29.jpg/330px-2014-10-26_Wolfsburg08_%2815483443767%29.jpg",
      "author": "Markus Unger from Vienna, Austria",
      "license": "CC BY 2.0",
      "file": "File:2014-10-26 Wolfsburg08 (15483443767).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Kevin_De_Bruyne_at_Samsung.jpg/330px-Kevin_De_Bruyne_at_Samsung.jpg",
      "author": "Samsung Belgium",
      "license": "CC BY 2.0",
      "file": "File:Kevin De Bruyne at Samsung.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-29.jpg/330px-Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-29.jpg",
      "author": "Bryan Berlin",
      "license": "CC BY-SA 4.0",
      "file": "File:Kevin De Bruyne USMNT v Belgium Mar 28 2026-29.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-30.jpg/330px-Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-30.jpg",
      "author": "Bryan Berlin",
      "license": "CC BY-SA 4.0",
      "file": "File:Kevin De Bruyne USMNT v Belgium Mar 28 2026-30.jpg"
    }
  ],
  "jeremy-doku": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/J%C3%A9r%C3%A9my_Doku_USMNT_v_Belgium_Mar_28_2026-27_%28cropped%29.jpg/330px-J%C3%A9r%C3%A9my_Doku_USMNT_v_Belgium_Mar_28_2026-27_%28cropped%29.jpg",
      "author": "Bryan Berlin",
      "license": "CC BY-SA 4.0",
      "file": "File:Jérémy Doku USMNT v Belgium Mar 28 2026-27 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/J%C3%A9r%C3%A9my_Doku_USMNT_v_Belgium_Mar_28_2026-171.jpg/330px-J%C3%A9r%C3%A9my_Doku_USMNT_v_Belgium_Mar_28_2026-171.jpg",
      "author": "Bryan Berlin",
      "license": "CC BY-SA 4.0",
      "file": "File:Jérémy Doku USMNT v Belgium Mar 28 2026-171.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/J%C3%A9r%C3%A9my_Doku_USMNT_v_Belgium_Mar_28_2026-169_%28cropped%29.jpg/330px-J%C3%A9r%C3%A9my_Doku_USMNT_v_Belgium_Mar_28_2026-169_%28cropped%29.jpg",
      "author": "Bryan Berlin",
      "license": "CC BY-SA 4.0",
      "file": "File:Jérémy Doku USMNT v Belgium Mar 28 2026-169 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_IMG_6166.jpg/330px-2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_IMG_6166.jpg",
      "author": "Steffen Prößdorf",
      "license": "CC BY-SA 4.0",
      "file": "File:2023-10-04 Fußball, Männer, UEFA Champions League, RB Leipzig - Manchester City FC IMG 6166.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_IMG_6167.jpg/330px-2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_IMG_6167.jpg",
      "author": "Steffen Prößdorf",
      "license": "CC BY-SA 4.0",
      "file": "File:2023-10-04 Fußball, Männer, UEFA Champions League, RB Leipzig - Manchester City FC IMG 6167.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_IMG_6169.jpg/330px-2023-10-04_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Manchester_City_FC_IMG_6169.jpg",
      "author": "Steffen Prößdorf",
      "license": "CC BY-SA 4.0",
      "file": "File:2023-10-04 Fußball, Männer, UEFA Champions League, RB Leipzig - Manchester City FC IMG 6169.jpg"
    }
  ],
  "luka-modric": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Luka_Modric_Interview_2021_%28cropped%29.jpg/330px-Luka_Modric_Interview_2021_%28cropped%29.jpg",
      "author": "Real Madrid",
      "license": "CC BY 3.0",
      "file": "File:Luka Modric Interview 2021 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Verlassenes_Geb%C3%A4ude_%28Luka_Modri%C4%87%29.jpg/330px-Verlassenes_Geb%C3%A4ude_%28Luka_Modri%C4%87%29.jpg",
      "author": "APneunzehn74",
      "license": "CC0",
      "file": "File:Verlassenes Gebäude (Luka Modrić).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Brazil_and_Croatia_match_at_the_FIFA_World_Cup_2014-06-12_%2810%29.jpg/330px-Brazil_and_Croatia_match_at_the_FIFA_World_Cup_2014-06-12_%2810%29.jpg",
      "author": "Agência Brasil",
      "license": "CC BY 3.0 br",
      "file": "File:Brazil and Croatia match at the FIFA World Cup 2014-06-12 (10).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Luka_Modric_-_Croatia_vs._Portugal%2C_10th_June_2013_%282%29.jpg/330px-Luka_Modric_-_Croatia_vs._Portugal%2C_10th_June_2013_%282%29.jpg",
      "author": "Fanny Schertzer",
      "license": "CC BY-SA 3.0",
      "file": "File:Luka Modric - Croatia vs. Portugal, 10th June 2013 (2).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/%D0%9A%D0%B0%D0%B7%D0%B0%D0%BD%D1%8C._%D0%A3%D0%BB%D0%B8%D1%86%D0%B0_%D0%93%D0%B0%D1%8F%D0%B7%D0%B0_%D0%98%D1%81%D1%85%D0%B0%D0%BA%D0%B8%2C_13._%D0%9C%D1%83%D1%80%D0%B0%D0%BB_%C2%AB%D0%9B%D1%83%D0%BA%D0%B0_%D0%9C%D0%BE%D0%B4%D1%80%D0%B8%D1%87%C2%BB.JPG/330px-%D0%9A%D0%B0%D0%B7%D0%B0%D0%BD%D1%8C._%D0%A3%D0%BB%D0%B8%D1%86%D0%B0_%D0%93%D0%B0%D1%8F%D0%B7%D0%B0_%D0%98%D1%81%D1%85%D0%B0%D0%BA%D0%B8%2C_13._%D0%9C%D1%83%D1%80%D0%B0%D0%BB_%C2%AB%D0%9B%D1%83%D0%BA%D0%B0_%D0%9C%D0%BE%D0%B4%D1%80%D0%B8%D1%87%C2%BB.JPG",
      "author": "MarSaf",
      "license": "CC BY-SA 4.0",
      "file": "File:Казань. Улица Гаяза Исхаки, 13. Мурал «Лука Модрич».JPG"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/%D0%9A%D0%B0%D0%B7%D0%B0%D0%BD%D1%8C._%D0%A3%D0%BB%D0%B8%D1%86%D0%B0_%D0%93%D0%B0%D1%8F%D0%B7%D0%B0_%D0%98%D1%81%D1%85%D0%B0%D0%BA%D0%B8%2C_13._%D0%9C%D1%83%D1%80%D0%B0%D0%BB%D1%8B_%C2%AB%D0%9B%D0%B8%D0%BE%D0%BD%D0%B5%D0%BB%D1%8C_%D0%9C%D0%B5%D1%81%D1%81%D0%B8%C2%BB_%D0%B8_%C2%AB%D0%9B%D1%83%D0%BA%D0%B0_%D0%9C%D0%BE%D0%B4%D1%80%D0%B8%D1%87%C2%BB.JPG/330px-%D0%9A%D0%B0%D0%B7%D0%B0%D0%BD%D1%8C._%D0%A3%D0%BB%D0%B8%D1%86%D0%B0_%D0%93%D0%B0%D1%8F%D0%B7%D0%B0_%D0%98%D1%81%D1%85%D0%B0%D0%BA%D0%B8%2C_13._%D0%9C%D1%83%D1%80%D0%B0%D0%BB%D1%8B_%C2%AB%D0%9B%D0%B8%D0%BE%D0%BD%D0%B5%D0%BB%D1%8C_%D0%9C%D0%B5%D1%81%D1%81%D0%B8%C2%BB_%D0%B8_%C2%AB%D0%9B%D1%83%D0%BA%D0%B0_%D0%9C%D0%BE%D0%B4%D1%80%D0%B8%D1%87%C2%BB.JPG",
      "author": "MarSaf",
      "license": "CC BY-SA 4.0",
      "file": "File:Казань. Улица Гаяза Исхаки, 13. Муралы «Лионель Месси» и «Лука Модрич».JPG"
    }
  ],
  "darwin-nunez": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/2022-07-21_Fu%C3%9Fball%2C_M%C3%A4nner%2CFreundschaftsspiel%2C_RB_Leipzig_-_FC_Liverpool_1DX_2221_by_Stepro.jpg/330px-2022-07-21_Fu%C3%9Fball%2C_M%C3%A4nner%2CFreundschaftsspiel%2C_RB_Leipzig_-_FC_Liverpool_1DX_2221_by_Stepro.jpg",
      "author": "Steffen Prößdorf",
      "license": "CC BY-SA 4.0",
      "file": "File:2022-07-21 Fußball, Männer,Freundschaftsspiel, RB Leipzig - FC Liverpool 1DX 2221 by Stepro.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Darwin_N%C3%BA%C3%B1ez_%28cropped%29.jpg/330px-Darwin_N%C3%BA%C3%B1ez_%28cropped%29.jpg",
      "author": "Steffen Prößdorf",
      "license": "CC BY-SA 4.0",
      "file": "File:Darwin Núñez (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/BenficaBarcelona20210928-002.jpg/330px-BenficaBarcelona20210928-002.jpg",
      "author": "Sport Lisboa e Benfica",
      "license": "CC BY 4.0",
      "file": "File:BenficaBarcelona20210928-002.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Darwin_N%C3%BA%C3%B1ez_WC2022.jpg/330px-Darwin_N%C3%BA%C3%B1ez_WC2022.jpg",
      "author": "Hossein Zohrevand",
      "license": "CC BY 4.0",
      "file": "File:Darwin Núñez WC2022.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/BenficaBarcelona20210928-001_%28cropped%29.jpg/330px-BenficaBarcelona20210928-001_%28cropped%29.jpg",
      "author": "Sport Lisboa e Benfica",
      "license": "CC BY 3.0",
      "file": "File:BenficaBarcelona20210928-001 (cropped).jpg"
    }
  ],
  "christian-pulisic": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Christian_Pulisic_USMNT_v_Belgium_Mar_28_2026-73_%28cropped%29.jpg/330px-Christian_Pulisic_USMNT_v_Belgium_Mar_28_2026-73_%28cropped%29.jpg",
      "author": "Bryan Berlin",
      "license": "CC BY-SA 4.0",
      "file": "File:Christian Pulisic USMNT v Belgium Mar 28 2026-73 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/USMNT_vs._Trinidad_and_Tobago_%2848124870563%29.jpg/330px-USMNT_vs._Trinidad_and_Tobago_%2848124870563%29.jpg",
      "author": "Erik Drost",
      "license": "CC BY 2.0",
      "file": "File:USMNT vs. Trinidad and Tobago (48124870563).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Chelsea_1_Leicester_1_%2848574907327%29.jpg/330px-Chelsea_1_Leicester_1_%2848574907327%29.jpg",
      "author": "@cfcunofficial (Chelsea Debs) London from London, UK",
      "license": "CC BY-SA 2.0",
      "file": "File:Chelsea 1 Leicester 1 (48574907327).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_129.jpg/330px-2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_129.jpg",
      "author": "Voltmetro",
      "license": "CC BY-SA 4.0",
      "file": "File:2021-12-08 - FC Zenit Saint Petersburg v Chelsea F.C. - Photo 129.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_176.jpg/330px-2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_176.jpg",
      "author": "Voltmetro",
      "license": "CC BY-SA 4.0",
      "file": "File:2021-12-08 - FC Zenit Saint Petersburg v Chelsea F.C. - Photo 176.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_199.jpg/330px-2021-12-08_-_FC_Zenit_Saint_Petersburg_v_Chelsea_F.C._-_Photo_199.jpg",
      "author": "Voltmetro",
      "license": "CC BY-SA 4.0",
      "file": "File:2021-12-08 - FC Zenit Saint Petersburg v Chelsea F.C. - Photo 199.jpg"
    }
  ],
  "santiago-gimenez": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Santiago_Gim%C3%A9nez.png/330px-Santiago_Gim%C3%A9nez.png",
      "author": "Selección Nacional de México",
      "license": "CC BY 3.0",
      "file": "File:Santiago Giménez.png"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Santiago_Gim%C3%A9nez_-_2023_%28AI-generated_version%29.jpg/330px-Santiago_Gim%C3%A9nez_-_2023_%28AI-generated_version%29.jpg",
      "author": "Selección Nacional de México",
      "license": "CC BY 3.0",
      "file": "File:Santiago Giménez - 2023 (AI-generated version).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Milan_store_via_Dante_-_Santiago_Gimenez.jpg/330px-Milan_store_via_Dante_-_Santiago_Gimenez.jpg",
      "author": "Saggittarius A",
      "license": "CC BY 4.0",
      "file": "File:Milan store via Dante - Santiago Gimenez.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Santiago_Gim%C3%A9nez_-_2023.jpg/330px-Santiago_Gim%C3%A9nez_-_2023.jpg",
      "author": "Selección Nacional de México",
      "license": "CC BY 3.0",
      "file": "File:Santiago Giménez - 2023.jpg"
    }
  ],
  "achraf-hakimi": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Achraf_Hakimi_%28cropped2%29.jpg/330px-Achraf_Hakimi_%28cropped2%29.jpg",
      "author": "Abdelali Bentarki",
      "license": "CC BY 4.0",
      "file": "File:Achraf Hakimi (cropped2).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Achraf_Hakimi_Morocco_v_Norway_7_June_2026-32.jpg/330px-Achraf_Hakimi_Morocco_v_Norway_7_June_2026-32.jpg",
      "author": "Bryan Berlin",
      "license": "CC BY-SA 4.0",
      "file": "File:Achraf Hakimi Morocco v Norway 7 June 2026-32.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Achraf_Hakimi_Morocco_v_Norway_7_June_2026-115.jpg/330px-Achraf_Hakimi_Morocco_v_Norway_7_June_2026-115.jpg",
      "author": "Bryan Berlin",
      "license": "CC BY-SA 4.0",
      "file": "File:Achraf Hakimi Morocco v Norway 7 June 2026-115.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Achraf_Hakimi_2024.jpg/330px-Achraf_Hakimi_2024.jpg",
      "author": "MFonzatti",
      "license": "CC BY-SA 4.0",
      "file": "File:Achraf Hakimi 2024.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Achraf_Hakimi_vs_Niger_%28cropped%29.jpg/330px-Achraf_Hakimi_vs_Niger_%28cropped%29.jpg",
      "author": "Laloumance",
      "license": "CC BY 4.0",
      "file": "File:Achraf Hakimi vs Niger (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/FC_Salzburg_gegen_Paris_Saint-Germain_UEFA_Champions_League_58.jpg/330px-FC_Salzburg_gegen_Paris_Saint-Germain_UEFA_Champions_League_58.jpg",
      "author": "Werner100359",
      "license": "CC BY-SA 4.0",
      "file": "File:FC Salzburg gegen Paris Saint-Germain UEFA Champions League 58.jpg"
    }
  ],
  "mohamed-salah": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mohamed_Salah_2018.jpg/330px-Mohamed_Salah_2018.jpg",
      "author": "Анна Нэсси",
      "license": "CC BY-SA 3.0",
      "file": "File:Mohamed Salah 2018.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Equipe_D%27Egypte.jpg/330px-Equipe_D%27Egypte.jpg",
      "author": "Zebsimages",
      "license": "CC BY-SA 4.0",
      "file": "File:Equipe D'Egypte.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Egypte_vs_Soudan_%281%29.jpg/330px-Egypte_vs_Soudan_%281%29.jpg",
      "author": "Franco237",
      "license": "CC BY-SA 4.0",
      "file": "File:Egypte vs Soudan (1).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Chelsea_1_Liverpool_0_%2827122993747%29.jpg/330px-Chelsea_1_Liverpool_0_%2827122993747%29.jpg",
      "author": "@cfcunofficial (Chelsea Debs) London from London, UK",
      "license": "CC BY-SA 2.0",
      "file": "File:Chelsea 1 Liverpool 0 (27122993747).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/2022-07-21_Fu%C3%9Fball%2C_M%C3%A4nner%2CFreundschaftsspiel%2C_RB_Leipzig_-_FC_Liverpool_1DX_2066_by_Stepro.jpg/330px-2022-07-21_Fu%C3%9Fball%2C_M%C3%A4nner%2CFreundschaftsspiel%2C_RB_Leipzig_-_FC_Liverpool_1DX_2066_by_Stepro.jpg",
      "author": "Steffen Prößdorf",
      "license": "CC BY-SA 4.0",
      "file": "File:2022-07-21 Fußball, Männer,Freundschaftsspiel, RB Leipzig - FC Liverpool 1DX 2066 by Stepro.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/C%C3%A9l%C3%A9bration_Egypt_%283%29.jpg/330px-C%C3%A9l%C3%A9bration_Egypt_%283%29.jpg",
      "author": "Jeanpierrekepseu",
      "license": "CC BY-SA 4.0",
      "file": "File:Célébration Egypt (3).jpg"
    }
  ],
  "victor-osimhen": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Victor-osimhen-nigeria-2024-3-4.jpg/330px-Victor-osimhen-nigeria-2024-3-4.jpg",
      "author": "Fédération Guinéenne Football",
      "license": "Public domain",
      "file": "File:Victor-osimhen-nigeria-2024-3-4.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/0K8A7984_%2853451306826%29_%28cropped%29.jpg/330px-0K8A7984_%2853451306826%29_%28cropped%29.jpg",
      "author": "Fédération Guinéenne Football",
      "license": "Public domain",
      "file": "File:0K8A7984 (53451306826) (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Victor_Osimhen_%28LOSC%29_%28cropped%29.jpg/330px-Victor_Osimhen_%28LOSC%29_%28cropped%29.jpg",
      "author": "Liondartois",
      "license": "CC BY-SA 4.0",
      "file": "File:Victor Osimhen (LOSC) (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Victor_Osimhen%2C_2023.png/330px-Victor_Osimhen%2C_2023.png",
      "author": "pino_alpino",
      "license": "CC BY-SA 4.0",
      "file": "File:Victor Osimhen, 2023.png"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Osimhen30Sep2025.jpg/330px-Osimhen30Sep2025.jpg",
      "author": "Ottomanor",
      "license": "CC0",
      "file": "File:Osimhen30Sep2025.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/0K8A7975_%2853451429413%29_%28cropped%29.jpg/330px-0K8A7975_%2853451429413%29_%28cropped%29.jpg",
      "author": "Fédération Guinéenne Football",
      "license": "Public domain",
      "file": "File:0K8A7975 (53451429413) (cropped).jpg"
    }
  ],
  "takefusa-kubo": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Takefusa_Kubo_1053.jpg/330px-Takefusa_Kubo_1053.jpg",
      "author": "Real Madrid",
      "license": "CC BY 3.0",
      "file": "File:Takefusa Kubo 1053.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/La_Real_Sociedad_humillando_al_Benfica_en_la_Champions_League_el_8_de_noviembre_de_2023.jpg/330px-La_Real_Sociedad_humillando_al_Benfica_en_la_Champions_League_el_8_de_noviembre_de_2023.jpg",
      "author": "Fan real sociedad",
      "license": "CC BY-SA 4.0",
      "file": "File:La Real Sociedad humillando al Benfica en la Champions League el 8 de noviembre de 2023.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Fumio_Kishida_with_Japan_National_Football_Team_after_Qatar_World_Cup_%284%29.jpg/330px-Fumio_Kishida_with_Japan_National_Football_Team_after_Qatar_World_Cup_%284%29.jpg",
      "author": "内閣官房内閣広報室",
      "license": "CC BY 4.0",
      "file": "File:Fumio Kishida with Japan National Football Team after Qatar World Cup (4).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Fumio_Kishida_with_Japan_National_Football_Team_after_Qatar_World_Cup_%286%29.jpg/330px-Fumio_Kishida_with_Japan_National_Football_Team_after_Qatar_World_Cup_%286%29.jpg",
      "author": "内閣官房内閣広報室",
      "license": "CC BY 4.0",
      "file": "File:Fumio Kishida with Japan National Football Team after Qatar World Cup (6).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Takefusa_Kubo_2019.png/330px-Takefusa_Kubo_2019.png",
      "author": "Real Madrid",
      "license": "CC BY 3.0",
      "file": "File:Takefusa Kubo 2019.png"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/2022_FIFA_World_Cup_Germany_1%E2%80%932_Japan_-_%285%29.jpg/330px-2022_FIFA_World_Cup_Germany_1%E2%80%932_Japan_-_%285%29.jpg",
      "author": "حسین ظهروند",
      "license": "CC BY 4.0",
      "file": "File:2022 FIFA World Cup Germany 1–2 Japan - (5).jpg"
    }
  ],
  "son-heung-min": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/BFA_2023_-2_Heung-Min_Son_%28cropped%29.jpg/330px-BFA_2023_-2_Heung-Min_Son_%28cropped%29.jpg",
      "author": "Ujishadow",
      "license": "CC BY-SA 4.0",
      "file": "File:BFA 2023 -2 Heung-Min Son (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/2013.09.06_Korea_Rep._vs_Haiti_%2851%29.jpg/330px-2013.09.06_Korea_Rep._vs_Haiti_%2851%29.jpg",
      "author": "Manri Cheon",
      "license": "CC BY 2.0",
      "file": "File:2013.09.06 Korea Rep. vs Haiti (51).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/%EC%86%90%ED%9D%A5%EB%AF%BC_%ED%86%A0%ED%8A%B8%EB%84%98_%ED%99%8B%EC%8A%A4%ED%8D%BC_%EC%A0%80%EC%A7%80_%28%EC%95%9E%29.jpg/330px-%EC%86%90%ED%9D%A5%EB%AF%BC_%ED%86%A0%ED%8A%B8%EB%84%98_%ED%99%8B%EC%8A%A4%ED%8D%BC_%EC%A0%80%EC%A7%80_%28%EC%95%9E%29.jpg",
      "author": "Explicit",
      "license": "CC BY-SA 4.0",
      "file": "File:손흥민 토트넘 홋스퍼 저지 (앞).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/%EC%86%90%ED%9D%A5%EB%AF%BC_%ED%86%A0%ED%8A%B8%EB%84%98_%ED%99%8B%EC%8A%A4%ED%8D%BC_%EC%A0%80%EC%A7%80_%28%EB%92%A4%29.jpg/330px-%EC%86%90%ED%9D%A5%EB%AF%BC_%ED%86%A0%ED%8A%B8%EB%84%98_%ED%99%8B%EC%8A%A4%ED%8D%BC_%EC%A0%80%EC%A7%80_%28%EB%92%A4%29.jpg",
      "author": "Explicit",
      "license": "CC BY-SA 4.0",
      "file": "File:손흥민 토트넘 홋스퍼 저지 (뒤).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Best_Footballer_in_Asia_2022_Son_Heung-min_%28cropped%29.jpg/330px-Best_Footballer_in_Asia_2022_Son_Heung-min_%28cropped%29.jpg",
      "author": "Ujishadow",
      "license": "CC BY-SA 4.0",
      "file": "File:Best Footballer in Asia 2022 Son Heung-min (cropped).jpg"
    }
  ],
  "luis-diaz": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/FC_RB_Salzburg_gegen_FC_Bayern_M%C3%BCnchen_%282026-01-06_Testspiel%29_40_%28Luiz_D%C3%ADaz%29.jpg/330px-FC_RB_Salzburg_gegen_FC_Bayern_M%C3%BCnchen_%282026-01-06_Testspiel%29_40_%28Luiz_D%C3%ADaz%29.jpg",
      "author": "Werner100359",
      "license": "CC BY-SA 4.0",
      "file": "File:FC RB Salzburg gegen FC Bayern München (2026-01-06 Testspiel) 40 (Luiz Díaz).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/FC_RB_Salzburg_gegen_FC_Bayern_M%C3%BCnchen_%282026-01-06_Testspiel%29_47.jpg/330px-FC_RB_Salzburg_gegen_FC_Bayern_M%C3%BCnchen_%282026-01-06_Testspiel%29_47.jpg",
      "author": "Werner100359",
      "license": "CC BY-SA 4.0",
      "file": "File:FC RB Salzburg gegen FC Bayern München (2026-01-06 Testspiel) 47.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Argentina_-_Colombia_2022_%2805%29.jpg/330px-Argentina_-_Colombia_2022_%2805%29.jpg",
      "author": "jmmuguerza",
      "license": "CC BY-SA 3.0",
      "file": "File:Argentina - Colombia 2022 (05).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Argentina_-_Colombia_2022_%28105%29.jpg/330px-Argentina_-_Colombia_2022_%28105%29.jpg",
      "author": "jmmuguerza",
      "license": "CC BY-SA 3.0",
      "file": "File:Argentina - Colombia 2022 (105).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Argentina_-_Colombia_2022_%28106%29.jpg/330px-Argentina_-_Colombia_2022_%28106%29.jpg",
      "author": "jmmuguerza",
      "license": "CC BY-SA 3.0",
      "file": "File:Argentina - Colombia 2022 (106).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Argentina_-_Colombia_2022_%28112%29.jpg/330px-Argentina_-_Colombia_2022_%28112%29.jpg",
      "author": "jmmuguerza",
      "license": "CC BY-SA 3.0",
      "file": "File:Argentina - Colombia 2022 (112).jpg"
    }
  ],
  "vinicius-junior": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Vinicius_Jr_2021.jpg/330px-Vinicius_Jr_2021.jpg",
      "author": "Real Madrid",
      "license": "CC BY 3.0",
      "file": "File:Vinicius Jr 2021.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/2023_05_06_Final_de_la_Copa_del_Rey_-_52878867076.jpg/330px-2023_05_06_Final_de_la_Copa_del_Rey_-_52878867076.jpg",
      "author": "Junta de Andalucía",
      "license": "CC BY-SA 2.0",
      "file": "File:2023 05 06 Final de la Copa del Rey - 52878867076.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/2023_05_06_Final_de_la_Copa_del_Rey_-_52879024229.jpg/330px-2023_05_06_Final_de_la_Copa_del_Rey_-_52879024229.jpg",
      "author": "Junta de Andalucía",
      "license": "CC BY-SA 2.0",
      "file": "File:2023 05 06 Final de la Copa del Rey - 52879024229.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Ofrenda_de_la_Liga_y_la_Champions-50-L.Mill%C3%A1n_%2852109789010%29.jpg/330px-Ofrenda_de_la_Liga_y_la_Champions-50-L.Mill%C3%A1n_%2852109789010%29.jpg",
      "author": "Fotografías Archimadrid.es",
      "license": "CC BY 2.0",
      "file": "File:Ofrenda de la Liga y la Champions-50-L.Millán (52109789010).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Ofrenda_de_la_Liga_y_la_Champions-57-L.Mill%C3%A1n_%2852109310843%29.jpg/330px-Ofrenda_de_la_Liga_y_la_Champions-57-L.Mill%C3%A1n_%2852109310843%29.jpg",
      "author": "Fotografías Archimadrid.es",
      "license": "CC BY 2.0",
      "file": "File:Ofrenda de la Liga y la Champions-57-L.Millán (52109310843).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/2025_04_26_Final_de_la_Copa_del_Rey_-_54482387776.jpg/330px-2025_04_26_Final_de_la_Copa_del_Rey_-_54482387776.jpg",
      "author": "Junta de Andalucía",
      "license": "CC BY-SA 2.0",
      "file": "File:2025 04 26 Final de la Copa del Rey - 54482387776.jpg"
    }
  ],
  "aurelien-tchouameni": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Aur%C3%A9lien_Tchouam%C3%A9ni.jpg/330px-Aur%C3%A9lien_Tchouam%C3%A9ni.jpg",
      "author": "Кирилл Венедиктов",
      "license": "CC BY-SA 3.0",
      "file": "File:Aurélien Tchouaméni.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/2023_05_06_Final_de_la_Copa_del_Rey_-_52879024229.jpg/330px-2023_05_06_Final_de_la_Copa_del_Rey_-_52879024229.jpg",
      "author": "Junta de Andalucía",
      "license": "CC BY-SA 2.0",
      "file": "File:2023 05 06 Final de la Copa del Rey - 52879024229.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/2025_04_26_Final_de_la_Copa_del_Rey_-_54482387776.jpg/330px-2025_04_26_Final_de_la_Copa_del_Rey_-_54482387776.jpg",
      "author": "Junta de Andalucía",
      "license": "CC BY-SA 2.0",
      "file": "File:2025 04 26 Final de la Copa del Rey - 54482387776.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/RB_Salzburg_gegen_AS_Monaco_%28Testspiel%2C_3._Juli_2021%29_48.jpg/330px-RB_Salzburg_gegen_AS_Monaco_%28Testspiel%2C_3._Juli_2021%29_48.jpg",
      "author": "Werner100359",
      "license": "CC BY-SA 4.0",
      "file": "File:RB Salzburg gegen AS Monaco (Testspiel, 3. Juli 2021) 48.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/RB_Salzburg_gegen_AS_Monaco_%28Testspiel%2C_3._Juli_2021%29_33.jpg/330px-RB_Salzburg_gegen_AS_Monaco_%28Testspiel%2C_3._Juli_2021%29_33.jpg",
      "author": "Werner100359",
      "license": "CC BY-SA 4.0",
      "file": "File:RB Salzburg gegen AS Monaco (Testspiel, 3. Juli 2021) 33.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/RB_Salzburg_gegen_AS_Monaco_%28Testspiel%2C_3._Juli_2021%29_55.jpg/330px-RB_Salzburg_gegen_AS_Monaco_%28Testspiel%2C_3._Juli_2021%29_55.jpg",
      "author": "Werner100359",
      "license": "CC BY-SA 4.0",
      "file": "File:RB Salzburg gegen AS Monaco (Testspiel, 3. Juli 2021) 55.jpg"
    }
  ],
  "pedri": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Spain_football_team_in_2025.jpg/330px-Spain_football_team_in_2025.jpg",
      "author": "Biso",
      "license": "CC BY 4.0",
      "file": "File:Spain football team in 2025.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/2025_04_26_Final_de_la_Copa_del_Rey.jpg/330px-2025_04_26_Final_de_la_Copa_del_Rey.jpg",
      "author": "Junta de Andalucía",
      "license": "CC BY-SA 2.0",
      "file": "File:2025 04 26 Final de la Copa del Rey.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/2025_04_26_Final_de_la_Copa_del_Rey_-_54482387776_%28cropped%29.jpg/330px-2025_04_26_Final_de_la_Copa_del_Rey_-_54482387776_%28cropped%29.jpg",
      "author": "Junta de Andalucía",
      "license": "CC BY-SA 2.0",
      "file": "File:2025 04 26 Final de la Copa del Rey - 54482387776 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/2025_04_26_Final_de_la_Copa_del_Rey_-_54482387776_%28cropped%291.jpg/330px-2025_04_26_Final_de_la_Copa_del_Rey_-_54482387776_%28cropped%291.jpg",
      "author": "Junta de Andalucía",
      "license": "CC BY-SA 2.0",
      "file": "File:2025 04 26 Final de la Copa del Rey - 54482387776 (cropped)1.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/%D0%9C%D0%B0%D1%82%D1%87_%C2%AB%D0%94%D0%B8%D0%BD%D0%B0%D0%BC%D0%BE%C2%BB_-_%C2%AB%D0%91%D0%B0%D1%80%D1%81%D0%B5%D0%BB%D0%BE%D0%BD%D0%B0%C2%BB_0-4._24_%D0%BD%D0%BE%D1%8F%D0%B1%D1%80%D1%8F_2020_%D0%B3%D0%BE%D0%B4%D0%B0_%E2%80%94_1166754.jpg/330px-%D0%9C%D0%B0%D1%82%D1%87_%C2%AB%D0%94%D0%B8%D0%BD%D0%B0%D0%BC%D0%BE%C2%BB_-_%C2%AB%D0%91%D0%B0%D1%80%D1%81%D0%B5%D0%BB%D0%BE%D0%BD%D0%B0%C2%BB_0-4._24_%D0%BD%D0%BE%D1%8F%D0%B1%D1%80%D1%8F_2020_%D0%B3%D0%BE%D0%B4%D0%B0_%E2%80%94_1166754.jpg",
      "author": "Olga Shcherbytska",
      "license": "CC BY-SA 4.0",
      "file": "File:Матч «Динамо» - «Барселона» 0-4. 24 ноября 2020 года — 1166754.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/%D0%9C%D0%B0%D1%82%D1%87_%C2%AB%D0%94%D0%B8%D0%BD%D0%B0%D0%BC%D0%BE%C2%BB_-_%C2%AB%D0%91%D0%B0%D1%80%D1%81%D0%B5%D0%BB%D0%BE%D0%BD%D0%B0%C2%BB_0-4._24_%D0%BD%D0%BE%D1%8F%D0%B1%D1%80%D1%8F_2020_%D0%B3%D0%BE%D0%B4%D0%B0_%E2%80%94_1166814.jpg/330px-%D0%9C%D0%B0%D1%82%D1%87_%C2%AB%D0%94%D0%B8%D0%BD%D0%B0%D0%BC%D0%BE%C2%BB_-_%C2%AB%D0%91%D0%B0%D1%80%D1%81%D0%B5%D0%BB%D0%BE%D0%BD%D0%B0%C2%BB_0-4._24_%D0%BD%D0%BE%D1%8F%D0%B1%D1%80%D1%8F_2020_%D0%B3%D0%BE%D0%B4%D0%B0_%E2%80%94_1166814.jpg",
      "author": "Olga Shcherbytska",
      "license": "CC BY-SA 4.0",
      "file": "File:Матч «Динамо» - «Барселона» 0-4. 24 ноября 2020 года — 1166814.jpg"
    }
  ],
  "cody-gakpo": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Cody_Gakpo_06042025_%282%29_%28cropped%29.jpg/330px-Cody_Gakpo_06042025_%282%29_%28cropped%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Cody Gakpo 06042025 (2) (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Liverpool_Players_Training_04012026_%281%29.jpg/330px-Liverpool_Players_Training_04012026_%281%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Liverpool Players Training 04012026 (1).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Cody_Gakpo_04012026_%281%29.jpg/330px-Cody_Gakpo_04012026_%281%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Cody Gakpo 04012026 (1).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Liverpool%27s_Free-Kick_04012026_%281%29.jpg/330px-Liverpool%27s_Free-Kick_04012026_%281%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Liverpool's Free-Kick 04012026 (1).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Fulham_v_Liverpool_04012026_%282%29.jpg/330px-Fulham_v_Liverpool_04012026_%282%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Fulham v Liverpool 04012026 (2).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Liverpool%27s_corner_04012026_%283%29.jpg/330px-Liverpool%27s_corner_04012026_%283%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Liverpool's corner 04012026 (3).jpg"
    }
  ],
  "federico-valverde": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Federico_Valverde_2021_%28cropped%29.jpg/330px-Federico_Valverde_2021_%28cropped%29.jpg",
      "author": "Real Madrid",
      "license": "CC BY 3.0",
      "file": "File:Federico Valverde 2021 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Ofrenda_de_la_Liga_y_la_Champions-25-L.Mill%C3%A1n_%2852109523814%29.jpg/330px-Ofrenda_de_la_Liga_y_la_Champions-25-L.Mill%C3%A1n_%2852109523814%29.jpg",
      "author": "Fotografías Archimadrid.es",
      "license": "CC BY 2.0",
      "file": "File:Ofrenda de la Liga y la Champions-25-L.Millán (52109523814).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/URUGUAY_5_%E2%80%93_PANAM%C3%81_0_-_220611-7104-jikatu_%28Federico_Valverde%29.jpg/330px-URUGUAY_5_%E2%80%93_PANAM%C3%81_0_-_220611-7104-jikatu_%28Federico_Valverde%29.jpg",
      "author": "jikatu",
      "license": "CC BY-SA 2.0",
      "file": "File:URUGUAY 5 – PANAMÁ 0 - 220611-7104-jikatu (Federico Valverde).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Federico_Valverde_Real_Madrid_2018.jpg/330px-Federico_Valverde_Real_Madrid_2018.jpg",
      "author": "All-Pro Reels from District of Columbia, USA",
      "license": "CC BY-SA 2.0",
      "file": "File:Federico Valverde Real Madrid 2018.jpg"
    }
  ],
  "alphonso-davies": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/2022-07-30_Fu%C3%9Fball%2C_M%C3%A4nner%2C_DFL-Supercup%2C_RB_Leipzig_-_FC_Bayern_M%C3%BCnchen_1DX_3286_by_Stepro.jpg/330px-2022-07-30_Fu%C3%9Fball%2C_M%C3%A4nner%2C_DFL-Supercup%2C_RB_Leipzig_-_FC_Bayern_M%C3%BCnchen_1DX_3286_by_Stepro.jpg",
      "author": "Steffen Prößdorf",
      "license": "CC BY-SA 4.0",
      "file": "File:2022-07-30 Fußball, Männer, DFL-Supercup, RB Leipzig - FC Bayern München 1DX 3286 by Stepro.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/2022-07-30_Fu%C3%9Fball%2C_M%C3%A4nner%2C_DFL-Supercup%2C_RB_Leipzig_-_FC_Bayern_M%C3%BCnchen_1DX_3223_by_Stepro.jpg/330px-2022-07-30_Fu%C3%9Fball%2C_M%C3%A4nner%2C_DFL-Supercup%2C_RB_Leipzig_-_FC_Bayern_M%C3%BCnchen_1DX_3223_by_Stepro.jpg",
      "author": "Steffen Prößdorf",
      "license": "CC BY-SA 4.0",
      "file": "File:2022-07-30 Fußball, Männer, DFL-Supercup, RB Leipzig - FC Bayern München 1DX 3223 by Stepro.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Alphonso_Davies_Canadian_Championship_by_Frid06_%2827559553025%29_%28cropped%29.jpg/330px-Alphonso_Davies_Canadian_Championship_by_Frid06_%2827559553025%29_%28cropped%29.jpg",
      "author": "Canada Soccer",
      "license": "CC BY-SA 2.0",
      "file": "File:Alphonso Davies Canadian Championship by Frid06 (27559553025) (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Alphonso_Davies_-_cropped.jpg/330px-Alphonso_Davies_-_cropped.jpg",
      "author": "Sven Mandel",
      "license": "CC BY-SA 4.0",
      "file": "File:Alphonso Davies - cropped.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Allianz_Arena_%2825-11-2023%29_09.jpg/330px-Allianz_Arena_%2825-11-2023%29_09.jpg",
      "author": "SonoGrazy",
      "license": "CC BY-SA 4.0",
      "file": "File:Allianz Arena (25-11-2023) 09.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Alphonso_Davies_2018.jpg/330px-Alphonso_Davies_2018.jpg",
      "author": "Chris from Brampton, Canada",
      "license": "CC BY 2.0",
      "file": "File:Alphonso Davies 2018.jpg"
    }
  ],
  "sadio-mane": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/1._SC_Sollenau_vs._FC_Red_Bull_Salzburg_2014-07-12_%28044%29.jpg/330px-1._SC_Sollenau_vs._FC_Red_Bull_Salzburg_2014-07-12_%28044%29.jpg",
      "author": "Steindy (talk) 11:53, 16 July 2014 (UTC)",
      "license": "GFDL 1.2",
      "file": "File:1. SC Sollenau vs. FC Red Bull Salzburg 2014-07-12 (044).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/1._SC_Sollenau_vs._FC_Red_Bull_Salzburg_2014-07-12_%28045%29.jpg/330px-1._SC_Sollenau_vs._FC_Red_Bull_Salzburg_2014-07-12_%28045%29.jpg",
      "author": "Steindy (talk) 11:54, 16 July 2014 (UTC)",
      "license": "GFDL 1.2",
      "file": "File:1. SC Sollenau vs. FC Red Bull Salzburg 2014-07-12 (045).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/1._SC_Sollenau_vs._FC_Red_Bull_Salzburg_2014-07-12_%28130%29.jpg/330px-1._SC_Sollenau_vs._FC_Red_Bull_Salzburg_2014-07-12_%28130%29.jpg",
      "author": "Steindy (talk) 12:06, 16 July 2014 (UTC)",
      "license": "GFDL 1.2",
      "file": "File:1. SC Sollenau vs. FC Red Bull Salzburg 2014-07-12 (130).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/1._SC_Sollenau_vs._FC_Red_Bull_Salzburg_2014-07-12_%28149%29.jpg/330px-1._SC_Sollenau_vs._FC_Red_Bull_Salzburg_2014-07-12_%28149%29.jpg",
      "author": "Steindy (talk) 12:21, 16 July 2014 (UTC)",
      "license": "GFDL 1.2",
      "file": "File:1. SC Sollenau vs. FC Red Bull Salzburg 2014-07-12 (149).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/1._SC_Sollenau_vs._FC_Red_Bull_Salzburg_2014-07-12_%28128%29.jpg/330px-1._SC_Sollenau_vs._FC_Red_Bull_Salzburg_2014-07-12_%28128%29.jpg",
      "author": "Steindy (talk) 12:05, 16 July 2014 (UTC)",
      "license": "GFDL 1.2",
      "file": "File:1. SC Sollenau vs. FC Red Bull Salzburg 2014-07-12 (128).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Players_before_the_match98.JPG/330px-Players_before_the_match98.JPG",
      "author": "Werner100359",
      "license": "CC BY-SA 3.0",
      "file": "File:Players before the match98.JPG"
    }
  ],
  "robert-lewandowski": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Robert_Lewandowski_2018%2C_JAP-POL_%28cropped%29.jpg/330px-Robert_Lewandowski_2018%2C_JAP-POL_%28cropped%29.jpg",
      "author": "Светлана Бекетова",
      "license": "CC BY-SA 3.0",
      "file": "File:Robert Lewandowski 2018, JAP-POL (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Fu%C3%9Fball_Arena_Vestiaires_FC_Bayern_M%C3%BCnchen_Munich_1.jpg/330px-Fu%C3%9Fball_Arena_Vestiaires_FC_Bayern_M%C3%BCnchen_Munich_1.jpg",
      "author": "Chabe01",
      "license": "CC BY-SA 4.0",
      "file": "File:Fußball Arena Vestiaires FC Bayern München Munich 1.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Fu%C3%9Fball_Arena_Vestiaires_FC_Bayern_M%C3%BCnchen_Munich_2.jpg/330px-Fu%C3%9Fball_Arena_Vestiaires_FC_Bayern_M%C3%BCnchen_Munich_2.jpg",
      "author": "Chabe01",
      "license": "CC BY-SA 4.0",
      "file": "File:Fußball Arena Vestiaires FC Bayern München Munich 2.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Lewandowski_2014.jpg/330px-Lewandowski_2014.jpg",
      "author": "Thomas Rodenbücher",
      "license": "CC BY 2.0",
      "file": "File:Lewandowski 2014.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/20190428_DFL_1._Bundesliga_FCN_-_FCB_850_0565.jpg/330px-20190428_DFL_1._Bundesliga_FCN_-_FCB_850_0565.jpg",
      "author": "Granada",
      "license": "CC BY-SA 4.0",
      "file": "File:20190428 DFL 1. Bundesliga FCN - FCB 850 0565.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/2019147183134_2019-05-27_Fussball_1.FC_Kaiserslautern_vs_FC_Bayern_M%C3%BCnchen_-_Sven_-_1D_X_MK_II_-_0228_-_B70I8527_%28cropped%29.jpg/330px-2019147183134_2019-05-27_Fussball_1.FC_Kaiserslautern_vs_FC_Bayern_M%C3%BCnchen_-_Sven_-_1D_X_MK_II_-_0228_-_B70I8527_%28cropped%29.jpg",
      "author": "Sven Mandel",
      "license": "CC BY-SA 4.0",
      "file": "File:2019147183134 2019-05-27 Fussball 1.FC Kaiserslautern vs FC Bayern München - Sven - 1D X MK II - 0228 - B70I8527 (cropped).jpg"
    }
  ],
  "bukayo-saka": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/1_arsenal_crystal_palace_epl_champions_2026.jpg/330px-1_arsenal_crystal_palace_epl_champions_2026.jpg",
      "author": "Chensiyuan",
      "license": "CC BY-SA 4.0",
      "file": "File:1 arsenal crystal palace epl champions 2026.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/1_bukayo_saka_arsenal_2025_%28cropped%29.jpg/330px-1_bukayo_saka_arsenal_2025_%28cropped%29.jpg",
      "author": "Chensiyuan",
      "license": "CC BY-SA 4.0",
      "file": "File:1 bukayo saka arsenal 2025 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/RC_Lens_-_Arsenal_FC_%2803-10-2023%29_16.jpg/330px-RC_Lens_-_Arsenal_FC_%2803-10-2023%29_16.jpg",
      "author": "Supporterhéninois",
      "license": "CC0",
      "file": "File:RC Lens - Arsenal FC (03-10-2023) 16.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Manchester_United_v_Arsenal%2C_2_December_2021_%2832%29.jpg/330px-Manchester_United_v_Arsenal%2C_2_December_2021_%2832%29.jpg",
      "author": "Ardfern",
      "license": "CC BY-SA 4.0",
      "file": "File:Manchester United v Arsenal, 2 December 2021 (32).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Jurrien_Timber_Celebrates.jpg/330px-Jurrien_Timber_Celebrates.jpg",
      "author": "Abhignya thakore",
      "license": "CC0",
      "file": "File:Jurrien Timber Celebrates.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Premier_League_Newcastle-Arsenal_2023-05-07_06.jpg/330px-Premier_League_Newcastle-Arsenal_2023-05-07_06.jpg",
      "author": "SonoGrazy",
      "license": "CC BY-SA 4.0",
      "file": "File:Premier League Newcastle-Arsenal 2023-05-07 06.jpg"
    }
  ],
  "florian-wirtz": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Florian_Wirtz_04012026_%283%29_%28extracted%29.jpg/330px-Florian_Wirtz_04012026_%283%29_%28extracted%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Florian Wirtz 04012026 (3) (extracted).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Liverpool_Players_Training_04012026_%284%29.jpg/330px-Liverpool_Players_Training_04012026_%284%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Liverpool Players Training 04012026 (4).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Florian_Wirtz_04012026_%284%29.jpg/330px-Florian_Wirtz_04012026_%284%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Florian Wirtz 04012026 (4).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Liverpool_Players_Training_04012026_%282%29.jpg/330px-Liverpool_Players_Training_04012026_%282%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Liverpool Players Training 04012026 (2).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Curtis_Jones%2C_Conor_Bradley%2C_Virgil_van_Dijk_and_Florian_Wirtz_04012026_%281%29.jpg/330px-Curtis_Jones%2C_Conor_Bradley%2C_Virgil_van_Dijk_and_Florian_Wirtz_04012026_%281%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Curtis Jones, Conor Bradley, Virgil van Dijk and Florian Wirtz 04012026 (1).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Conor_Bradley%2CVirgil_van_Dijk_and_Florian_Wirtz_04012026_%281%29.jpg/330px-Conor_Bradley%2CVirgil_van_Dijk_and_Florian_Wirtz_04012026_%281%29.jpg",
      "author": "Timmy96",
      "license": "CC0",
      "file": "File:Conor Bradley,Virgil van Dijk and Florian Wirtz 04012026 (1).jpg"
    }
  ],
  "erling-haaland": [
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Erling_Haaland_June_2025.jpg/330px-Erling_Haaland_June_2025.jpg",
      "author": "MichaelEmilio",
      "license": "CC BY 4.0",
      "file": "File:Erling Haaland June 2025.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Erling_Haaland_Morocco_v_Norway_7_June_2026-51.jpg/330px-Erling_Haaland_Morocco_v_Norway_7_June_2026-51.jpg",
      "author": "Bryan Berlin",
      "license": "CC BY-SA 4.0",
      "file": "File:Erling Haaland Morocco v Norway 7 June 2026-51.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/FC_RB_Salzburg_versus_SV_Mattersburg_%284._Juli_2019%29_29.jpg/330px-FC_RB_Salzburg_versus_SV_Mattersburg_%284._Juli_2019%29_29.jpg",
      "author": "Werner100359",
      "license": "CC BY-SA 4.0",
      "file": "File:FC RB Salzburg versus SV Mattersburg (4. Juli 2019) 29.jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/ManCity20240722-031_%28cropped%29.jpg/330px-ManCity20240722-031_%28cropped%29.jpg",
      "author": "Hameltion",
      "license": "CC BY-SA 4.0",
      "file": "File:ManCity20240722-031 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/WolvesvManCitySeptember2022_2_%28cropped%29.jpg/330px-WolvesvManCitySeptember2022_2_%28cropped%29.jpg",
      "author": "Bex Walton",
      "license": "CC BY 2.0",
      "file": "File:WolvesvManCitySeptember2022 2 (cropped).jpg"
    },
    {
      "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Erling_Haaland_2020.jpg/330px-Erling_Haaland_2020.jpg",
      "author": "Vyacheslav Evdokimov",
      "license": "CC BY-SA 3.0",
      "file": "File:Erling Haaland 2020.jpg"
    }
  ]
};
