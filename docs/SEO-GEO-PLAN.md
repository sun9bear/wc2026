# wc2026.cool SEO + GEO 优化方案 (v2 · 经 CodeX 外审收敛)

> 产出：2026-06-14 ｜ 方法：12-agent 并行调研（GEO / 技术 SEO / 实时新鲜度 / 双语合规关键词 / 竞品态势 / 自动化架构）+ 逐维对抗性事实核查 → **CodeX (gpt-5.5, xhigh) 外部对抗评审 round 1** 已收敛（见 §十一）。
> 性质：方案文档。配合 `docs/HANDOFF.md`、`docs/GROWTH-PLAN.md`、合规词表 `src/lib/compliance/bannedTerms.ts`。
> 还原点：`git tag seo-baseline-20260614` + `D:\wc2026-backup-pre-seo-20260614.bundle`。

---

## 一、一句话诊断

**站点的内容资产（实时第三名计算器、每小时刷新的万次蒙特卡洛概率、48 队页、逐场页）正是 2026 年 SEO + GEO 最吃香的东西——新鲜、实时、结构化、数据密集；但这些资产对机器（Google 爬虫 + AI 答案引擎）几乎"隐身"：零结构化数据、新鲜度信号没暴露、中文语料对爬虫不可见，且 canonical 可能正把内页指向首页。** 不缺弹药，缺的是把弹药做成机器能读、能引用、能快速收录的形态。

**核心判断（经调研对抗核查 + CodeX 外审修正）**：
- **最高 ROI、最低风险的近期赢点不是 schema，而是"修好 canonical + 诚实的新鲜度信号 + 前置可提取答案 + 把已收录页刷新"。** 一手证据（普林斯顿 GEO 论文：答案前置 +40%、统计数字 +41%；Bing 官方：lastmod 是其唯一采用的重排信号）远强于厂商博客的 schema 乘数（Ahrefs 1885 页 DiD：加 schema 对 AI 引用**无提升**，空字段 schema 反而 -18 分）。
- **canonical 可能正在伤收录（CodeX 发现的 BLOCKER）**：root layout 设 `alternates.canonical:"./"`，`/forecast`、`/match/[id]` 等未覆盖 → 相对 `./` 在内页会解析到错误目标（`/forecast` 的 `./` = 站根，`/match/123` 的 `./` = `/match/`）。这会让内页把自己 canonical 到首页/不存在页，**可能正阻止内页被当作独立页收录**。必须先修。
- **日历是硬约束**：今天 06-14，黄金窗口 06-22~27 仅约 8 天；新域收录普遍 3–6 周，AI 引用冷启动 60–120 天。**对本小组赛窗口能赶上的是"快速收录路径 + 刷新已收录页"；schema/hreflang 真实回报在淘汰赛（7 月）、长尾与下届。** 不自欺。
- **Phase 1 一律 EN-first（CodeX 修正预期）**：当前 cookie/Accept-Language 同 URL，Googlebot 无 zh 头 → 只见英文。所以 Phase 1 的前置答案句、标题等先服务英文；中文红利要等 i18n（P2）。
- **双语可爬性是唯一 schema 补不了的结构性缺陷**，但工程最大、部署风险最高 → 谨慎并行轨。

---

## 二、站点优势与竞品态势（白空间）

### 2.1 竞品三层（已实抓页面；竞品 schema 用 raw curl 复核，WebFetch 的 markdown 会丢 JSON-LD）

| 层 | 代表 | 强 | 弱（我们的机会） |
|---|---|---|---|
| 权威预测发布者 | Opta/TheAnalyst、Nate Silver/Silver Bulletin、ESPN、Action Network、Sofascore、Forebet、FotMob | 域权威 + AI 高引用；Opta 主动做 GEO（"correct as of 1 June 2026" + "设为优先来源"按钮） | 纯**文章**、无交互"我的队还能出线吗"工具；**EN 单语**；**538 已死**（2025-03 关停）→ Nate Silver 接班但**付费墙**——"免费公开实时概率"赛道空着 |
| 直接预测工具（≈/forecast） | footballforecast.io、cup26matches、KickOracle、FootySim、**football-md（同样 10k 蒙特卡洛+Elo）** | 同类方法、部分可嵌入 | 多为**每日/每晚**刷新（FootySim 自承可能滞后 48h）；EN 单语 |
| 直接计算器（≈/calculator，**第三名计算器不独家**） | **worldcupcalculator.com (GoWoC)**、teamzlab、soccer2026.app、gamblingcalc、**worldcuppredictor.org** | GoWoC 自动吸收赛果+what-if+VideoObject schema；worldcuppredictor.org 有**完整 sports 实体 schema 图** | 多**手动录入**、**EN 单语**；gamblingcalc 满屏博彩词（我们干净文案可反超） |

