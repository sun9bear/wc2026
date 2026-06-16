# 球员人气榜 / Fan Favorite — 设计方案

> 状态：草案 v2（2026-06-16）｜定位：留存层 + 图卡弹药，**非核心护城河**
> 真理源：本文件。实现前请对照 `docs/GROWTH-PLAN.md` 与 5 周运营策略红线。
> v2 变更：排名模型由"纯投票"升级为**透明人气指数（投票+表现+热度加权）**；AI 走**安全版**（只产文字短评/标签，不打颜值分、不进排名分）。

---

## 0. TL;DR（先读这段）

- **做什么**：一个全局多语页面 `/popularity`，用一个**透明人气指数**给球员排名，产出可分享的 **Top-N 图卡**（X/Reddit 弹药）。框架是"人气/Fan Favorite"，**不是"最帅/最美"**（已否决，见 §9）。
- **人气指数 = 球迷投票 55% + 表现分 30% + 网络热度 15%**（分项可拆开展示=真透明）。AI 只产**文字短评/X-factor 标签**做旁注，**不进分**。
- **能复用的现成件**：6 语路由 + hreflang + sitemap、`/api/og` 图卡工厂(`thirds` 模式=排行榜模板)、Supabase 写法(service role + upsert + 显式 GRANT)、防刷三件套(Turnstile + rateLimit + same-origin)、匿名 auth 身份、`HeaderShare/Toast/copyText/track` 分享链路、`bannedTerms` 合规扫描、`getScorers`(表现分原料)、`ai_content` 管道(短评)。
- **唯一真硬骨头**：库里**没有球员名单**——只有 football-data 的 Top 20 射手(无 ID、无照片、无 squad 表)。候选名单走**手工策展 ~40 球星 JSON 种子 + 射手榜自动补充**（见 §3）。
- **照片**：MVP **不上球员头像**(版权干净；安全版 AI 也不需要照片)，用 国旗 + 队徽 + 姓名 + 球衣号；Phase 2 再上 Wikimedia Commons CC-BY 授权图带署名。
- **工时**：B 透明指数版 ≈ **8–10 天**（纯投票核心 4–5 天 + 表现/热度/指数/短评分层叠加）。建议**分层增量上线**（见 §11）。
- **排期**：**别抢 6/22–27 第三名计算器的黄金分发窗**。人气榜放到首批留存用户之后，跟"好友联赛/emoji 战绩分享"同一批做。
- **导航**：先**不占底部 tab**（底部 5 格是为小组赛传播资产保留的，见 `BottomNav.tsx:34`），用 首页卡片 + `/forecast`·`/leaderboard` 入口引流。

---

## 1. 目标与定位

| 维度 | 说明 |
|---|---|
| 受众 | 全球足球迷（男女通吃；"人气"框架天然比"颜值"更广、更安全） |
| 产品目标 | ① 留存层互动；② 产出高传播性图卡（Top-N 人气榜）做 X/Reddit 弹药 |
| 不是什么 | 不是 SEO 获客主力（人气榜搜索量≈0）；不是核心差异化（护城河是第三名计算器/概率/串关） |
| 变现关系 | 弱直接变现；价值在拉新分享 + 把流量沉到站内（预测/积分玩法） |
| 红线 | 不用 odds/bet 词族；积分不可兑换有价物；不物化、不按外貌排名、不让 AI 给真人脸打分；带"娱乐性、社区投票"免责声明 |

**机会成本提醒**：这是锦上添花。本周到 6/27 的优先级仍是计算器 + 分发窗口。人气榜在那之后做。

---

## 2. 范围（MVP vs 后续）

**MVP（B 透明指数版，本设计的实现目标）**
- 策展候选名单（~40 球星种子 + 射手补充，§3）
- **透明人气指数**：投票(实时) + 表现分(赛后) + 热度分(每12h)，加权排名，分项可展示（§5 评分模型）
- 一人可投多名喜欢的球员（每球员一票，可改投/撤）
- AI 文字短评/标签（安全版，不进分）
- `/popularity` 6 语页面（SSR + 投票客户端岛）
- 防刷：Turnstile + IP 限速 + 匿名 user 去重
- Top-N 人气榜 OG 图卡（`?mode=ranking`）+ 分享按钮
- 合规扫描通过 + vitest 覆盖

