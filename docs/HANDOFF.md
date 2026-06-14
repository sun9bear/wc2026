# wc2026.cool 项目交接文档

> 更新：2026-06-14 凌晨 ｜ 世界杯 6/11 已开幕，决赛 7/19 ｜ 站点 https://www.wc2026.cool 运行正常
> 用途：新会话/新协作者凭本文档即可接手，无需回溯历史对话。配合阅读：Claude 记忆文件
> `C:\Users\Administrator\.claude\projects\D--------worldcup2026\memory\*.md`

---

## 一、项目定位与战略（经 8-agent 调研 + 3 轮对抗核查定稿）

**是什么**：免费虚拟积分世界杯竞猜游戏（无真钱、积分永不可兑换），Next.js 16 + Supabase + Vercel，中英双语，匿名即玩（signInAnonymously，无注册墙——这是最大转化优势，分发文案要打 "no sign-up"）。

**目标用户**：海外华人（北美/欧洲，AdSense 高价值区）+ 英语球迷。大陆流量对变现无贡献且有副作用（smart pricing）。

**回本口径（诚实版）**：
- 回本 $6.18 域名 ≈ 必然；回本 $206（域名+一月 Max）按应计收入算概率 10-20%；现金 5 周内到账概率 0%（AdSense $100 起付+PIN 邮寄+次月 21 日付款，最早 8 月见钱）
- **及格线 = 赛事结束时 AdSense 应计 + 联盟确认 ≥ $100**（够起付线，钱最终拿得到）
- 变现优先级（**⚠️ 6/13 更新：Fubo 联盟申请被拒且禁止再申请，该路径已死**）：① AdSense 按社交流量真实 RPM $1-3（现唯一主力或有收入）② Ko-fi+爱发电锦上添花（Buy Me a Coffee 不可用，Stripe 不支持大陆）③ Impact 平台仍可申其他非博彩联盟（Fubo 之外；拒信亦提示 impact.com 有更多机会）

**差异化（核查后幸存的真空白）**：
1. 实时第三名出线计算器（唯一竞品需手动输数据；已上线 `/calculator`）
2. 免费"倍率+串关"虚拟玩法（公开 Web 空白，Superbru 等都是猜比分）
3. 海外华人中文合法竞猜（中文 SERP 全是灰产假官方站）
- 已毙掉的伪需求：bracket 模拟器（8+ 站饱和）；小红书引流（禁外链+严打，只做水印曝光）

**流量预期（怀疑论者修正版）**：5 周基线 3k-12k UV；爆帖中奖 1.5-2.5 万。SEO 在 7/19 前 ≈0，靠社交分发。黄金窗口 **6/22-27 小组赛末轮**（"我的队还有戏吗"需求峰值）。

**合规红线（绝对不能破）**：
- 英文可索引面禁：odds / bet / betting / wager / bookmaker / parlay / stake / payout / multiplier / sportsbook / accumulator / handicap / tipster（`src/lib/compliance/bannedTerms.ts` 已扩词+复数匹配，AI 输出 fail-closed）
- 中文禁：赔率/盘口/水位/投注/下注/荐彩/带单/稳赚（站内"串关/倍率/竞猜"为既定合规用词）
- 积分永不可充值、不可兑换任何有价物（大陆刑事红线 + Google sweepstakes 红线）
- Polymarket/博彩品牌**前端零暴露**（后端数据源随便用，对外只写 "public forecasting data"）
- AdSense 审核期：概率页与下注 UI 分屏隔离（不同页面、互不引用）
- Reddit 分发以"场景计算器/OC 数据图"身份，**绝不提竞猜**（r/soccer 明文禁 betting 主题帖）

## 二、已交付（按时间线，全部在生产）