### 2.2 决定性白空间（无人同时占据三者）
1. **实时自动刷新**的第三名计算器（竞品多需手动录入）
2. **每小时**刷新、**免费无墙**的万次蒙特卡洛概率（538 死后这条赛道空着）
3. **干净去博彩化的双语 zh/en**（中文 WC2026 预测内容只剩赌博站/大陆平台；面向海外华人 AdSense 高价值区=真空）
> ⚠️ #3 目前对爬虫不可见（同 URL cookie 切语言），直到 i18n（P2）修好才能兑现。

### 2.3 当前机器可见性缺口（raw curl 复核 + CodeX 确认）
- **零 JSON-LD**、**零 hreflang**、`/llms.txt` 404。
- `sitemap.ts` 全站 `changeFrequency:'hourly'` 但**零 `lastModified`**（Bing 唯一采用的信号被浪费）。
- match 页**无语义 `<h1>`**，`generateMetadata` 非爆冷场次返回 `{}`（无默认标题）。
- **canonical 隐患**：root `"./"` 相对值在内页解析错误（见 §一）。
- 既有文案出现"市场共识 / market consensus"——AdSense 审核期语义近博彩市场，需改写。
- AdSense 脚本 `beforeInteractive`（CWV 拖累，审核期**不轻动**）。

---

## 三、真相 vs 炒作（调研对抗核查 + CodeX 复核）

| 流行说法 | 核查结论 | 我们怎么做 |
|---|---|---|
| "schema 是 AI 引用第一大赢点，2.3x/2-4x/28%" | **证伪**：Ahrefs 1885 页 DiD 加 schema **无提升**；空字段 schema **-18 分** | schema 当实体澄清保险，**只填真实字段**；头号赢点让位给 canonical/新鲜度/前置答案/内容/收录 |
| "FAQPage 富结果是高杠杆" | **过时**：FAQ 富结果 2026-05-07 全量下线。仍被 AI 解析 | 做可见 Q&A 文字，FAQPage 标记可选 |
| "llms.txt 是 AI 时代 robots.txt" | **基本炒作**：Google 明确不支持；500M+ 爬虫仅 408 次命中 | 静态 URL-only 文件当保险，不当杠杆 |
| "AI Overviews 85% 引用 top-10" | **过时/口径差异大**（17–84%），~46.5% 被引页排 50 名外 | 排名重要但非充分；新鲜+前置答案+原创数据可在未排名时被引 |
| "SportsEvent 拿 Event 富结果轮播" | **半对**：Google Event 富结果面向真实可参加活动；预测页拿不到轮播，伪造票务字段违规 | 发 SportsEvent 只为实体/GEO 理解，不编造 offers/location |
| "IndexNow 加速 Google" | **证伪**：Google 不参与；Bing/Yandex/Naver 用 | 仅当 Bing/Yandex 加速器（间接利好 ChatGPT/Copilot） |
| "lastmod 设 now 就新鲜" | **有害**：lastmod 二元、全站信任门控，乱标 now 全站失信 | **只从持久真实的 `settled_at` 派生**（见 P0-2） |
| "Bing 反对 batch IndexNow" | **言过其实（CodeX 纠正）**：IndexNow 官方支持单次最多 1 万 URL 批量 | 本站量小用**去抖小批**即可，不必逐条，也不必声称 batch 非法 |
| "上 AI agent 自动发内容做 SEO" | **高危**：Google scaled-content-abuse 是**全站**人工处罚；AdSense 审核期一个泄漏雷词即致命 | **绝不自动发布**；AI 只做只读侦察 + 人工闸门（§六） |