**Phase 2（验证有粘性后）**
- 球员头像（Wikimedia Commons CC-BY + 署名）
- **球员详情页**（点名字/照片进入，新路由如 `/player/[slug]`，+1–2 天）：**事实取自 Wikidata（CC0，无署名/无传染）** + 自己/AI 文字 + "维基百科详情 →" 外链；**不整段拷维基正文**（避 CC BY-SA copyleft）。详见 §13。
- 两两对决玩法（"谁更受欢迎 A vs B"，ELO/Bradley–Terry 排序，更上瘾、更难刷）
- 提为底部导航第 6 tab（视数据）
- 与射手榜/球队页交叉链接

**明确不做**
- 最帅/最美球员或球迷颜值评选（§9）
- **AI 颜值打分**（已评估否决，§9）；**AI 实力数字进榜**（用真实数据替代，§9）
- 用户自由提名候选（审核负担 + 注入风险）
- 付费 squad API 拉全量 1100 名球员

---

## 3. 关键决策：候选名单从哪来 ★（已拍板：策展 + 射手补充）

grounding 确认：**无 squad 表、无球员 ID、无照片**；唯一球员数据是 `getScorers.ts` 的 football-data Top 20 射手（`playerName`/`nationality`/`teamName`/`goals`，30 分钟缓存，free tier 无 assists、无照片）。

**采用 = 策展种子(B) + 射手自动补充(A)**：
- 维护一份 `src/data/players.seed.ts`：~40 名（覆盖夺冠热门 + 各大洲代表 + 流量人物），字段见 §4。**开工前我先草拟一版名单给你审。**
- 上线后用 `getScorers()` 的当前射手做**自动补充**（射手榜里出现但不在种子里的，标 `source:'scorers'` 临时入候选），让名单跟着赛事走但主体可控。
- 队名/国旗/翻译**直接复用** `src/lib/football/teams.ts` 的 `NATIONS` map（en→zh/es/pt/de/fr + ISO2 flagcdn）。球员名 MVP 只显示拉丁原名（无球员名 i18n）。

**照片（独立决策）**：MVP **不放头像**——球员照片版权属拍摄方/经纪，扒图=侵权，与你的 EU 合规盘冲突。用 `flag + 队徽(crest) + 姓名 + 球衣号` 的卡片即可成立。Phase 2 若要头像，**只用 Wikimedia Commons CC-BY/CC0** 并在页脚署名，逐个策展。

**新增：维基条目映射**。热度分要用维基百科 pageviews，种子里每名球员需带 `wiki_title`（如 `Lionel_Messi`），策展时一次性填好。

---

## 4. 数据模型

### 4.1 `players`（候选表，策展种子 + 自动补充）
```sql
create table if not exists players (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,        -- 'lionel-messi'，用于 URL/QR
  name        text not null,               -- 拉丁原名（显示用）
  team_name   text not null,               -- 对齐 NATIONS map 的英文队名
  country_iso text,                         -- ISO2，flagcdn 用
  position    text,                         -- 'FW'/'MF'/...（可空）
  shirt_no    int,                          -- 球衣号（可空）
  wiki_title  text,                         -- 维基条目名（热度分用，如 'Lionel_Messi'）
  photo_url   text,                         -- Phase 2，CC 授权图（可空）
  photo_attr  text,                         -- 照片署名（可空）
  source      text not null default 'seed', -- 'seed' | 'scorers'
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
grant select on players to anon, authenticated;
grant all    on players to service_role;
```

### 4.2 `player_votes`（投票事实表，实时）
```sql
create table if not exists player_votes (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  user_id    uuid not null,                -- 匿名 auth 的 user.id
  created_at timestamptz not null default now(),
  unique (player_id, user_id)             -- 一人对一球员一票（可改投=upsert/delete）
);
grant all on player_votes to service_role; -- 写只走 service role；读走聚合
```

### 4.3 `player_metrics`（慢变信号缓存：热度 + AI 短评）
```sql
create table if not exists player_metrics (
  player_id       uuid primary key references players(id) on delete cascade,
  buzz_raw        numeric not null default 0,  -- 维基 pageviews（近7日合计）
  buzz_updated_at timestamptz,
  ai_blurb        text,                        -- 中文短评（DeepSeek）
  ai_blurb_en     text,                        -- 英文短评（Gemini）
  ai_updated_at   timestamptz
);
grant select on player_metrics to anon, authenticated;
grant all    on player_metrics to service_role;
```
> ⚠️ **GRANT 必写**（隧道建表不自动授权——见记忆 [[wc2026-supabase-db-tunnel]] 与 `0003_events.sql` 先例）。
> **表现分不存表**：赛后从 `getScorers()`（已 30min 缓存）读，读时换算，省一张表一套同步。