| 日期 | 交付 | 备注 |
|---|---|---|
| 6/14 | **SEO/GEO Phase 2（P1）全量上线**（feat/legal-pages `b015961`，部署生产 dpl_AyenaGrtVbvg7ginnY6CfKkQrXRi + 线上验证；tsc 净、144 vitest 全过、eslint 0、next build 净；12-agent 理解侦察 + 5 维多 agent 对抗评审 safe-to-deploy） | ①**P1-1 `/forecast/best-thirds` 独立可索引页**（独家资产）：12 个小组第三名横排（前 8 晋级，虚线为出线分数线）+ FIFA Annex C 的 C(12,8)=495 行「第三名→小组第一」R32 对阵映射（`bracket.ts`）；复用 `getForecast()` 共享缓存零额外蒙卡成本；ItemList JSON-LD 只填真字段、dateModified 取真实 settled_at；EN-first 前置答案（含 2026+算出的分数线）；可见「更新于」用 `getSettledIndex().all`；入 sitemap（带真实 lastmod）+ 合规扫描路径，与 /forecast 互链。②**P1-2 IndexNow**（`src/lib/seo/indexnow.ts`）：结算后经 `after()` fire-and-forget ping **仅 Bing/Yandex（绝不接 Google）**，只挂 `/api/cron/settle` 且守 `newlySettled>0` 自去抖；全程 fail-soft（Promise.allSettled + 各端 5s AbortController）；**公钥硬编码 + 明文 `public/6bdb6379e0b34e999e3d0dd720ba612f.txt` 字节匹配，无需 Vercel env**。③**P1-3 标题意图重写**：组页/队页标题前置 "who advances" / "Can [team] still advance?"（中英各 2 处），canonical/OG/desc 不动。线上验证：best-thirds 200+自指 canonical+ItemList+前置答案、key 文件 200 内容精确、sitemap 含 best-thirds(lastmod 真实)、组页标题已含 who advances、合规扫描器全 26 项 0 雷词。**待用户**：GSC 手动收录 /forecast/best-thirds + 重点 group/matchday-3 页（赶 6/22-27 窗口）。**后续**：P1-4 可嵌入 widget；P2 i18n+hreflang（干净做或推迟）；Phase 4 只读 AI 侦察。 |
| 6/14 | **SEO/GEO Phase 1B 全量上线**（feat/legal-pages `0255a87`，部署生产 + 线上验证；next build 净、144 vitest 全过） | ①**/rules 常青页**（双语赛制 + 出线规则详解，FIFA Art.13 组内 H2H 优先 / 第三名横排判据，对齐 standings.ts；答案前置 TL;DR；导流 /calculator+/forecast；入 sitemap+llms.txt）。②**JSON-LD**（新 `src/lib/seo/jsonLd.tsx`，服务端渲染 + `<`→< 转义 + 只填真字段；已 curl 确认在初始 HTML）：WebSite+Organization(layout)、Dataset[dateModified=settled_at](forecast)、ItemList(group)、SportsEvent+BreadcrumbList(match)、SportsTeam+BreadcrumbList(team)。③**内链中枢**：forecast 最佳第三名行→组页、组页赛程→比赛页 + →/rules、队页→组页 + →/rules。④**合规闸生效验证**：扫描器抓到我在 /rules en 误写的 "advancement odds"→已改 "chances"、复扫 0 命中（证明 fail-closed 有效）。**待用户**：GSC 手动收录 /rules + group + matchday-3 页。 |
| 6/14 | **SEO/GEO Phase 1A 全量上线**（feat/legal-pages `6223fbc`，部署生产 dpl_4FmJMtoMSzzwToAS8po3LKjsHv3V + 线上验证；next build 净、144 vitest 全过；**12-agent 调研 + 5 轮 CodeX 外审收敛**，方案 docs/SEO-GEO-PLAN.md） | ①**canonical BLOCKER 修复**：根 layout 删相对 `./`（内页曾误 canonical 到首页，伤收录），各可索引路由显式绝对自指（home/forecast/match/combo/leaderboard/watch/calculator/about/privacy/disclaimer；team/group 原有）。②**真实新鲜度**：新建 `src/lib/seo/freshness.ts`（getSettledIndex，仅从 matches.settled_at 派生，unstable_cache revalidate 600），sitemap lastModified 不再缺失/不伪造 now/不调 getForecast；group 仅组赛更新。③**GEO**：forecast/team/group 前置「带统计数字的答案句」（EN-first 含 2026）；team/group 可见「最新赛果」；match 语义 `<h1>` + 每场默认标题（原 `{}`）+ 完整 openGraph（og.png 兜底）。④**合规**：「市场共识/market consensus」→「公开预测数据」；新增 public/llms.txt + `scripts/seo-compliance-scan.ts`（import 真实雷词表、fail-closed）。**待用户**：GSC 手动请求收录 group/matchday-3 页。**后续**：1B(JSON-LD+/rules) / 2(IndexNow+best-thirds) / 3(i18n+hreflang) / 4(只读 AI 侦察)。 |
| 6/14 | **任务 A–E 全量上线**（feat/legal-pages，已部署生产 dpl_6Y54qR4…+线上验证；next build 净、144 vitest 全过；17-agent 对抗审查 6 项确认全修） | ①**A 分享入口移右上**：新建 `HeaderShare`（图片卡按钮=绿色发光呼吸边框 `.breathe-glow`+尊重 reduced-motion；链接按钮弱化 ghost），比赛/计算器/球队页页眉复用；删 `ShareIconButton`；`MatchPreviewShare` 退化为纯概率展示；URL 构造抽到 `src/lib/share/matchCard.ts`。②**B 球队详情页 `/team/[slug]`**：出线/夺冠概率+**模型实力评分(Elo，标注非官方排名)**+最近5场战绩+下一场+计算器交叉链接；新建 `getTeamDetail.ts`；48 队进 sitemap（仅收 A-L 组）；`TeamBadge` 加 `linkToTeam`（比赛页启用，MatchCard 不启用以免整卡链接嵌套 `<a>`）。③**C 设为主队**：`localStorage(my_team)` 零 DDL，`SetMyTeamButton`+`/me` `MyTeamCard`（拉 `/api/team/[slug]`，「XX的主队」署名分享图）。④**D 二维码**：`qrcode` 库，仅 zh 卡角落 QR（编码本站路径 `u`，fail-soft），en 卡不加。⑤**E 比分上卡**：`mode=match` 卡加 Top-3 最可能比分（数字 `sl` 参数）。**审查修复**：OG 用户可控文本 `h/a/t/q/tag` 改 `findBannedTermsStrict`（防全角/零宽/拆分绕过，与 `by/result` 同级）；`HeaderShare`/`MatchPreviewShare` 开球时区 hydration 守门；`getTeamDetail` 显式 `status==='settled'`。新增依赖 `qrcode`(+@types)。 |
| 6/12 夜 | **修复全站 500 生产事故**（6/10 起持续 54h+，除首页外全挂） | Vercel CLI 重新部署即愈；根因未深究（旧部署损坏） |
| 6/13 | **Parlay 措辞洞修复**（commit f7b144b） | nav→Combo、/parlay→/combo(308)、/api/bet→/api/predict、请求体 stake→points、雷词表+8 词 |
| 6/13 | **SEO 基建**（991b1cb, 7290a06） | robots.ts、sitemap.ts(78+ URL)、Accept-Language 驱动英文默认 metadata（无中文头的访客/爬虫得 lang=en）、og.png、canonical 统一 www、GSC 已验证+提交收录 |
| 6/13 | **/watch 观赛指南**（e14ece6） | 双语，纯官方转播直链（FOX/Peacock/TSN/咪咕/FIFA）；**Fubo 痕迹 6/13 已清（申请被拒）** |
| 6/13 | ~~Fubo 联盟申请（Impact，In Review）~~ **6/13 被拒且禁止再申请——路径已死**；W-8BEN + Wise 美元账户收款仍可用于其他 Impact 联盟 | — |
| 6/13 | **The Odds API 实测**：免费 500 credits/月，1 credit 返回全部 70 场×24 机构 | **$30 档不用买**；key 在 .env.local |
| 6/14 凌晨 | **概率引擎+页面全量上线**（30b8590, caabf9a, 93d01b0） | 见下节；109 个 vitest 全过 |
| 6/14 | 快照持久化代码（7b68152，**已提交未部署**） | 等 0002 迁移完成后部署即自动攒历史 |
| 6/13 | **全球受众改版上线**（结算自驱动+全站双语+本地时区+加载页+倍率种子） | 受众定位扩为全球球迷。①结算：runSettlement 抽库 + 首页/比赛页 after() 流量自驱动结算（10 分钟节流幂等），修复每日 cron 滞后 24h+；已手动清 3 场积压。②EN 视图全量可用：队名/赛段/按钮/免责声明双语，中文 AI 内容对 EN 折叠。③LocalTime 组件+客户端日期分组：全站按浏览器时区显示（带 GMT 标注）。④首页 hero：计算器主入口+今晚焦点+1000 积分横幅；底部导航"串关"→"出线"。⑤loading.tsx×3 加载页。⑥proxy.ts 首访写 NEXT_LOCALE/wc_country cookie（为小语种扩展备）。⑦scripts/seed-pools.ts 用市场共识概率灌注 69 场倍率（≈1/p）。⑧THE_ODDS_API_KEY 已入 Vercel 生产；.env.local 吞行已修。计划文档 docs/GROWTH-PLAN.md |
| 6/13 | **任务 2-6 全量上线**（commit 5628c55，已部署生产+线上验证；备份 D:/wc2026-backup.bundle） | NEXT-SESSION 清单 2-6 一口气做完，121 vitest 全过。①**英文 AI 内容（Gemini Flash）**：新建 `src/lib/ai/gemini.ts`（REST v1beta，默认 `gemini-3.1-flash`，404 时 ListModels 自动选最新 flash），content.ts 加 EN prompts（r/soccer 梗味，雷词 fail-closed），getMatchDetail 增 previewEn/recapEn/sentimentEn，match 页 EN 优先英文平铺/无则折叠中文，settle 路由生成 recap_en（CAP 8→4），**新建 `/api/cron/gen-content`** 幂等回填（≤8 场/次，Gemini 只在 Vercel 端可达，本机 geo 拦截）。②**留存三件**：/api/me 增 recent/streak/bestStreak（按 kickoff 排序）+beatPct，SettleDrawer 结算揭晓抽屉（挂 / 与 /me，localStorage `last_seen_settled_at`+BottomNav 红点），MeClient emoji 战绩格复制+连胜头部。③**埋点**：0003_events.sql，`/api/track`（同源校验+内存限流），5 个客户端事件，@vercel/analytics（**需 Dashboard 手动 Enable**）。④**昵称+私人擂台**：0004_leagues.sql，/api/profile 昵称，/api/league 创建/加入/[code]（全 service key），/league+/league/[code] 双语页（noindex 仅私域），入擂台须先有昵称，口令容错（含漏横杠）。⑤**爆冷摆动卡**：/api/og 加 `mode=swing`（result 过雷词闸），scripts/swing-bake.ts 本地预烘焙。**对抗审查 36 agents 确认并修复 3 项**：OG result 雷词过滤、track 同源+限流、league code 容错。0003/0004 已隧道执行（service_role 已 GRANT）。**⚠ .env.local 的 CRON_SECRET 与生产不一致——调生产 cron 用 docs/secret/vercel.env 那个（len 39）** |