**经一手/同行评议背书的真杠杆**：① 修 canonical（确保内页能作为独立页收录）② 诚实新鲜度（Bing lastmod；Perplexity 引用 82% <30 天）③ 前置带统计数字的答案（普林斯顿 +40%/+41%/+42.6%）④ 原创数据/方法透明 ⑤ 收录速度（GSC 手动 + 真 lastmod + 内链）。

---

## 四、优先级行动栈（具体到文件；已按 CodeX 外审重构）

> **合规以代码为准**：`import { findBannedTerms } from '@/lib/compliance/bannedTerms'`。实际禁词 zh：投注/下注/押注/赌/博彩/赔率/庄家/盘口/彩票/竞彩/体彩/推荐/必赢/稳赢/稳赚；en：bet/betting/wager/odds/bookmaker/gamble/gambling/casino/stake/parlay/accumulator/acca/handicap/tipster/payout/multiplier/sportsbook。**不在文档/脚本里抄正则**。

### P0 / Phase 1A — 先发（最低风险、最快收录、不碰 schema/新页/i18n/AdSense 脚本）

**P0-1 修 canonical（高·S·BLOCKER，可能正伤收录）**
- 去掉 root layout 的相对 `canonical:"./"`；改为**每个可索引路由显式绝对自指 canonical**（统一 www）：`/`、`/forecast`、`/match/[id]`、`/team/[slug]`、`/combo`、`/leaderboard`、`/watch`、`/about` 等（group 页已有，照抄模式）。

**P0-2 诚实 sitemap `lastModified`（高·M·低风险）— 经 CodeX 重构** `src/app/sitemap.ts` + 新建 `src/lib/seo/freshness.ts`
- ⚠️ CodeX 纠错：`matches`/`teams` **无 `updated_at` 列**（仅未迁移的 0002 有）；`getForecast().updatedAt`=`new Date()`（伪新鲜）；sitemap **无状态**无处"保留上次值"。三者都不能用。
- 正解：lastmod 一律从**持久真实的 `matches.settled_at`** 派生（赛果落库=真实内容变化），零 DDL、不调 `getForecast()`（避免 sitemap 触发抓取+快照副作用）：
  - `/match/[id]`：`settled_at`（已结算）；未结算**省略 lastmod**（不伪造）。
  - `/team/[slug]`：该队比赛 `max(settled_at)`。
  - `/calculator/group/[letter]`、`/forecast`、`/`：相应范围 `max(settled_at)`（积分榜只在该范围某场结算时变）。
  - 静态法务页：真实旧固定日期。
- sitemap 仅做廉价 `matches.select(id,kickoff_at,settled_at,home_team_id,away_team_id)` + `teams.select(id,name,grp)`（本就在查），内存算 max，保留 try/catch 降级。
- `src/lib/seo/freshness.ts` 暴露 `lastSettledAt(scope)`（unstable_cache），供 sitemap、页面可见"更新于"、JSON-LD `dateModified` 共用 → 四信号一致。

**P0-3 match 页语义 `<h1>` + 每场默认标题（中·S）** `src/app/match/[id]/page.tsx`
- 加语义 `<h1>`；`generateMetadata` 对所有场次给真实默认标题（现非爆冷返回 `{}`）+ 显式自指 canonical。

**P0-4 前置可提取的"带统计数字的答案"（高·S，最强同行评议证据，EN-first）**
- `/forecast`、`/calculator/group/[letter]`、`/team/[slug]` 各在 H1 后加一句 40–60 词直答 + 可见 `2026` + 已算出的数字。例（en）：`As of 14 Jun 2026, per wc2026.cool's 10,000-run simulation, the USA has a 62% chance to advance from Group D at the 2026 World Cup.`（zh 同义，等 i18n 才对爬虫生效）。复用合规词，零新数据。

**P0-5 可见"更新于"（高·S）**
- `/calculator/group`、`/team` 加可见 `Updated <lastSettledAt>`（/forecast 已有，但改为用 `lastSettledAt` 而非 `updatedAt` 以避免伪新鲜）。

**P0-6 文案去"市场"化（中·S·AdSense 合规）**
- "公开预测市场共识 / market consensus / 市场共识" → "公开预测数据 / public forecasting data / public prediction consensus"（forecast `COPY.method`、group `COPY.note` 等）。