迁移文件：`supabase/migrations/0005_player_popularity.sql`（沿用编号约定）。

---

## 5. 评分模型：透明人气指数 ★

### 5.1 公式
对每名 `is_active` 球员，先把三个分项各归一化到 `[0,100]`，再加权求和：

```
index = 0.55 * voteScore + 0.30 * perfScore + 0.15 * buzzScore
```

| 分项 | 权重 | 归一化口径 | 更新频率 | 来源 |
|---|---:|---|---|---|
| **球迷投票** voteScore | **55%** | `100 * votes / maxVotes`（全榜最高票=100） | **实时**（读时聚合，缓存 60s） | `player_votes` count |
| **表现分** perfScore | **30%** | 射手榜名次衰减：Top1=100、按名次递减；非射手=0 | **赛后事件驱动** | `getScorers()` 进球(+出场) |
| **网络热度** buzzScore | **15%** | `100 * buzz_raw / maxBuzz`（全榜最高=100） | **每 12 小时** | 维基 pageviews（`player_metrics.buzz_raw`） |
| AI 短评/标签 | 不进分 | — | **每 12–24h** | DeepSeek/Gemini（旁注 flavor） |

- **归一化与加权在 TS 读时算**（`getRanking()`），不进 SQL：一次拉 票数(live) + `player_metrics`(buzz) + `getScorers`(perf 原料)，在内存里 min-max 归一 + 加权 + 排序，整体 `unstable_cache(..., {revalidate:60})`。
- 投票占 55% → **投票看得见地推动榜**，保住参与感；表现+热度占 45% → 抗刷、增厚。
- **表现分的已知局限**：free tier 无 assists、只有 Top20 射手，所以后卫/门将/非射手 perf=0。可接受——这是"人气榜"，表现只是加成，投票主导。UI 文案别把它说成"实力榜"。

### 5.2 频率落地（你让我定）
- **投票**：实时（读时聚合）。
- **表现分**：搭现有 `autoSettle`/settle cron，赛后才动，无需轮询。
- **热度**：每 12h 拉一次维基 pageviews（pageviews 按天出，1h/3h 是浪费）。Vercel cron 只日级 → 用现有外部 cron-job.org 每 12h 打 `/api/cron/player-buzz`（与站内既有外部 cron 一致）。
- **AI 短评**：每 12–24h（其实球风短评几乎不变，一次性生成 + 偶尔 `staleBefore` 刷新即可）。

### 5.3 网络热度数据源（重要）
- ✅ **维基百科 pageviews REST API**：免费、无 key、官方、稳定、多语。
  `GET /metrics/pageviews/per-article/{project}/all-access/user/{wiki_title}/daily/{start}/{end}`（取近 7 日求和做 `buzz_raw`）。
- ❌ **不用** Google Trends（无官方 API、pytrends 非官方且易崩）、不扒 X/Reddit（贵、限流、ToS 风险）。

---

## 6. 后端 API

### 6.1 `POST /api/player-vote`（投票/改投/撤票，实时）
复用现有 POST 路由骨架（`predict`/`track` 的模式）：
```ts
// 1) 取匿名用户：Authorization: Bearer <jwt> → anon client 校验 → user.id
// 2) same-origin 校验（抄 track route：origin.host === host，挡裸 curl）
// 3) Turnstile：verifyTurnstile(token, ip)  —— fail-closed
// 4) 限速：rateLimit(`vote:${ip}`, 20, 60_000) + rateLimit(`vote_u:${user.id}`, 10, 60_000)
// 5) 校验 player_id 存在且 is_active
// 6) getServerSupabase()：
//      action='vote'   → upsert(player_votes, {player_id,user_id}, onConflict:'player_id,user_id')
//      action='unvote' → delete where player_id & user_id
// 7) 返回该球员最新 votes（+ 该用户已投列表）
```
- 去重靠 `unique(player_id, user_id)`；一人可投多名球员各一票。

### 6.2 `GET /api/cron/player-buzz`（热度同步，每 12h）
- CRON_SECRET 校验（抄 `cron/settle` 三格式 Bearer 校验）。
- 遍历 `players`（有 `wiki_title` 的），打维基 pageviews API，求近 7 日和 → upsert `player_metrics.buzz_raw` + `buzz_updated_at`。
- 失败软降级（某球员拉不到就跳过，不抛）。