## 三、概率引擎架构（`src/lib/prob/`）

```
数据：Supabase(anon读) → football-data FINISHED 实时比分合并 → Odds API h2h(eu) → eloratings.net TSV
单场：逐家去水→中位数共识(机构≥4 时 w=0.75) + Elo→λ(总进球2.6, 主队东道主+100) →
      Dixon-Coles 矩阵(ρ=-0.08, 0-8) → 一维搜索校准 λ 贴合融合后胜平负（三层概率自洽）
锦标赛：万次蒙特卡洛 —— 2026 新规排名（积分→相互战绩递归→整体净胜/进球→评分代理FIFA排名）
      → 第三名 Annex C 495 行查表(thirdAllocation.json, 生成器 scripts/gen-third-allocation.ts)
      → R32 16 场模板 + M73-M104 衔接(bracket.ts) → 加时 λ/3 → 点球 Elo 期望(截断0.35-0.65)
缓存：unstable_cache 1h（=Odds API 最多 24 credits/天）；页面 maxDuration=60
AI：DeepSeek 只写双语短评（夺冠 Top3 一句话），雷词 fail-closed；绝不参与数值计算
```

**关键决策及理由**：
- **LLM 不算概率**：口头概率系统性过自信（ECE~0.3）、同输入不同输出、胜平负与比分矩阵算术不自洽、贵 10-100 倍——行业（Opta/高盛/538/开源同行）全部用统计模型，LLM 只配写解说
- **无状态 v1**（按需计算+缓存）而非 cron+建表：因 SUPABASE_DB_URL 当时缺失 + Vercel Hobby cron 只支持每日一次；事件感知靠 football-data FINISHED 合并
- **2026 排名新规与往届相反**：相互战绩优先于整体净胜球（经 Wikipedia 逐字核对 FIFA 规程）；末两级判据（公平竞赛分/FIFA 排名）无数据，用 Elo 近似并在页面标注
- 第三名分配**必须查表**不能贪心匹配（FIFA Annex C 是确定性映射）；matchThirds() 回溯匹配只作兜底