**P0-7 robots + 静态 llms.txt（低·S）— 经 CodeX 简化** `src/app/robots.ts`
- CodeX 纠错：给每个 AI 爬虫单列组会**丢掉 `*` 组的 `/api`、`/me` disallow**（bot 只读最具体匹配组）。且"显式放行"非杠杆。
- 正解：**保留单一 `*` 组**（已放行所有 AI 爬虫 + 屏蔽 /api,/me），加注释说明 AI 爬虫经 `*` 有意放行。
- `public/llms.txt`：URL-only 极简索引，过红线扫描，**不阻塞上面更高优先级项**。

**P0-8 合规扫描器（高·S·部署阻断闸）** 新建 `scripts/seo-compliance-scan.ts`
- `import { findBannedTerms }`，扫描本批新增的所有面向用户字符串（COPY、schema 字段、llms.txt、rules 文案）。命中即 exit 1。进部署前检查。

**P0-9 GSC 手动请求收录（高·S·用户动作）**
- 12 个 group 页 + 重点 matchday-3 场次页用 GSC URL Inspection「请求编入索引」（配额约十几条/天）。**日历是硬约束。**

### Phase 1B — 1A 线上验证后再发（schema + 新页）

**P0-10 JSON-LD 结构化数据（高·M·有实现闸门）** 新建 `src/lib/seo/jsonLd.ts`
- 转义用 **`JSON.stringify(obj).replace(/</g, '\\u003c')`**（CodeX 纠错：文档原写的 `<`→`<` 是 no-op）；**只白名单显式字段**，绝不整体序列化 i18n 字典（含 `stake`/`payout` 键）。
- 在各路由**顶层 Server Component 同步返回、任何 Suspense/client 边界之前**渲染 `<script type="application/ld+json">`（爬虫不执行 JS，且 streaming 可能丢边界后的节点）。
  - `layout.tsx`/首页：`WebSite` + `Organization`（方法学作者实体）。
  - `/match/[id]`：`SportsEvent`（name/startDate=kickoff/eventStatus/homeTeam/awayTeam/sport=Soccer，**不加 offers/price/location 虚构字段**）+ `BreadcrumbList`。
  - `/team/[slug]`：`SportsTeam` + `BreadcrumbList`。
  - `/forecast`、`/calculator/group/[letter]`：先用**合法的 `ItemList`**（itemListElement 排名）；如上 `Dataset` 则须填齐合法属性（`name`/`creator`/`variableMeasured`/`measurementTechnique`/`dateModified`），不要塞任意 `advance%` 字段（CodeX：under-specified schema 无效甚至有罚）。
- **验证闸**：① `curl` 原始 HTML 确认 ld+json 在**首个 flush 块**（非 JS 执行的 Rich Results Test）；② Schema 校验器（validator.schema.org）；③ P0-8 红线扫描器。

**P0-11 新建 `/rules` 常青页（高·M，最佳内容机会）** `src/app/rules/page.tsx`（双语 COPY，入 sitemap）
- 「2026 世界杯赛制与出线规则详解：48 队、12 组、8 个最佳第三名、32 强」。TL;DR + 钩子句（"输两场、平一场、小组第三仍可出线甚至夺冠"）。
- **两套不同判据（CodeX 纠错：组内 ≠ 第三名横排）**，须与 `src/lib/prob/standings.ts`（已逐字核对规程）一致：
  - **组内排名**（FIFA Art.13）：积分 → **同分队相互战绩（积分/净胜/进球，递归）** → 全部小组赛净胜球 → 进球 → 公平竞赛分 → FIFA 排名 → 抽签。
  - **最佳第三名横排（12 取 8）**：积分 → 净胜球 → 进球 → 公平竞赛分 → FIFA 排名 → 抽签（**无相互战绩**，跨组不可比）。
  - 公平竞赛分我们无红黄牌数据 → 标注以实力评分近似。
- **C(12,8)=495 个最佳第三名→32 强映射**（FIFA Annex C，已有 `thirdAllocation.json`）。**链到 LIVE 计算器/forecast**（静态解释器做不到）。