### 6.3 AI 短评生成（安全版，不进分）
- 复用 `ai_content` 管道思路：`safeGen`(中文 DeepSeek) / `safeGenEn`(英文 Gemini **3.1-flash-lite**)。
- **prompt 只描述球风/特点/X-factor，严禁对外貌/颜值打分或评价**；输出过 `bannedTerms` 失败回退。
- 存 `player_metrics.ai_blurb/ai_blurb_en`，`staleBefore` 刷新。es/pt/de/fr 走英文回退（与全站一致，Phase B 暂缓）。
- **前端只显示这句短评文本**，方法/口径留在代码 prompt 里（满足"前端不显示细则"）。

### 6.4 读取
- `getRanking()`：anon client 读 票数聚合 + `player_metrics` + `getScorers()`，TS 内归一化加权排序，`unstable_cache` 60s。
- "我投过谁"：客户端岛挂载后用用户 token 查（或轻量 `/api/player-vote?mine=1`）。

---

## 7. 前端

### 7.1 页面 `src/app/popularity/page.tsx`
- async server component（抄 `forecast/page.tsx` / `leaderboard/page.tsx`）。
- `generateMetadata()` 用 `localizedAlternates("/popularity", locale)` —— 自动 6 语 canonical + reciprocal hreflang。
- 每行：rank / 国旗 / 队名 / 球衣号 / **人气指数** + （可点开）**分项拆解**(投票/表现/热度) / AI 短评一行 / 投票按钮(客户端岛 `<VoteButton>`)。
- 页脚 `Disclaimer`（"娱乐性社区投票，指数由公开数据与社区投票合成，不构成任何预测或背书"）。

### 7.2 i18n / sitemap / 导航
- `Dict` 加 `popularity` 段 + `nav.popularity`；6 个 `messages/*.ts` 各补齐（缺 key 即编译失败）。
- 文案候选（过 `bannedTerms`）：en `Fan Favorites` / zh `球迷最爱` / es `Favoritos de la afición` / pt `Favoritos da torcida` / de `Publikumslieblinge` / fr `Favoris des fans`。**避用** bet/odds/stake/payout/parlay 与中文博彩词。
- `sitemap.ts` `staticBase` 加 `{ path:"/popularity", changeFrequency:"daily", priority:0.7 }` → 自动 6 语 URL。
- 导航 MVP **不进 `BottomNav`**（底部 5 格留传播资产，见 `:34`）；走首页 hero 卡片 + `/forecast`·`/leaderboard` 入口。

### 7.3 投票 UX
- 复用 `Toast`/`track('player_vote',{player_id,action})`/`copyText`/`HeaderShare`；乐观更新票数 + 失败回滚。
- 未登录首次投票静默走匿名 auth（站内已有）。
- 票数变化实时反映到 voteScore，但 perf/buzz 慢变 → 文案标"指数每日刷新表现与热度"。

---

## 8. 图卡（战略核心：传播弹药）

`/api/og/route.tsx` 已是成熟图卡工厂（`?mode=swing|match|report|thirds`，1080×1440 竖卡，6 语，CJK 字体 fail-soft）。**`thirds` 模式(12 行排行布局)就是现成模板。**
- 新增 `?mode=ranking`：渲染 Top-8~12 球员（rank / 国旗 / 队名 / **人气指数**），标题 `球迷最爱 Top 10 · 2026 世界杯`。
- 新增 `buildRankingOgUrl()`（抄 `src/lib/share/matchCard.ts:121` 的 `buildMatchOgUrl`，~15 行，客户端构造避免水合时区错位）。
- **安全铁律**：OG 卡里**只放 DB/聚合来的静态数据**（球员名来自策展种子、指数来自计算），**绝不嵌用户输入文本**；动态文案先过 `findBannedTermsStrict()`（route 已 fail-closed）。
- 分享：`HeaderShare`（Image 直链 PNG + Link 原生分享/复制）零改动复用。

---

## 9. 已否决方案 & 合规边界（务必保留在文档里）