## 四、待办事项

**P0（接手先做）**
1. **执行 0002 迁移**（建 3 张概率历史表）。阻碍：本机连不通 Supabase Postgres 端口（直连 IPv6-only；各区域 pooler 被网络重置），Supabase 仪表盘因 GitHub OAuth 封禁登不上。两条路：
   a. 走 D:\daili 的 v2ray 代理（美国出口）做 SOCKS5 本地端口转发 → `npx tsx scripts/migrate.ts supabase/migrations/0002_probabilities.sql`（连接串在 .env.local 的 SUPABASE_DB_URL；pg 不认 HTTP_PROXY，需写无依赖 SOCKS5 转发脚本；SOCKS 远端解析域名可顺便绕过 IPv6 问题）
   b. GitHub 解封后登仪表盘 SQL Editor 直接粘贴执行
   完成后 `npx vercel deploy --prod --yes` 部署快照写入（用户已授权部署），验证：anon GET `/rest/v1/prob_meta?select=key` 返回 200
2. ~~把 THE_ODDS_API_KEY 加进 Vercel 生产环境变量~~ **已完成（6/13，CLI `vercel env add`+重新部署；DEEPSEEK_API_KEY 实测本就在生产）**
3. **GitHub 申诉**（support.github.com）——解封后恢复：push 备份、Supabase 仪表盘、Git 自动部署链
4. **UptimeRobot 监控**（一直没做！上次 54h 无人发现的事故不能重演）：监控 / 和 /leaderboard
5. 用户日课：**Reddit 养号**（每天 match thread 真实评论，6/22 前攒 50-100 karma）+ **X Premium $8**
6. **【6/13 新增，已配】cron-job.org gen-content**：每小时 GET `/api/cron/gen-content`（header `x-cron-secret`，已配好生效）。回填英文 AI 内容（preview_en/sentiment_en/recap_en，幂等≤8 场/次）。**注意：Gemini 本机调不通（geo 拦截），只能 Vercel 端跑，别写本地回填脚本。**
   - **【6/13 修复】/forecast 预热任务报 "output too large"**：cron-job.org 拉整页 HTML 超下载上限判失败（会触发自动禁用，进而停掉 prob_*_snapshots 快照累积）。已新建轻量端点 `/api/cron/warm`（commit 见下，跑同一 getForecast()，只回 ~60 字节 JSON）。**把那条 /forecast 任务的 URL 改成 `https://www.wc2026.cool/api/cron/warm`（无需 header）即可。**