**P0-12 内链中枢（中·S）** /forecast↔group↔team↔match 描述性锚文本互链，把稀缺权重导给深层长尾页。

### P1 — 紧随其后（赛事中后段/长尾受益）
- **P1-1 最佳第三名独立可索引页** `/forecast/best-thirds`（独家资产 + 末轮硬需求 + 无主导竞品）。
- **P1-2 IndexNow** `src/lib/seo/indexnow.ts`，key 文件 `public/<uuid>.txt`；从 `/api/cron/settle` 对 newlySettled 涉及 URL **去抖小批**提交、`after()` fire-and-forget。仅 Bing/Yandex；**绝不接 Google Indexing API**（页型不合格，误用降权/标 spam）。
- **P1-3 group/team 意图重定向** 标题显式含 "Group X · who advances" / "Can [team] still advance?"；砍中国队定位（已出局）。
- **P1-4 自有可嵌入 widget**（带回链）拿外链。

### P2 — 谨慎并行轨（高影响、L、部署风险高；payoff=淘汰赛+长尾+下届）
- **P2-1 双语可爬性：crawlable per-locale URL + hreflang**。**必须干净做或不做**（reciprocal `zh-Hans`/`en`/`x-default` + 各 locale 独立 canonical）；活跃 core-update 季半成品有害。来不及干净落地→推迟。zh 树上线前过红线扫描作部署阻断闸。
- **P2-2 AdSense 脚本 beforeInteractive→afterInteractive**：**默认推迟到 AdSense 通过后**，或 preview 验证"广告仍投放 + 审核标记仍被检测"。

---

## 五、实时 / 持续优化打法（real-time playbook）
**机制**：Google 新鲜度层（业界称 QDF，行为可靠非官方算法）在需求骤升+新内容涌现时优先新/更新页；末轮"X 队还能出线 / X 组情景"正是这形状。护城河=真实时数据，把新鲜度做成机器可读。
**节奏（倒排 06-22）**：
- **~06-17 前锁定**：12 group 页 + matchday-3 场次页渲染**该页专属出线算式** + 带日期 AI 情景短评 → 立即 GSC 请求收录 + (1B 后)IndexNow。新页 06-22 才首爬就错过窗口。
- **窗口内**：热点起 → **刷新已收录的** /team 或 /calculator/group 页（即时 QDF），不新建薄页；刷新须有实质内容变化（≥~15%），不是只改时间戳。
- **静态缓存** /forecast 与 group 页（别让 Googlebot 每爬跑一遍万次蒙卡），保持低 TTFB。
**热点探测（双语）**：官方 Trends API（alpha）只有 5 年历史、无实时 → 实时靠 Trends "Trending Now" + X/Reddit r/worldcup。**砍 Google News/Discover/Top Stories**（新域 5 周内是陷阱）。
**程序化纪律**：保持 12 group + 48 team + 逐场 URL 集，**不开 `/scenario/[permutation]` URL 家族**（排列做成页内交互，不是数千薄页——core-update 季 doorway 风险）。

---

## 六、自动化架构决策（你的核心问题：要不要常驻脚本 / AI agent？）

**结论：HYBRID。不要常驻 daemon，不要自动发布的 AI agent。** 四层：

| 层 | 做什么 | 触发 | 为何 |
|---|---|---|---|
| **① 运行期代码 (RSC)** | 结构化数据、新鲜 meta/OG、前置答案——算一次写进代码 | 请求时 RSC | 零运维；**最高 ROI 全在这层** |
| **② 事件驱动 cron（现有基座）** | IndexNow ping、按需 `revalidateTag` | 现有 `/api/cron/settle` 末尾 `after()` | 复用已验证基座；零机器依赖 |
| **③ 只读 AI 侦察（可选，人工闸门）** | 拉 GSC Search Analytics + URL Inspection（≤2000/天）+ 趋势/竞品 → 出**人工审核摘要 / 草稿 PR** | Claude Code `/schedule` 或 cron headless | 拿趋势/收录监控上行，**人工闸门吸收全部合规+scaled-content 风险**；绝不写可索引文本、绝不部署。与"我做内容引擎、本人发布"原则一致 |
| **④（明确不做）** | 常驻 Node daemon；自动改写 meta cron；自动发布 agent | — | 机器网络受限→daemon 不可靠单点；自动发布触发 Google **全站**人工处罚 + AdSense 风险 |