- ❌ **最美女球迷/颜值评选**：球迷是素人，GDPR + 德 KUG §22 / 法 Code civil Art.9 肖像权、照片来源无解、AdSense shocking/sexual 风险、r/soccer 秒删毁 karma，与刚定稿的 de/fr 法务页自相矛盾。
- ❌ **AI 颜值打分**（含"只藏方法、前端只显示分"）：风险在**处理本身**不在展示——服务器端给真人脸算分即 liability；GDPR 对自动化画像要求**披露逻辑**，藏=更糟；AI 颜值评分有公认种族/性别偏见；与"透明指数"自相矛盾且不可辩护。**改为：颜值由投票天然承载，平台不下颜值断言。**
- ❌ **AI 实力数字进榜**：违反你"概率/评分绝不用 LLM 算（校准差/不稳定/状态过期）"的红线。**改为：表现分用真实数据；AI 只产文字短评。**
- ✅ 合规：可见文案过 `assertClean`/`bannedTerms`；图卡文本过 `findBannedTermsStrict`；AI 短评 prompt 禁外貌评价；页脚娱乐性免责；积分（若挂钩）永不可兑换有价物。

---

## 10. 防刷威胁模型 & 残余风险

匿名 auth 门槛低，决心强的人可批量注册匿名用户刷票。**透明指数把投票压到 55%、表现+热度 45% 不可由用户操纵 → 刷票影响被天然稀释**，比纯投票更抗刷。

| 防线 | 手段 | 现成件 |
|---|---|---|
| 机器人 | Turnstile fail-closed | `security/turnstile.ts` |
| 洪水 | IP + user 双限速 | `rateLimit.ts` |
| 脚本直打 | same-origin 校验 | `track route` 模式 |
| 重复 | `unique(player_id,user_id)` | 迁移约束 |
| 影响稀释 | 投票仅占指数 55% | 评分模型 §5 |

- 残余：单设备小规模刷票。缓解（按需）：voteScore 用对数压缩、或按账号 checkin 天数加权、或对新匿名账号降权。MVP 接受残余，UI 标"社区投票，仅供娱乐"。
- **不做**：无人值守养号/造票（与社媒运营定调一致 [[wc2026-social-account-operation]]）。

---

## 11. 构建计划（按文件，分层增量）

建议按"层"上线：先纯投票核心能独立跑，再叠表现/热度/指数/短评，每层都可单独验证。

| 层 | 任务 | 文件 | 预估 |
|---|---|---|---|
| **L0 投票核心** | 策展种子(+wiki_title) | `src/data/players.seed.ts` | 0.5d |
| | 迁移(players/votes/metrics + GRANT) | `supabase/migrations/0005_player_popularity.sql` | 0.5d |
| | seed 灌库 + 射手补充 | `scripts/seed-players.ts`、`src/lib/players/getCandidates.ts` | 0.5d |
| | 投票 API | `src/app/api/player-vote/route.ts` | 0.5d |
| | 页面 + 投票岛 + i18n + sitemap + 入口 | `app/popularity/page.tsx`、`components/VoteButton.tsx`、`i18n/*`、`sitemap.ts` | 1.5d |
| **L1 表现分** | 射手榜→perfScore 换算（读时） | `src/lib/players/getRanking.ts` | 0.5d |
| **L2 热度分** | 维基 pageviews 抓取 + cron + 归一 | `app/api/cron/player-buzz/route.ts`、`lib/players/buzz.ts` | 1.5–2d |
| **L3 指数合成** | 归一化+加权+排序+分项展示 | `getRanking.ts`、页面 UI | 1.0d |
| **L4 AI 短评** | DeepSeek/Gemini 短评（安全 prompt）入 `player_metrics` | `lib/players/blurb.ts`(复用 ai 管道) | 1–2d |
| **L5 图卡** | OG `?mode=ranking` + buildRankingOgUrl + 分享 | `api/og/route.tsx`、`lib/share/matchCard.ts` | 1.0d |
| **L6 测试** | vitest + 合规扫描 + 防刷验证 | `*.test.ts`、`seo-compliance-scan` | 0.5d |
| | **合计** | | **≈ 8–10 天** |
| +A | 头像(Wikimedia CC) | seed 加 `photo_url/photo_attr` + 渲染 | +1d |

---

## 12. 决策记录 & 待拍板项