7. **【6/13 新增】Vercel Dashboard → wc2026 → Analytics 点 Enable**（@vercel/analytics 已接入代码，免费档，看地理分布以决定下一步小语种）。

**P1（一周内）**
6. 6/22-27 分发窗口素材：第三名场景 OC 数据图（r/worldcup、国家队 sub）、X 图卡（正文原生图+链接放回复）、爆冷摆动卡（终场后 15 分钟内发）
7. ~~Fubo 批准后换 /watch LINKS 为追踪链接~~ **作废（6/13 Fubo 被拒且禁止再申请）；日后若过其他 Impact 联盟再议**
8. AdSense 审核结果跟进（若拒且因低价值内容：比赛页加 AI 前瞻正文厚度后复审）
9. ~~概率历史曲线前端~~ **已上线（6/13，commit 8265562，已部署生产+线上验证）**：`src/lib/prob/getTrends.ts`（getTeamAdvanceTrends 按队分组+降采样24点+|Δ|倒序 / getMatchProbTrend 单场胜平负<3点返null；均 unstable_cache 600s；**降序+limit 取最新再反转，规避 PostgREST 1000 行硬顶静默丢最新行**）；`MatchProbTrend.tsx`（SSR，接 /match[id] open 分支）；/forecast 加「📈 出线概率异动」top6(|Δ|≥0.02，无数据降级"追踪中"双语 note)；「近期比赛」死 div → TrackedLink+「预测 →」CTA（④ 转化）；Sparkline 加 fluid 自适应宽修窄屏溢出。15-agent 对抗审查修 2 项（行顶截断 high、窄屏溢出 medium）。
   - ~~摆动 OG 图卡前端入口~~ **已上线（6/13，commit 472829c，生产已验证）**：比赛页「爆冷瞬间」模块——已结算且出线概率摆动 ≥10pp 时显示页内摆动视觉（before 删除线→after 大数字绿涨红跌）+ **Web Share 原生分享**（降级复制+toast）+「保存图片卡」直链 OG PNG；`generateMetadata` 把 og:image 设为摆动卡（分享链接自动展开震撼图）；挂载拉 /api/me 按队名匹配→**本人押中则第一人称『你猜中了这场爆冷』**（参与感）。新建 `getMatchSwing.ts`（before=开球前快照，after=settled_at 起首张→稳定可归因）+ `MatchSwingShare.tsx`；埋点 swing_card_view/swing_share_click。21-agent 对抗审查修 3 项（连字符 slug high、after 漂移 medium、窄屏溢出 medium），并修好既有球队卡 OG 的连字符 bug（findTeam 对称归一化）。线上验证：美国 4-1 巴拉圭摆动卡渲染（巴拉圭 65%→43%）。
   - **结算揭晓抽屉接入「晒爆冷」**（6/13，commit 856baca，生产已验证）：SettleDrawer 揭晓时对本人押中的未读爆冷场拉 `/api/swing?id=` 摆动，命中即在揭晓行挂『🎯 晒这波爆冷』Web Share 原生分享（情绪峰值转化）。新建 `/api/swing` + `/api/me` recent[] 补 matchId + `src/lib/share/swingShare.ts`（分享文案单一审计点）。**对抗审查 high 根因修复**：爆冷判定从『任意大摆动』收紧为『真爆冷方向』（被看好≥50%却崩盘 / 不被看好<50%却飙升）——『大热确认』不再误标爆冷，且『真爆冷+本场押中⇒押中了意外结果』使第一人称『我猜中了这场爆冷』为真（既修误标又保个性化）。埋点 swing_card_view/swing_share_click(source)。
   - **可识别个性化分享身份 + 对抗审查加固**（6/13，commit 4eb8c18 实施 / 05b60c1 加固，均生产验证）：零注册身份——趣味默认名（`defaultName` FNV-1a 确定性，中英词表预筛雷词）替换丑陋 `玩家XXXX`、昵称印上摆动卡 OG `?by=`、/me 与分享处随处改名。**多 agent 对抗审查（5 维 19 项确认·逐项对抗复核）修复 4 类**：① 合规红线——身份字段雷词闸可被全角/零宽/空格拆分/驼峰/数字粘连绕过，且经昵称漏到「公开且进 sitemap」的 /leaderboard（HTML 可索引）→ 新增 `findBannedTermsStrict`（NFKC 归一+去零宽+删分隔+子串）专用于昵称/擂台名/OG by，`validateNickname` 加拒控制/格式字符（含 RTL override 显示欺骗）+ 规范形存库（**正文仍用词边界版 `findBannedTerms` 避免误伤行文**，职责分离）；② i18n 回归——`getLeaderboard`/`getLeagueBoard` 写死 `defaultName(uid,"zh")` + 页面失效的 `replace(/^玩家/…)`（新趣味名无此前缀）致英文访客/Googlebot 在可索引排行榜看一片中文 → 按 locale 透传 + 删死补丁（线上验证 EN=CoolMaestro30 / ZH=火热射手30 同 uid 平行）；③ OG `by` 码点截断对齐 20（Array.from 不拆代理对）+ 限可渲染字符集去 emoji 防豆腐块；④ 改名 UX：Enter 提交/Esc 取消/取消键/aria-label/默认名预填/防极速双击。vitest 138/138（含穷举 224 默认名组合 + 绕过用例 + 新 nickname.test）、改动文件 eslint 0 error、next build 净。**已知遗留（非本次）**：`MatchList.tsx` 有 12 个 react-hooks/purity·set-state-in-effect lint error（Date.now/setState-in-effect，插件升级后浮现，不阻断 build）。
   - **⏳ ④ 数据依赖待办（~6/18 再做）**：抽屉文案 A/B + AdSense 正文厚度复审——埋点 6/13 才开始流，攒 ~5 天数据再定。事件 `forecast_match_cta_click`/`prediction_submitted` 等已在 /api/track 落库，届时看转化漏斗与地理 RPM。