**为何不是"一个常驻 agent 全包"**：真正该自动化的（schema/新鲜 meta）是 RSC 一次性代码；该 ping 的（IndexNow）是事件驱动一行 fetch；agent 的唯一安全价值是只读侦察 + 人类拍板。与 `[[wc2026-social-account-operation]]` 拒绝无人值守自动化同构。

---

## 七、合规闸门（所有新产物过此关）
1. **复用代码雷词表**：`findBannedTerms`（正文词边界版）/ `findBannedTermsStrict`（身份字段子串版）。**不抄正则到文档/脚本**。
2. schema/JSON-LD 是高曝光机器可读文本：每个字符串过 `findBannedTerms`；不暴露后端数据源（Polymarket/博彩），对外只 "public forecasting data"。
3. 胜平负三向概率绝不与"odds/赔率"或金钱框架相邻渲染进 schema/FAQ。
4. **部署阻断闸**：① `scripts/seo-compliance-scan.ts`（P0-8，import 真实雷词表）② Schema 校验器 ③ `curl` 确认 ld+json 在初始 HTML。
5. **"市场共识/market consensus" 改写**（AdSense 审核期语义近博彩市场）→ "公开预测数据/public forecasting data"。
6. AdSense 审核期：分屏隔离不变；不轻改 AdSense 脚本策略。

---

## 八、风险登记册 + 排期

| 风险 | 缓解 |
|---|---|
| **canonical 内页指首页**（可能正伤收录） | Phase 1A 最先修：显式绝对自指 canonical |
| **日历**：06-22 仅 8 天，新域收录 3–6 周 | 先发快收录低风险项 + GSC 手动；hreflang 当多周投资，payoff=淘汰赛/长尾/下届 |
| **lastmod 信任二元全站** | 只从 `settled_at` 派生（真实变化）；不调 getForecast()/不用 now |
| **Next streaming 丢 ld+json** | 顶层 Server Component、边界之前渲染；`curl` 原始 HTML 验证 |
| **空字段 schema -18 分** | 只填真实字段；优先合法 ItemList |
| **i18n 大改在 core-update 季** | 干净做或不做；可推迟 |
| **AdSense 脚本/文案** | 脚本默认推迟；"市场共识"改写；红线扫描器闸 |
| **OG 卡 streaming**（fb/Twitter 不执行 JS） | `curl` 确认 OG/Twitter 标签在初始 HTML |

**排期**：06-14~16 发 **Phase 1A**（canonical/默认 meta/h1/前置答案/诚实 lastmod/文案改写/robots/扫描器）→ 线上验证 → GSC 手动收录。06-16~18 发 **Phase 1B**（JSON-LD + /rules + 内链）→ 验证。06-18~21 发 P1。i18n（P2）干净就绪再发，否则推迟到窗口后。

---

## 九、第一轮实施范围（Phase 1A，本次先改的代码）
**只做最低风险、最快收录、不碰 schema/新页/i18n/AdSense 脚本**：
1. `src/app/layout.tsx`：去相对 canonical，homepage 显式绝对自指；（1B 再加 WebSite/Organization JSON-LD）。
2. `src/app/sitemap.ts` + 新建 `src/lib/seo/freshness.ts`：`settled_at` 派生 lastmod（match=settled_at，team/group/forecast/home=max settled_at），不调 getForecast()。
3. `src/app/match/[id]/page.tsx`：语义 h1、每场默认标题、显式 canonical。
4. `src/app/forecast/page.tsx`：前置答案句、"更新于"改用 lastSettledAt、显式 canonical、"市场共识"改写。
5. `src/app/team/[slug]/page.tsx`：前置答案句、可见"更新于"、显式 canonical。
6. `src/app/calculator/group/[letter]/page.tsx`：前置答案句、可见"更新于"、"市场共识"改写（canonical 已有）。
7. `src/app/robots.ts`：保留单 `*` 组 + 注释；`public/llms.txt`（新，URL-only）。
8. `scripts/seo-compliance-scan.ts`（新）：import 真实雷词表扫新增文案。

