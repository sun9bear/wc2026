# 下一会话执行清单（2026-06-13 晚 移交，配合 HANDOFF.md）

> 上一批已全部完成并部署：任务 2-6（AI英文内容/留存/埋点/擂台/摆动卡）+ 分享按钮 v1 + 中文队名 + FIFA 撇清全站清理 + 比赛分享卡 3:4 网站风格重做 + 国旗&时间修复。git: `feat/legal-pages` 顶 `b1f645e`。
> 本文件 = **新一批待做功能**的实施规格 + 数据源/版权结论。已勘察代码，照做即可。

## 冷启动开场白（复制给新会话）
> 读 docs/HANDOFF.md 和 docs/NEXT-SESSION.md 接手 wc2026，按本清单做任务 A–E：构建、部署、线上验证、提交、刷新 `D:/wc2026-backup.bundle`。当前在 `feat/legal-pages`（真正主干），部署唯一路径 `npx vercel deploy --prod --yes`（已授权）。GateGuard：每文件首次编辑前在消息里列 4 事实后重试。

## 现有分享架构（勿重查，直接在此基础上改）
- **OG 图卡** `src/app/api/og/route.tsx`：默认=球队出线/夺冠卡(1200×630)；`mode=swing`=爆冷摆动卡；`mode=match`=比赛胜平负卡（已重做：`fmt=portrait`(1080×1440)/`fmt=square`(1080×1080)；队旗 `hf/af` **仅 flagcdn.com**(防 SSRF)；开球时间 `t`；AI 短评 `q`；DESIGN.md 配色 绿`#1BE27F`/琥珀`#FFB02E`/红`#FF5436`；底注「预测仅供娱乐」；所有用户可控参数过雷词 fail-closed）。中文字体按传入文本子集 `loadZhFont`。
- **比赛页分享** `src/components/MatchPreviewShare.tsx`（未开赛卡：🔗分享 + 🖼保存图片卡；ogUrl 带 fmt/hf/af/t/q；kickoff 用浏览器本地时区+缩写格式化）；`MatchSwingShare.tsx`（已结算大爆冷）；页眉右上 `ShareIconButton.tsx`（**当前过简、无图片按钮 → 见任务 A**）。
- **比赛页** `src/app/match/[id]/page.tsx`：国旗从 `getForecast()+teamSlug()+findTeam()` 取（flagcdn，与球队卡同源）；AI 短评 = `locale==="zh" ? m.sentiment : m.sentimentEn`（中文 DeepSeek / 其他 Gemini，已是现有内容管线，无需改）。
- **计算器分享** `src/components/CalculatorFocus.tsx`（🔗分享 + 🖼分享图卡 + 复制；用默认 team OG 卡）。
- 队名翻译 `teamName(name, locale)`（@/lib/football/teams）；队旗源 = forecast `team.flag`（flagcdn `/w80/`）。

## 任务 A：分享按钮移到右上角 + 重做样式（用户精确规格）
现状：右上角 `ShareIconButton` 过简、且无图片分享；绿色"分享"+"保存图片卡"埋在页面中部 `MatchPreviewShare` 卡内。
要做：
1. 把**分享图片** + **分享链接**两个动作从页面中部**移到页眉右上角**（替换现 `ShareIconButton`）。
2. **分享链接按钮弱化**（ghost/次要：仅描边或纯文字、灰色 muted）。
3. **分享图片按钮醒目**：绿色 `#1BE27F` 发光边框 + **呼吸动画**（box-shadow 脉冲；参考 DESIGN.md §6「LIVE 圆点脉冲 1.6s 循环」+ §4「绿色微光 `0 0 18px rgba(27,226,127,.15)`」；**必须尊重 `prefers-reduced-motion`** 关闭动画）。
4. 行为：图片按钮 = 打开 `mode=match&fmt=portrait` 的 OG（保存图片卡）或原生 `navigator.share`（带图需 fetch+File，可选）；链接按钮 = `navigator.share({url,text})` 或复制降级。
5. 把分享动作抽成可复用组件/hook（`onShareImage`/`onShareLink`），比赛页与计算器页眉复用；计算器右上已有「看模型概率版」链接，注意排版（图标化或并排）。
6. `MatchPreviewShare` 卡内可保留概率展示，分享按钮以页眉为主入口。