**P2（有余力）**
10. ~~好友私有联赛/邀请房间~~ **MVP 已上线（6/13，任务 5）**：/league 创建+输码加入、/league/[code] 榜单、昵称门禁、邀请文案复制。后续可加：擂台内单独排名口径、成员上限提示、擂主踢人。
11. ~~emoji 战绩分享格~~ **已上线（6/13，任务 3）**：/me「复制战绩」按钮，🟩🟥 格+连胜+击败 N%（样本≥50 才显示）。
12. Brier 准确率公开页（信任机制）
13. 全站英文内容补全：**比赛页 AI 正文已英文化（6/13，Gemini Flash 回填中）**；剩 about/玩法静态正文仍仅中文 + 路由级 /en + hreflang 待做。
14. Codex 外审概率引擎（CLI 非交互模式会卡死，要在交互终端跑）

## 五、可优化项（引擎/产品）

- 市场融合权重静态 0.75 → 按距开球时间动态（临场市场更准）
- 淘汰赛概率纯 Elo → 把 Polymarket 晋级盘/夺冠盘在后端做粗校准
- 计算器比分约定 1-0/1-1/0-1 → 允许真实比分输入（影响净胜球判据精度）
  - ✅ **已完赛比赛在计算器中显示并锁定**（6/13，commit c415f12，生产已验证）：ThirdCalculator 每组在剩余可点比赛上方渲染 `data.played` 为锁定行（实际胜平负高亮+真实比分 `🔒 4-1`、其余置灰、不可点）。修正了"已完赛只进算式不显示"的隐性割裂。剩余赛果仍走 1-0/1-1/0-1 约定（真实比分输入精度优化未做）。
- /forecast 首次计算 ~8s → 用 cron-job.org 每小时预热缓存
- 队名匹配失败目前静默降级（books=0）→ 加监控/日志
- og 动态图卡（@vercel/og）：每场概率卡、摆动卡自动生成（分发素材自动化）

### 比分概率功能（6/13 新增，Phase A 已上线生产）
> 背景：引擎早已算出每场 `topScores`（Dixon-Coles Top-5 比分概率）并持久化进 `prob_match_snapshots.top_scores`（生产 2254+ 行），但前端几乎没展示——/forecast 只露单个 top-1、/match 完全不展示。本次把它展示出来 + 写好实时进球重算的数学内核。

- ✅ **Phase A 已交付（commit 42627ce，已部署生产+线上验证）**：
  - `src/lib/prob/getMatchScoreline.ts`：读该场最新快照 `top_scores` → Top-5 + 「其他」桶（unstable_cache 600s）。
  - `src/components/ScoreProbs.tsx`：「最可能的比分 / Most likely results」SSR 模块（概率条，合规中性措辞，零博彩词）。
  - `/match/[id]`：**仅未开赛(open)** 分支接入比分模块（进行中暂不展示赛前分布以免误导，待实时版替换）。
  - `/forecast`：单个比分标签 → 展开 Top-3 最可能比分。
  - 线上验证：6/6 未开赛比赛页渲染模块、forecast Top-3 行、EN 文案、0 雷词。