**验证**：`npm run build` 净 + `vitest run` 全过 + `eslint` 0 error + `scripts/seo-compliance-scan.ts` 0 命中 + `curl` 原始 HTML 抽查 canonical/标题/前置答案。

**Phase 1B**：JSON-LD（P0-10）、/rules（P0-11）、内链（P0-12）。**Phase 2**：IndexNow/best-thirds/意图重定向。**Phase 3**：i18n+hreflang。**Phase 4**：只读 AI 侦察；AdSense 脚本。

---

## 十、上线 checklist
- [ ] `next build` 净；`vitest run` 全过；`eslint` 0 error；`seo-compliance-scan` 0 命中
- [ ] `curl` 原始 HTML：内页 canonical=绝对自指（非首页）；match 有 `<h1>`+默认标题；前置答案句在 H1 后
- [ ]（1B）`curl` 确认 ld+json 在初始块；Schema 校验器无错
- [ ] `curl` 确认 OG/Twitter 标签在初始 HTML
- [ ] 部署 `npx vercel deploy --prod --yes` → 线上验证 5+ 页 + sitemap lastmod + robots.txt
- [ ] GSC 手动请求收录高价值页
- [ ] 刷新 `D:\wc2026-backup.bundle`

---

## 十一、CodeX 外审记录

**Round 1**（gpt-5.5 xhigh，已读 plan + 10 个源文件 + 查 Next.js/Google/Bing/IndexNow/FIFA 文档）。裁决：**"Phase 1 as written 不安全"**。已全部采纳：
- **BLOCKER**：① matches/teams 无 `updated_at` 列 → 改用 `settled_at`。② `getForecast().updatedAt`=now 伪新鲜 → 不用。③ sitemap 无状态无处"保留" → 改 `max(settled_at)` 派生，零 DDL。④ /rules 判据错（组内 H2H-first ≠ 第三名横排）→ 分两套、对齐 standings.ts。⑤ 文档雷词正则不全且有杜撰词 → 改 import 真实 `bannedTerms.ts` + 扫描器。⑥ root canonical `"./"` 内页解析错 → 显式绝对自指。
- **MAJOR（采纳）**：sitemap 不调 getForecast()；hreflang 等 /en URL 再做；Phase 1 EN-first 预期；robots 保留单 `*` 组（避免丢 disallow）；JSON-LD `<` 转义 + 白名单字段；ld+json 顶层边界前渲染 + curl 验证；"市场共识"改写；Dataset 须填合法属性或先用 ItemList；Phase 1 拆 1A/1B；IndexNow batch 措辞纠正。
- **MINOR（采纳）**：llms.txt 降级为可选 URL-only；`changeFrequency`/`priority` 非 Google 杠杆，不计入有效工作。

**Round 2**（plan v2 收敛复核）：6 个 BLOCKER 全部 RESOLVED；新设计无新 BLOCKER，仅 2 小 MAJOR（lastSettledAt 须带 revalidate；settled_at 勿标 Updated）——已采纳。

**Round 3**（Phase 1A 实施后 diff 审）：0 BLOCKER、4 MAJOR、1 MINOR，全部修复：①freshness byGroup 仅组赛更新（淘汰赛不误标）②补全 7 条 sitemap 内页 canonical（combo/leaderboard/watch/calculator/about/privacy/disclaimer）③match openGraph 补全 og.png/type/url（修非爆冷场丢分享图回归）④扫描器 fail-closed + 删 /rules + 抽样真实 team/match⑤llms.txt 改指 sitemap。

**Round 4**（修复后复核）：M1/M2/M3/MINOR RESOLVED；M4 残留（sampleDynamic 仍 fail-open）→ 改为抓取失败/无 team|match URL 即抛错、main 记失败。

**Round 5**（聚焦复核）：扫描器 fail-closed RESOLVED。**裁决：安全部署。**

---

## 十二、部署与线上验证（2026-06-14）