**已拍板（2026-06-16）**
1. ✅ **候选名单**：策展 ~40 球星种子 + 射手榜自动补充（B+A）。
2. ✅ **投票语义**：一人可给多名球员各投一票（`unique(player_id,user_id)`）。
3. ✅ **排名模型**：B 透明人气指数 = 投票 55% + 表现 30% + 热度 15%，分项可展示。
4. ✅ **AI 落地**：安全版——只产文字短评/标签（方法留代码 prompt、前端只显示输出），**不打颜值分、不进排名分**；颜值由投票承载，实力用真实数据。
5. ✅ **热度源**：维基百科 pageviews（每 12h）；不扒社媒、不用 Google Trends。
6. ✅ **球员详情页**：列为 **Phase 2**（不进 MVP）。事实取自 Wikidata（CC0）+ 自己/AI 文字 + 外链维基；不整段拷正文；照片仅用 Commons 自由图。详见 §13。
7. ✅ **当前状态**：方案停在文档；不开工实现。优先本周第三名计算器 + 6/22–27 分发窗，人气榜放留存层那一批。

**待拍板（实现前再定）**
7. **照片**：MVP 无头像（推荐）/ 还是 Phase 2 上 Wikimedia CC 授权图？
8. **积分挂钩**：投票给少量积分（拉参与，需防刷加权）/ 还是纯互动不挂积分（推荐 MVP）？
9. **导航**：入口引流不占底栏（推荐）/ 还是直接上第 6 tab？
10. **权重微调**：55/30/15 是否合适？（可上线后按榜单活跃度调）
11. **种子名单**：开工前我草拟一版 ~40 人名单（含 `wiki_title`）给你审。

---

## 13. 球员详情页 & 维基系内容授权（Phase 2）

点球员名字/照片进入详情页（新路由 `/player/[slug]`，自带 i18n/metadata/hreflang/缓存，≈ +1–2 天）。"信息来源维基百科"含三种**不同法律待遇**，务必分清：

| 内容 | 授权 | 用法 | 义务 |
|---|---|---|---|
| 事实字段（生日/国籍/位置/俱乐部/身高/出场） | 事实不受版权 + **Wikidata = CC0** | ✅ 直接用 | **无**（无署名、无传染） |
| 维基百科正文/简介文字 | **CC BY-SA 4.0** | ⚠️ 可用但有条件 | 署名 + 复用段落须同以 CC BY-SA 发布（copyleft 传染那一段） |
| 文章里的照片 | **逐图不同**（Commons 多为 CC，但有 fair-use 非自由图） | ❗ 必须逐图查 | 自由图也要按该图许可署名 |

**最大坑**：照片出现在维基文章里 ≠ 可自由使用。

**采用的干净做法**：
1. **事实走 Wikidata（CC0）**——详情页主体（`wbgetentities`/SPARQL，按 `wiki_title`→QID 取）。
2. **描述文字用自己的/AI 短评**（复用安全版短评），**不整段拷维基正文**（避 CC BY-SA 传染）。
3. **加 "维基百科详情 →" 外链**（新标签）：零风险，给深度信息，顺带满足出处精神。
4. **照片**：维持 §3 结论，仅用 Commons 已确认自由许可图 + 逐图署名。

**肖像权/GDPR**：球员是公众人物，中性事实档案页属**编辑性使用**，合法性强（不暗示代言、不进广告素材即可）。与 §9 否决的"按外貌打分"是两码事——展示事实信息不踩雷。

---

## 附：grounding 出处（5-agent 并行核查，2026-06-16）

- 数据层：`src/lib/football/getScorers.ts`（仅 Top20 射手）、`src/lib/football/teams.ts`（NATIONS i18n+flag 可复用）、无 squad/players 表
- 持久化/防刷：`src/lib/supabase/{client,server}.ts`、`src/lib/ai/store.ts`(upsert)、`src/lib/rateLimit.ts`、`src/lib/security/turnstile.ts`、`supabase/migrations/0003_events.sql`(GRANT 先例)
- i18n/路由：`src/i18n/*`、`src/proxy.ts`、`src/lib/seo/canonical.ts`、`src/app/sitemap.ts`、`src/components/BottomNav.tsx`
- 图卡/合规/分享：`src/app/api/og/route.tsx`(`thirds` 模板)、`src/lib/compliance/bannedTerms.ts`、`src/components/HeaderShare.tsx`、`src/lib/share/matchCard.ts`
- AI 管道：`src/lib/ai/{content,store,gemini,deepseek}.ts`、`src/app/api/cron/gen-content/route.ts`
- 热度源：维基百科 Pageviews REST API（免费/无 key/官方/多语）