- ✅ **实时进球重算数学内核已写好测好**：`src/lib/prob/poisson.ts` 的 `liveScoreline(lh0,la0,hNow,aNow,minutesPlayed)`——剩余时间内进球 ~ 泊松(λ×剩余/90)+DC 修正，叠加当前比分得最终比分分布；6 单测过（归一/领先升/时间衰减/终场锁定/边界）。**纯函数，等数据源接入即可用。**
- ✅ **Phase B 实时进球更新已上线（commit 754d06b，已部署生产+线上验证 /api/live 返回 200）**：
  - 架构（**比原计划更简，零 DDL/零 cron/零 Realtime**）：客户端轮询。`src/components/LiveScoreProbs.tsx`（进行中比赛页 ~30s 轮询）→ `/api/live?id`（`src/app/api/live/route.ts`）→ `src/lib/prob/liveFeed.ts` 调 API-Football `/fixtures?live=all` 过滤 `league=1`（unstable_cache 70s，配额不随观众增长）→ 命中则用 `lambdasFrom1x2(最新快照1X2)` 反推 λ → `liveScoreline()` 算实时最终比分分布。**未命中/无 key/配额耗尽全 fail-soft 回退赛前分布**。
  - match 页新增 `inPlay` 分支（已开赛未结算）渲染 `<LiveScoreProbs>`（取代原 locked）；open 分支仍 SSR 静态 `<ScoreProbs>`。
  - 环境：`APISPORTS_KEY` 已入 `.env.local` + Vercel 生产（key 文件 `docs/secret/api-football.com.txt`）。
  - **⚠️ 已知数据限制（待验证/可选升级）**：API-Football **免费档不含 season 2026**（查 league=1&season=2026 报 "Free plans do not have access to this season, try 2022-2024"）。`/fixtures?live=all` 实测能返回 >2024 的直播（如 2025 捷克低级别联赛），故 WC 直播**可能**仍出现在 live=all——但**必须用一场真实 WC 直播实测确认**（当前无 WC 直播，无法即时验证）。若免费档不返回 WC 直播：升级 API-Football **Pro ~$19/月**即解锁（代码零改动，自动生效）。配额：免费 100/天，70s 缓存下连续观看约够 2 小时/天 ≈ 单场重点赛；超额自动降级赛前。
  - **验证清单（下次有 WC 直播时做）**：① 开球后访问该场 /match 页，看是否出现「实时最终比分预测」+实时比分+分钟；② 进球后约 30s 内分布是否更新；③ 若一直显示「赛前比分预测（比赛进行中）」说明 live=all 未返回该场（免费档 season 限制），需升级 Pro。
- ⏳ **可选增强**：球队名映射（liveFeed `matchLive` 用 `normalizeTeamName` 对称匹配，含主客对调兜底）——若实测发现某些队名匹配失败（API-Football vs DB 英文名差异），在 `names.ts` 补别名。
- ⏳ **赛后「比分战报卡」（高分享回报，未做）**：每场结算后用赛前快照算「本场结果赛前是第 N 可能 X% / 你押中模型只给 X% 的冷门」，复用 `MatchSwingShare`+`/api/og`+`swingShare.ts` 管线（新增一个 mode）。比摆动卡触发频率高得多（每场都有，不限爆冷）。
- 市场对标结论（8-agent 调研+对抗验证）：完整「比分概率网格」公开互联网上几乎只存在于博彩 correct-score 市场；非博彩消费产品要么不做要么只给单个最可能比分（Forebet/Opta），FotMob/Sofascore 只有 1X2/动量。**干净去博彩化的 Top-5 比分分布是真空白**。实时胜率(1X2)是大路货但全靠付费实时源，且业界视其为「博彩入口」——对反博彩+AdSense 定位是合规负债，故只做「比分分布」不做实时胜率 ticker。

## 六、注意事项 / 已知坑（按踩坑成本排序）

1. **GitHub 账号 sun9bear 被封**：不能 push（所有代码只在本机！建议尽快网盘/移动硬盘备份仓库目录）、不能 OAuth 登 Supabase。git ≠ 生产事实源；**部署唯一路径 = `npx vercel deploy --prod --yes`**（CLI 已登录 sun9bear）。Supabase 账号纯 GitHub 绑定，密码重置邮件明确说只能走 GitHub 登录。
2. **本机网络连不通 Supabase Postgres**（5432/6543 全被掐；HTTPS REST 正常）。任何 DDL 要么走代理隧道要么等仪表盘。
3. **生产部署已获用户永久授权**（2026-06-13："每次部署你可以自行确认，我已明确授权"）——但权限分类器对高危表面（如接受任意连接串执行 DDL 的临时 admin 路由）仍会单独拦截且理由正当，**别再造那种路由**。
4. **teams.grp 格式是 "A 组"**（字母+空格+组），代码统一用 `/[A-L]/` 提取裸字母。
5. **DB 比分更新链路（6/13 已升级）**：每日 03:00 UTC settle cron 仍在；另有流量自驱动结算（src/lib/settlement/autoSettle.ts，首页/比赛页访问触发、10 分钟节流、幂等）。注意 football-data 免费档完赛标记自身滞后数小时（实测 6/11 21:00 UTC 完赛→6/12 08:25 才标 FINISHED）；热门场次想立刻结算可手动 `curl -H "Authorization: Bearer <CRON_SECRET>" https://www.wc2026.cool/api/cron/settle`。FOOTBALL_API_KEY 现已同时在 Vercel env 与 .env.local。
6. **PowerShell 5.1**：git commit 消息含双引号会被原生参数传递截断（用单引号 here-string 且避免双引号）；`vercel` 用 `npx vercel@latest`；`Start-Process npx` 要包 cmd /c。
7. **GateGuard hook**：每个文件首次 Write/Edit 必被拦，需在消息中列 4 项事实后 retry（每文件一次）。绕过：`ECC_GATEGUARD=off`。
8. **会话成本**：长会话切 `[1m]` 模型会按长上下文费率重读全部历史（实测一轮 $82→$483 等价）。大任务用新会话+本文档冷启动。
9. deepseek-chat 别名 **2026-07-24 退役**（决赛后 5 天）；若赛后维护，改固定模型名。
10. Odds API 免费余额 ~499 credits；缓存 1h 设计下最多 24/天，足够整届。
11. 雷词表把 multiplier/payout 等也加了 en 禁列——给 AI 写英文内容时注意会被 fail-closed 过滤，文案用 "points ×3.0 / reward" 表述。
12. vitest 中 simulate 测试用 400 runs（秒级）；生产 RUNS=10000。