## 任务 B：队伍详情页 `/team/[slug]`
- 新建 `src/app/team/[slug]/page.tsx`，展示：**出线概率 + 夺冠概率**（forecast 已有 `pAdvance`/`pChampion`）、**实力评分**（用现有 Elo `rating`，标注「模型实力评分」——**不要写「官方 FIFA 排名」**，见数据源结论）、**最近战绩**（football-data 已有 FINISHED 比分，按队过滤近 5 场）。
- `generateMetadata` 出问题式标题 + 该队 OG 卡（复用现有 team 卡）；进 `sitemap`（48 队 = 48 个着陆页，强 SEO）。
- 交叉链接 → 该队计算器（`/calculator?team=slug`）、→ 该队下一场比赛页。
- **队名/国旗全站可点 → 详情页**：改 `TeamBadge` 组件包成 `<Link href="/team/[slug]">`，一处改全站生效。
- 页内醒目「设为主队」按钮（见任务 C）。

## 任务 C：设为主队 + /me 主队 + 主队分享图
- 存储：localStorage `my_team`(slug) 起步（零 DDL）；或 `profiles.fav_team` 列（走 HANDOFF 的隧道 DDL，模式照抄 0004 尾部 GRANT）。
- 详情页「设为主队」按钮；`/me` 顶部展示主队卡（出线/夺冠概率 + 实力评分 + 下一场）。
- 主队分享图：复用 OG team 卡 + 署名（「XX 的主队」），`/me` 一键生成。

## 任务 D：二维码（仅 zh 卡）
- 结论：微信/小红书长按识别 QR 是标配，**华人面价值高**；西方平台（X/Reddit/IG）App **不扫** feed 图里的 QR（iOS 相册实况文本 / Android Lens 能识别但非通用手势）→ **en 卡不加**。
- 实现：加 `qrcode` 库服务端生成（data URL / SVG）嵌入 OG；仅 `locale=zh`（或加 `qr=1` 参数）时渲染，角落小 QR + 「扫码自己算」。

## 任务 E：比分概率上卡（Top-3）
- `mode=match` 卡加一行「最可能比分 1-0 17% · 2-0 12% · 0-0 8%」（Top-3）。数据来自 `getMatchScoreline`（已有 Top-5）；比赛页传给 `MatchPreviewShare` → og 新 param（过雷词、截断）。这是独家数据，提升分享性与信息密度。

## 数据源 / 版权结论（用户问，已查证 2026-06-13）
- **FIFA 世界排名**：排名数字是「事实」，**不受版权保护**，引用单个排名作为信息点一般 OK。注意 ① 别用 FIFA **logo**/暗示官方授权（商标问题）；② 别整表照搬 **CC-BY-NC（仅非商用）** 数据集（如 jfjelstul/worldcup，商用违约）；③ 欧盟「数据库权」——整库复制有风险，引用单点没事。无官方公开 API；可用源：**openfootball（公共领域、商用 OK）**、抓 FIFA 公开排名页（注意 ToS）、或确认已有 key 的 API-Football / Sportmonks 是否含 ranking。
- **球员身价**：单个数字非典型版权，但**唯一权威源 Transfermarkt 明禁抓取/商用**（ToS + 数据库权）；第三方「Transfermarkt API」（Apify/BrightData/开源 wrapper）本质都是抓 Transfermarkt，同样 ToS 风险 + 不稳定，**无干净免费授权源**。→ 这是真正的风险点。
- **建议（重要）**：详情页**别声称「官方 FIFA 排名 / 身价」**，改用**自己已有的 Elo 实力评分**（本就是模型概率的真实输入因子，零版权风险、零成本）+ 出线/夺冠概率 + 最近战绩。要「排名感」就标「模型实力评分」。身价/官方排名等找到**付费授权**源再加。

## 完成后
`npm run build` + 部署 + 线上验证（详情页渲染 / 设主队 / 主队分享图 / 卡片 QR 与比分行 / 右上角呼吸按钮）+ `git add -A && git commit` + `git bundle create D:/wc2026-backup.bundle --all` + 更新 HANDOFF「已交付」表。