- 提交 `6223fbc`（feat/legal-pages，18 文件）；备份 `D:\wc2026-backup.bundle` 已刷新；`git tag seo-baseline-20260614` 为还原点。
- `npx vercel deploy --prod --yes` → 生产 READY（dpl_4FmJMtoMSzzwToAS8po3LKjsHv3V），别名 www.wc2026.cool。
- 线上验证（en/爬虫视角）：
  - **canonical 修复确认**：/forecast、/match/[id]（含真实标题 "Switzerland vs Canada — World Cup 2026 prediction & likely scores"，原 `{}` 已修）、/team/mexico、/combo 均自指——**内页不再 canonical 到首页**。
  - 前置答案句渲染（forecast 含 "10,000-run Monte Carlo simulation"）。
  - sitemap.xml 含真实 `<lastmod>`（取自 settled_at，如 2026-06-13T21:15:16Z，非 now）。
  - robots.txt 正常；llms.txt 200；合规扫描器全页 en+zh 0 雷词。
- **待用户动作**：GSC URL Inspection 手动请求收录 12 个 group 页 + 重点 matchday-3 场次页（配额约十几条/天）。
- **后续轮次**：Phase 1B（JSON-LD schema + /rules 常青页 + 内链）；Phase 2（IndexNow / best-thirds 页 / 意图重定向）；Phase 3（i18n + hreflang，谨慎并行轨）；Phase 4（只读 AI 侦察 /schedule；AdSense 通过后改脚本策略）。

**Phase 2（P1）已上线（2026-06-14，`b015961`，dpl_AyenaGrtVbvg7ginnY6CfKkQrXRi，已线上验证）**：
- **P1-1 `/forecast/best-thirds` 独立可索引页**：12 个小组第三名横排（前 8 晋级 + 出线分数线）+ FIFA Annex C 的 C(12,8)=495 行「第三名→小组第一」R32 对阵映射（`bracket.ts`）；复用 `getForecast()` 共享缓存零额外蒙卡成本；ItemList JSON-LD 只填真字段、dateModified 取真实 settled_at；EN-first 前置答案（2026+算出分数线）；可见「更新于」用 `getSettledIndex().all`；入 sitemap（真实 lastmod）+ 合规扫描 + 与 /forecast 互链。
- **P1-2 IndexNow**（`src/lib/seo/indexnow.ts`）：结算后 `after()` fire-and-forget ping **仅 Bing/Yandex（绝不接 Google）**，只挂 `/api/cron/settle` 守 `newlySettled>0` 自去抖；全程 fail-soft（Promise.allSettled + 各端 5s AbortController）；公钥硬编码 + `public/6bdb6379e0b34e999e3d0dd720ba612f.txt` 字节匹配，无需 Vercel env。
- **P1-3 标题意图重写**：组/队页标题前置 "who advances" / "Can [team] still advance?"（中英各 2），canonical/OG/desc 不动。
- **闸门**：tsc 净、144 vitest、eslint 0、next build 净；5 维多 agent 对抗评审 safe-to-deploy（修 1 处脚注判据归属对齐 standings.ts）；线上验证 best-thirds/key 文件/sitemap/组页标题全过；合规扫描器 26/26 0 雷词。
- **剩余**：P1-4 可嵌入 widget；P2 i18n+hreflang；P4 只读 AI 侦察。**待用户**：GSC 手动收录 `/forecast/best-thirds` + 重点 group/matchday-3 页（赶 6/22-27 窗口）。

---

## 附录：关键一手来源
- Google：locale-adaptive pages（Googlebot 无 Accept-Language）、managing-multi-regional-sites、structured-data Event/Dataset/sd-policies、Indexing API（仅 JobPosting/BroadcastEvent）、Trends API（5 年无实时）、sitemaps-lastmod-ping 弃用
- Bing：IndexNow（Google 不参与；支持至多 1 万 URL 批量）、July-2025 sitemap lastmod 唯一采用信号
- Next.js 16：generateMetadata/alternates、json-ld 指南（JSON.stringify 不防 XSS，须 `<`）、streaming 与边界
- 同行评议：Princeton/GeorgiaTech/IIT-Delhi GEO 论文（答案前置+40%/统计+41%/引用+42.6%）
- Ahrefs：schema DiD 1885 页无提升 + 空 schema -18 分
- 事实：538 关停（2025-03）；FAQ 富结果下线（2026-05-07）；Google AI Mode 已原生显示世界杯实时比分
- FIFA：World Cup 2026 Art.13 组内/第三名判据（与 `src/lib/prob/standings.ts` 一致）