## 七、密钥与资源位置（只写路径不写值）

- `.env.local`：NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / TURNSTILE_SECRET_KEY / THE_ODDS_API_KEY / SUPABASE_DB_URL（pooler 候选，本机连不通）/ SUPABASE_SECRET_KEY
- `docs/secret/supabase.txt`：DB 密码、直连串、service key（项目 ref hbcwszrvmohsyirqopfk，区域疑似 us-west-1）
- `docs/secret/vercel.env`：CRON_SECRET、FOOTBALL_API_KEY 等（生产环境变量的本地副本，**注意里面没有 DEEPSEEK_API_KEY 和 THE_ODDS_API_KEY**）
- `docs/secret/Deepseek API Key.txt`、`Vercel Token.txt`、`vercel recovery-codes.txt`、`Cloudflare Turnstile.txt`
- 代理：`D:\daili`（v2ray；直连-154.json / 住宅-140.json；scripts/ 下有现成启动器，AI_PROXY_README.md 是索引）
- Vercel 项目：sun9bears-projects/wc2026；cron：每日 03:00 UTC `/api/cron/settle`（Bearer CRON_SECRET）
- GSC：已验证 https://www.wc2026.cool/（HTML 标记法，meta 在 layout.tsx，勿删）
- Impact（**Fubo 已拒**）：账号 WC2026.Cool；Fubo 6/13 被拒且禁止再申请；W-8BEN/Wise 收款已配（可用于其他联盟）
- Turnstile：`verifyTurnstile()` 已写未接线（src/lib/security/turnstile.ts），客户端组件未做——接线前生产侧勿启用强制校验

## 八、账号清单、凭据与新会话冷启动

**账号一览（值不落文档，登录方式备查）**
| 服务 | 账号/状态 | 凭据所在 |
|---|---|---|
| Vercel | sun9bear，CLI 已登录（凭据在 Windows 用户目录，失效则 `npx vercel login` 设备码流程） | Token 备份：docs/secret/Vercel Token.txt；恢复码：docs/secret/vercel recovery-codes.txt |
| Supabase | GitHub OAuth 绑定（**当前锁定**，等 GitHub 解封） | 项目密钥/DB 密码：docs/secret/supabase.txt |
| GitHub | sun9bear（**封禁中**，申诉 support.github.com） | — |
| Impact（Fubo 已拒） | 账号名 WC2026.Cool；Fubo 6/13 被拒+禁再申，平台可申其他联盟 | 用户自设邮箱+密码 |
| The Odds API | 免费档 | key 在 .env.local |
| Google（AdSense/GSC） | 用户 Google 账号 | — |
| 关联邮箱 | Supabase 通知走 sun9bear@126.com | — |

**⚠️ 密钥轮换提醒**：2026-06-13/14 的开发会话中，DB 密码、service key、CRON_SECRET、Odds/DeepSeek key 的明文曾出现在 AI 会话记录里（本机）。实际风险低，但 GitHub 解封、拿回 Supabase 仪表盘后，建议把 **DB 密码和 service key 轮换一遍**（Dashboard → Settings → Database / API），并同步更新 docs/secret/、.env.local 和 Vercel 环境变量。

**仓库备份**：GitHub 推不上去期间，每天用 `git bundle create D:\wc2026-backup.bundle --all` 做全量备份并拷到网盘/U 盘（bundle 含全部分支与历史，恢复用 `git clone D:\wc2026-backup.bundle`）。

**新会话冷启动指令（建议开场白）**：
> 读 docs/HANDOFF.md 接手 wc2026 项目，今天做：<具体任务，如"P0 第 1-2 项：代理隧道跑 0002 迁移 + 把 THE_ODDS_API_KEY 补进 Vercel 环境并重新部署">。生产部署我已授权，可自行确认。
