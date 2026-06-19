# 事件解读 Blog 频道 / Event Commentary — 设计方案

> 状态：草案 v1（2026-06-19）｜定位：**SEO 获客 + 承接热点流量**，护城河 = 引擎概率影响解读
> 真理源：本文件。实现前对照 `docs/SEO-GEO-PLAN.md`、`docs/GROWTH-PLAN.md` 与 5 周运营策略红线。
> 核心范式：**需求优先（Google Trends）× 数据锚定（引擎概率 Δ）→ AI 生成 → 三层审核闸 → 自动发布**，人工只兜底"被打回"的稿。

---

## 0. TL;DR（先读这段）

- **做什么**：新增一个 `/blog`（en 根）+ `/zh/blog`（中文）**事件解读频道**。当世界杯出现有搜索需求的热点时，AI 自动生成"有趣有料有梗 + 概率影响"的解读文章，经审核自动上线；并在 **比赛详情页 / 球队详情页** 挂"相关事件解读"入口承接长尾。
- **为什么能做**：不是从零搭，是**接管线**。`/api/cron/settle` 已经在跑 **zh DeepSeek + en Gemini** 生成 recap、`gen-content` 是现成 AI cron 模板、`latestMatchProbs` 已经在把真实概率喂给 AI、SEO/i18n（hreflang/sitemap/JsonLd/OG 工厂）成熟可复用。
- **触发范式 ★**：**需求优先、数据锚定**。Google 热点趋势/搜索需求**选题**（有人搜才有流量），引擎概率 Δ **给独家角度**（别人抄不走）。**有数据事件但没人搜 → 不写**；**有热点但挂不上数据 → 找间接概率角度，挂不上就跳过**。
- **数字红线 ★**：所有概率/比分**来自引擎结构化输入**，模型只负责叙事，**禁止自己生成数字**；并用**确定性代码对账**（正则抽数字 vs 引擎值）硬拦幻觉数字——头号事实风险由代码消灭，不靠 AI 判断。
- **审核 = 三层闸**：① 确定性硬闸（数字对账 + 红线词扫描 + 无逐字引用）② LLM 软闸（**异于生成器的 provider**，查输入外事实/诽谤/合规）③ 题材白名单 + 需求/量管控器。**数据驱动类干净高置信 → 自动发；被旗标/低置信/高危题材 → 隔离区等人工。**
- **模型选型（已拍板）**：en = **Gemini 3.1 Flash Lite**；zh = **DeepSeek V4 Pro**（慢但稳，赛后异步生成不在乎延迟）。en/zh 并行生成（不同 provider 不抢配额）。
- **语种**：blog **只做 EN + ZH 两语**，与站点 5 个营销语种（es/pt/de/fr）**解耦**；hreflang 只输出该文实际有的 en/zh（fail-closed）。ZH 接海外华人定位。
- **管理页**：极简，受 `/me` 鉴权保护 + `noindex`；状态筛选 / 行内预览 / 批量上线 / 批量删除 / **一键撤下** / 被打回原因 / 快速改一句再发 / 重新生成。
- **R1 已核实 = 利好（2026-06-19）**：球队级快照表 **`prob_team_snapshots` 已存在且在写**（`pipeline.ts §9` 每次重算 + `/api/cron/warm` 每小时累积；含 `p_advance`/`p_champion` + `created_at`）；且 **`getMatchSwing.ts` 已实现 before(开球前最后一张)/after(结算后首张) delta + 真爆冷检测(10pp)**。blog 的"概率影响"**复用现成 swing 机制**即可，只需扩展返回 `p_champion` + 单场 1x2 Δ。见 §13 R1。
- **工时**：MVP ≈ **7–10 天**，建议分层增量（§14）。
- **排期提醒**：这是 SEO 长线获客资产，与第三名计算器分发窗（6/22–27）不冲突，可并行推进；但**先做的是"赛后结算触发"主干**，赛中实时事件流因 FD 权益 **7/14 到期 + 无持久化** 仅作可选加分项。

---

## 1. 目标与定位

| 维度 | 说明 |
|---|---|
| 受众 | 搜世界杯热点的全球用户（en）+ 海外华人（zh） |
| 产品目标 | ① **承接热点搜索流量**（SEO 获客主力之一）；② 用独家概率解读把流量沉到站内（/team、/match、/forecast、计算器） |
| 不是什么 | **不是**截图 X 热帖 + 灌水的聚合页（会触发 Google scaled-content 处罚，已否决）；**不是**无人值守养号；**不是**纯供给驱动的"自嗨分析"（没人搜=没流量） |
| 护城河 | **引擎概率影响解读**——每篇都挂"该事件如何改变出线率/夺冠率/单场胜负率"，这是 AI 内容农场复制不了的组合 |
| 变现关系 | 间接：拉新 + 站内沉淀 + 新闻流（Discover/Top Stories）曝光 |
| 红线 | 同站规则：不用 odds/bet 词族（过 `findBannedTermsStrict`）；不诽谤真人；不整段拷贝来源；无重大事实偏差 |

---

## 2. 范围（MVP vs 后续 vs 不做）

**MVP（本设计实现目标）**
- 需求门控 + 事件检测器（Trends/赛程/赛果融合 → 生成队列，§4）
- `gen-blog` 独立 cron：Gemini-en / DeepSeek-zh，结构化概率输入（§5）
- 三层审核闸 + 自动发布 / 隔离区（§6）
- `blog_entries` 表 + RLS（§7）
- `/blog` 索引 + `/blog/[slug]` 详情，EN+ZH（§8）
- 比赛页 / 球队页"相关事件解读"入口（§9）
- BlogPosting/NewsArticle schema + sitemap + OG `mode=blog`（§10）
- 极简管理页（§11）
- 合规扫描通过 + 关键逻辑 vitest 覆盖

**Phase 2（验证有流量后）**
- 单篇浏览量回看（学哪类题材有效，反哺选题）
- 置顶/精选大事件到首页或 /blog 顶部
- 赛中实时事件流落 `event_log` 持久化（仅 FD 权益有效期内，加分项）
- **GDELT DOC 2.0**（全球新闻雷达：文章量/来源数/tone，免费无 key）+ 直连官方源(BBC Sport/Guardian/Google News RSS，**非 RSSHub**) 作为额外需求/新闻上下文；GDELT tone 兼作 sensitive 判定辅助。（CodeX 评估采纳；TrendRadar/SocialED/HotPush/X-API/RSSHub-自托管 均否决）
- 历史事件回填（淡季批量补稿）

**明确不做**
- 截图 X/Reddit 热帖整页转载（版权 + ToS + scaled-content 三重风险）
- 把 blog 翻成全部 5 营销语种（6× 内容量，重复内容风险，性价比低）
- 让 LLM 自由生成概率数字（用引擎值 + 确定性对账替代）
- 把 blog 生成塞进 `settle` 的 60s 预算（独立 cron）
- 完整 CMS（用极简管理页 + Supabase Studio 兜底）

---

## 3. 关键决策汇总（已拍板）

| # | 决策 | 结论 |
|---|---|---|
| D1 | 内容形态 | 原创"事件解读 + 概率影响"，**非**截图聚合 |
| D2 | 触发范式 | **需求优先（Trends）× 数据锚定（概率 Δ）**，需求门控（没人搜不写） |
| D3 | 实时性 | **赛后结算触发**为主干；赛中逐事件流仅 Phase 2 加分（FD 权益 7/14 到期 + 无持久化） |
| D4 | 模型 | en = Gemini 3.1 Flash Lite；zh = DeepSeek V4 Pro；并行生成 |
| D5 | 数字来源 | 引擎结构化输入；模型禁止造数字；**确定性对账硬拦** |
| D6 | 审核 | 三层闸（确定性硬闸 + LLM 软闸 + 题材白名单/量控）；自动发 vs 隔离区 |
| D7 | 语种 | 仅 EN + ZH，与 5 营销语种解耦，fail-closed hreflang |
| D8 | 管线位置 | 独立 `/api/cron/gen-blog`，CRON_SECRET 保护，cron-job.org 调度 |
| D9 | 管理页 | 极简、受保护、noindex；功能见 §11 |
| D10 | 发布后 | published 进 sitemap + ping IndexNow（复用 settle 的 `after()` 模式） |

---

## 4. 触发模型：需求优先、数据锚定 ★

### 4.1 三个信号源

| 信号 | 来源 | 角色 | 可靠性 |
|---|---|---|---|
| **场上事件** | 引擎概率快照 diff + 赛果 | **数据锚定**（给独家角度） | 高（自有数据） |
| **搜索需求** | **赛程 query 模板（一级，免费必到）** + **Trending Now RSS（二级，免费，逮大事件 + `news_item` 新闻上下文）** | **需求门控**（选题/关键词/优先级） | 模板高 / RSS 中（国家级 top~10、具体场常缺席，见 §13 R2 实测） |
| **媒体热度/新闻** | **GDELT DOC 2.0**（全球新闻，~15min，免费无 key，JSON：文章量/来源数/tone）+ 直连官方源(BBC/Guardian/Google News RSS) | 二级需求 + 新闻上下文 + **tone→sensitive 判定辅助** | 中（实测从共享代理 IP 即 429；需 ≤1req/5s + 缓存 + 干净出口 IP，见 §13 R10） |

**事件类型（数据锚定）**（P2.4 已按真实数据校准，见 `getProbDelta.ts`）：
- `upset`（赛后）：实际结果 ≠ 赛前最可能结果（argmax）**且**出线率摆动 ≥10pp。（旧"赢家胜率<50%"会把几乎每场平局误判为爆冷，已弃）
- `clinched` / `eliminated`（赛后）：`pAdvance` 触顶(~100%)/触底(~0%)，**且赛前还没接近锁定/出局**（before ≤90% / ≥10%）——否则 99%→100% 这类 2pp 不算新闻。
- `swing`（赛后）：出线率 |Δ| ≥10pp。
- **`market_swing`（赛前，新增）**：未开赛比赛的**市场隐含 1x2**（`prob_match_snapshots.market`，引擎追踪的真实值）较早先快照漂移 ≥阈值 → 场外事件的**可量化前导指标**，并填补"赛前内容"时间窗。见 §4.4。
- `milestone`：帽子戏法/纪录等（需事件流，Phase 2）

**需求信号（门控）**：
- Trends：rising query 命中"worldcup / 队名 / 球员名 / 'A vs B'"族
- 可预测高流量模板（不靠 Trends 也成立）：`[teamA] vs [teamB]`、`[team] qualified/eliminated`、`why [player] red card`、`[team] next match`

> ⚠️ **诚实工程提醒**：Google Trends 无稳定官方 API（近年有 beta，实现前先核当前可用形态 vs 非官方 wrapper），链路**不得硬依赖**它；**永远在线的骨干 = 赛程日历 + 赛果**，Trends 是增强信号，挂了不影响主干。场上事件往往本身就是搜索峰值成因，两者近乎同时。

### 4.2 融合 → 生成队列

```
持续(cron):
  needsByDemand = Trends rising ∪ 可预测高流量 query 模板（绑定到具体 match/team）
  eventsByData  = 结算后 diff 概率快照命中 swing/upset/clinched/eliminated 的 match
  queue = 对每个候选话题:
            demandScore = 需求强度（Trends 热度 or 模板基础权重）
            dataAnchor  = 能否取到该话题的概率 Δ（match_id/team → 引擎）
            priority    = f(demandScore, dataAnchor 是否存在)
          按 priority 排序入 generation queue（去重：同 match+event_type 不重复）
```

> **信号层落地（采纳 CodeX 结构建议）**：`src/lib/blog/signals/` —— `googleTrends.ts`（现 `getTrendingNow`，扩 geo：US/GB/CA/AU/IE + BR/MX/AR/ES/DE/FR）/ `gdelt.ts`（媒体量+来源数+tone，≤1req/5s + 缓存 + best-effort）/ `rssSources.ts`（**直连官方源** BBC/Guardian/Google News RSS，**非 RSSHub 自托管**；Phase 2）/ `scoreCandidate.ts`（= 本节融合：需求阈值 **且** 能绑定 match/team + `prob_delta` 才入队）。**原则不变：`prob_delta` 数据锚 = 唯一护城河 + 自动发硬门槛；新增信号只丰富需求侧，不单独触发出稿。** 否决：TrendRadar/SocialED/HotPush/X-API/RSSHub-自托管。

### 4.3 三种命中情况的处理 ★

| 情况 | 处理 |
|---|---|
| **热点 ✓ + 数据角度 ✓** | 最强稿。例："姆巴佩伤退 → 法国夺冠率 X%→Y%"。生成 + 自动发（过闸） |
| **热点 ✓ + 数据角度 ✗** | 优先找间接概率角度（把场外热点连到某队/某场概率）；连不上 → **跳过**（守量的纪律），或 Phase 2 轻量稿走人工 |
| **数据事件 ✓ + 没人搜 ✗** | **不写**（没需求=没流量=白费额度）。可留记录不出稿 |

### 4.4 场外事件与市场漂移（原则）★

场外突发（伤病/停赛/换帅/丑闻）是巨大搜索流量，但引擎**无法把概率变化归因到具体场外原因**（伤病不是模型输入，只经赔率间接、滞后渗入）。因此：

- **禁编因果 Δ**：绝不写"伤病让夺冠率从 X 掉到 Y"——硬闸也会拒（payload 无此 before/after）。
- **场外稿锚定"当前 standing"**：用该队**当前真实概率**（出线/夺冠/下场 1x2）+ 定性 stakes，新闻作上下文，不声称因果。例："法国当前夺冠率 14%；若姆巴佩缺阵，这对它是实打实打击。"
- **市场漂移 = 唯一可量化的场外钩子**（已验证 2026-06-19）：`prob_match_snapshots.market` 存了市场隐含 1x2 的时间序列，**赛前漂移是引擎追踪的真实 before/after**。检测未开赛比赛 `market` 漂移 ≥阈值 → `market_swing` → "赛前我们模型对 X 的**隐含胜率**已从 a% 移到 b%（恰逢 [news]）"，量化且不归因。
  - **措辞红线**：正文只说"市场隐含胜率/概率"，**绝不出现 odds/赔率/盘口**（撞 `findBannedTermsStrict`）。信号叫赔率，内容说概率。
  - **粒度 / 稀有性（实测）**：Odds API 在 `pipeline.ts` 是 6h 缓存 → 漂移按天/数小时，抓不到开赛前突变；且当前（无大新闻）最大漂移仅 ~6pp → **`market_swing` 是"大事才触发"的低频高值信号，非产量主力**。阈值宜 **≥8pp（或由热转冷翻转）**；或降到 ~5pp 但**要求 GDELT/新闻佐证**（市场动 + 有对应新闻才出稿）。
  - **数据覆盖**：`market` 仅 ~17% 快照有值（仅赔率覆盖的近期比赛），缺值时无此信号。
  - **路由**：漂移常意味伤病/停赛（高危）→ 打 `sensitive` / 强制人工。
  - **落地**：`getMatchMarketSwing`（P2.4 兄弟件，复用 `prob_match_snapshots.market` 读法）→ 喂 P2.5 `scoreCandidate`，与赛后 `prob_delta` 并列为两类数据锚。

---

## 5. 内容生成管线

### 5.1 模型选型（已拍板）
- **en = Gemini 3.1 Flash Lite**（沿用 `gen-content` 现有 Gemini 接入；尊重免费 15 RPM 限速）
- **zh = DeepSeek V4 Pro**（沿用 `settle` 现有 DeepSeek 接入；慢但稳，异步无所谓）
- en/zh **并行生成**：两 provider 不抢配额，Pro 的延迟被并行吃掉。

### 5.2 结构化输入（数字来自引擎）★
生成器**只能**从这份结构化 payload 取数字，模板由代码组装（以下为合成示例值，非真实数据）：
```jsonc
{
  "match": { "id": "uuid", "home": "...", "away": "...", "score": "3-0", "stage": "...", "kickoffAt": "2026-06-20T19:00:00Z" },
  "prob_delta": {
    "match_1x2": { "before": {"home":0.21,"draw":0.27,"away":0.52}, "actual": "away_win" },
    "teams": [
      { "team":"TeamA", "pAdvance":{"before":0.34,"after":0.71}, "pChampion":{"before":0.01,"after":0.03} },
      { "team":"TeamB", "pAdvance":{"before":0.95,"after":0.88}, "pChampion":{"before":0.18,"after":0.14} }
    ]
  },
  "event_type": "upset",
  "demand": { "source":"trends|template", "query":"teama teamb", "heat": 88 },
  "form": { "note": "近期战绩等可选上下文" }
}
```
> 数据来源（已核实）：球队 `pAdvance`/`pChampion` 的 before/after 来自 **`prob_team_snapshots`**（复用 `getMatchSwing.ts` 的 `snapAdvance(team, kickoff)` / `snapAdvanceFrom(team, settledAt)` 模式，扩展 select `p_champion` 即可）；每场 1x2 before 来自 `prob_match_snapshots`。**R1 已解除（§13）。**

### 5.3 提示词原则（详见单独模板交付）
- 角色：足球解读编辑，语气"有趣有料有梗"，但**就事论事不诽谤真人**。
- 硬约束：**只允许陈述 payload 内的事实与数字**；任何 payload 外的断言一律不写；**禁止生成/修改任何概率或比分**。
- 结构：标题（含目标 query 关键词）+ 导语 + "这对出线/夺冠/胜负意味着什么"（引用 `prob_delta`）+ 收尾 CTA（内链 /team /forecast /计算器）。
- 输出：title/excerpt/body（markdown），en 与 zh 各一份（同一 payload，独立成稿，非互译）。
- 题材自检：若涉及争议判罚/纪律/伤病/政治，输出 `topic_flag=sensitive`（供软闸路由人工）。

---

## 6. 三层审核闸门 ★

### 6.1 确定性硬闸（代码，无 LLM，任一不过 → 自动打回/丢弃）
1. **数字对账**：正则抽正文所有数字（%、比分、概率），逐一比对 payload `prob_delta`，容差外即拒 → **消灭幻觉数字**。
2. **红线词扫描**：复用 `findBannedTermsStrict` / `seo-compliance-scan`（odds/bet 词族等）。
3. **无逐字引用 / 无外链原文**：防版权（原创 AI 文本天然低风险，此为兜底）。
4. **格式/语言/长度校验**：markdown 合法、语言正确、长度区间。

### 6.2 LLM 软闸（独立 provider，异于生成器 → 降低相关性盲点）
- 生成用 A（如 Gemini）→ 审核用 B（如 DeepSeek），反之亦可。
- 检查项：有无 payload 外事实断言？有无对真人的侮辱/诽谤？有无合规旗标？语气是否越界？
- 输出：`verdict` + `confidence` + `flagged_spans[]`。

### 6.3 题材白名单 + 需求/量管控器
- **题材白名单**：`result/probability/qualification` 等**数据驱动类 → 允许自动发**；`争议判罚/纪律/伤病/政治` 等**高危类 → 强制人工**。
- **量管控器（真正的 Google 防线，结构性非逐篇）**：每日发布上限；**每篇必须有 `prob_delta` 锚定**；近重复去重；**无需求信号不发**。

### 6.4 自动发布 vs 隔离区判定
```
if 硬闸任一失败              -> rejected（可触发重生成一次）
elif 题材=高危 or 软闸flagged or confidence<阈值 or 无数据锚定
                            -> quarantine（status='needs_review'，进管理页等人工）
else                        -> published（自动上线 + sitemap + IndexNow ping）
```

---

## 7. 数据模型（`blog_entries`）

双语放同一行，hreflang 配对最干净；新增 migration（字段为提议结构）：
```sql
create table blog_entries (
  id            uuid primary key default gen_random_uuid(),
  slug_en       text unique,          -- 描述性: teama-teamb-upset
  slug_zh       text unique,
  title_en text, title_zh text,
  excerpt_en text, excerpt_zh text,
  body_en text,  body_zh text,        -- markdown
  match_id      uuid references matches(id),   -- 可空
  team_ids      uuid[] default '{}',           -- 挂载 team 页用
  event_type    text,                 -- swing|upset|clinched|eliminated|milestone
  prob_delta    jsonb,                -- 引擎算出的 before/after（展示 + 审计）
  demand_signal jsonb,                -- 触发它的需求信号（来源/query/热度）
  review        jsonb,                -- 软闸 verdict/confidence/flagged_spans
  status        text default 'draft', -- draft|needs_review|published|hidden|rejected
  topic_flag    text,                 -- sensitive 等
  author        text default 'WC2026 Editorial',
  published_at  timestamptz,
  updated_at    timestamptz default now(),
  created_at    timestamptz default now()
);
-- RLS: anon 只能 SELECT status='published'；service_role 写。
-- 索引: (status, published_at desc), match_id, gin(team_ids)
-- 注意: 显式 GRANT（本项目新表惯例，见部署约束记忆）
```
> 与 `ai_content`（match_id+type 单行）区别：blog 是独立长文实体，双语同行便于 hreflang 配对与管理页操作。

---

## 8. 页面与路由（`/blog`, `/blog/[slug]`）

- 路由：`src/app/blog/page.tsx`（索引）+ `src/app/blog/[slug]/page.tsx`（详情）。
- 复用 `team/[slug]` 模式：`await getLocale()` → 取 locale → `localizedAlternates(path, locale)` 出 canonical/hreflang → `JsonLd` 注 schema。
- **slug 归一**：复用 `findTeam.ts` 的 `normalizeSlug`（NFC + 安全解码，避免重蹈 Curaçao ç-404）。
- locale 解析：`slug_en`/`slug_zh` 分列；按 locale 取对应 slug + body；走 `localeHref(locale, '/blog/'+slug)`。
- 索引页：按 `published_at` 倒序 + 分页/游标（避免百篇慢加载）；可按球队/类型筛选。
- 宽度：详情用 `PageContainer` `prose` 档（768px 易读）；索引可 `wide` 档卡片网格。
- 分享：复用 `HeaderShare`。

---

## 9. 详情页入口（match / team）

- **比赛页**（`src/app/match/[id]/page.tsx`）：AI 区块（recap/sentiment）之后、market 之前，插**轻量"相关事件解读"链接块**（非整卡，避免与现有 AiBlock 撞版）。`getMatchDetail` 加 `relatedPosts?` 字段，按 `match_id` 查 published。
- **球队页**（`src/app/team/[slug]/page.tsx`）：出线门槛文案块下方加"该队事件解读"区，按 `team_ids` 含 team.id 查。`getTeamDetail` 加 `relatedPosts?`。
- 两处均走 `localeHref` 自动带前缀；只查 `status='published'`。
- JSON-LD：在 match/team 的 schema 里加 `BlogPosting` 关联或 `@graph` 链到 blog 文（强化内链结构）。

---

## 10. SEO / i18n / Schema

- **Canonical/hreflang**：`localizedAlternates()` + `selfUrl()`（`src/lib/seo/canonical.ts`）。**blog 只输出实际存在的 en/zh 备份语种**（fail-closed），不要吐 es/pt/de/fr 假 hreflang。
- **Schema**：套 `methodology` 页的 `TechArticle` 升级为 **`NewsArticle`/`BlogPosting`**（`headline/description/datePublished/dateModified/inLanguage/author=#org/image`）。用 `JsonLd` 组件（同步 Server Component，先于 Suspense）。
- **Freshness**：`getSettledIndex()` 现只索引 `matches.settled_at`；blog 需用自身 `published_at/updated_at` 驱动 `dateModified` 与 sitemap `lastModified`（§13 需扩展 freshness 流）。
- **Sitemap**：`src/app/sitemap.ts` 的 `expand()` 加 blog 条目；**blog 只展 en/zh**（不走 6 语扩展）。量大时考虑 sitemap 分片。
- **OG 图**：`/api/og` 加 `mode=blog`（复用 CJK 字体 + `findBannedTermsStrict` 过滤；1080x1440）。
- **robots**：`/blog` 默认可抓（非 /api、非 /me）；确认 `robots.ts` disallow 不误伤。
- **新闻流**：赛后快速发 + `NewsArticle` → 争取 Google Discover/Top Stories（你要的"承接热点"在此兑现）。

---

## 11. 极简管理页 ★（受 `/me` 鉴权 + `noindex`）

**核心功能**：
- 列表 + **状态筛选**：草稿 / 已上线 / **待人工复核（AI 打回）** / 已拒 / 已隐藏
- **批量复审上线** 按钮、**批量删除** 按钮
- 按 球队 / 场次 / 类型 / 日期 / 状态 **筛选 + 全选**

**强烈建议补（仍属极简）**：
- **行内预览**：EN/ZH 正文 + `prob_delta` 数字 + 触发它的事件 & 需求信号（一眼判）
- **一键撤下（unpublish）**：自动发布必须能秒撤错稿（下线留档，区别于销毁式删除）
- **"被打回原因"列**：哪道闸拦的（数字不符/红线词/LLM 旗标）+ 高亮可疑片段
- **快速改一句再发**：textarea 微调后发布（不做富文本编辑器）
- **重新生成**：整篇或单语言重生

**Phase 2 / 可选**（现在不做）：单篇浏览量回看、置顶精选、IndexNow/收录状态指示灯。

**安全（必须）**：
- **新建独立鉴权闸**(无现成 user-auth 可用，见 §13 R6)：新 env 密钥 + `proxy.ts` 中间件 **HTTP Basic Auth** 守 `/admin/blog`；页面 `noindex` + robots disallow `/admin`。
- 发布/删除/撤下走**服务端 server action + 鉴权校验**，`service_role` 仅服务端；UI 隐藏按钮不算保护。
- v1 兜底：紧急情况可直接 Supabase Studio 翻 `status`。

---

## 12. 可复用的现成件（grounding 确认）

| 能力 | 现成件 | 路径 |
|---|---|---|
| AI cron 模板 | `gen-content`（Gemini）/ `settle`（zh DeepSeek + en Gemini） | `src/app/api/cron/gen-content/route.ts`, `settle/route.ts` |
| AI 写库 + 喂概率 | `upsertContent` / `latestMatchProbs` | `src/lib/ai/store.ts` |
| 每场概率历史 | `prob_match_snapshots`（p_home/draw/away, model, top_scores） | `supabase/migrations/0002_probabilities.sql` |
| 引擎出线/夺冠率 | `pipeline.ts` ForecastData（pAdvance/pChampion/rating） | `src/lib/prob/pipeline.ts` |
| **球队级概率历史快照** | `prob_team_snapshots`（p_advance..p_champion + created_at）+ `/api/cron/warm` 每小时累积 | `supabase/migrations/0002_probabilities.sql`, `src/app/api/cron/warm/route.ts` |
| **概率摆动/爆冷（已实现 ★）** | `getMatchSwing`（before/after delta + 真爆冷判定 10pp + `swingOgPath`） | `src/lib/prob/getMatchSwing.ts` |
| canonical/hreflang | `localizedAlternates()` / `selfUrl()` / HREFLANG | `src/lib/seo/canonical.ts` |
| JSON-LD | `JsonLd` 组件 | `src/lib/seo/jsonLd.tsx` |
| 新鲜度 | `getSettledIndex()` | `src/lib/seo/freshness.ts` |
| OG 图工厂 | `/api/og`（多 mode, CJK, 红线过滤） | `src/app/api/og/route.tsx` |
| 合规扫描 | `findBannedTermsStrict` / `seo-compliance-scan` | （og route 内 + 脚本） |
| locale 路由 | `localeHref`/`stripLocale`/`PREFIXED_LOCALES` + 中间件 | `src/i18n/locales.ts`, `src/proxy.ts` |
| slug 归一 | `normalizeSlug`（NFC） | `src/lib/prob/findTeam.ts` |
| sitemap 扩展 | `expand()` | `src/app/sitemap.ts` |
| 收录推送 | IndexNow ping（`after()` 模式） | `src/app/api/cron/settle/route.ts` |
| 分享 UI | `HeaderShare` | `src/components/HeaderShare.tsx` |
| 调度 | cron-job.org + CRON_SECRET header | `vercel.json`（settle）/ 外部 |
| 相关 env | APISPORTS_KEY, FOOTBALL_API_KEY, FD_LIVESCORES_UNTIL, CRON_SECRET, GEMINI_API_KEY, DEEPSEEK_API_KEY | `.env.example` |

---

## 13. 关键风险与开放项

| # | 风险/开放项 | 影响 | 处置 |
|---|---|---|---|
| R1 ✅ **已核实(2026-06-19，非阻塞)** | 球队级快照**存在且在写**：`prob_team_snapshots`（p_advance/p_r16/p_qf/p_sf/p_final/p_champion + created_at，`0002_probabilities.sql`）；`pipeline.ts §9` 每次重算写入（gated by SUPABASE_SECRET_KEY+simOk），`/api/cron/warm` 每小时累积。`getMatchSwing.ts` 已实现 before/after delta + 真爆冷检测(UPSET_MIN=10pp) + swing OG 卡 | 护城河基建已就位 | blog **复用 `getMatchSwing` 模式**；只需扩展返回 `p_champion` before/after + 从 `prob_match_snapshots` 取 1x2 before。`upset` 检测可直接复用其方向判定。 |
| R2 ✅ **实测(2026-06-19)** | 官方 API 仍 alpha/候选制且无 trending-now；**实测：pytrends/google-trends-api npm 依赖的 `dailytrends`/`realtimetrends` 端点已 404 失效，`explore`/interestOverTime 从本机代理 IP 首请求即 429** → 免费 scraper 路线死 | 需另寻免费源 | ✅ **新版 Trending RSS 活着且免费**：`trends.google.com/trending/rss?geo=US`（实测 200、结构化 XML、含 term/`approx_traffic`/`news_item`、未被 429）。**局限：仅国家级 top~10/日、`category` 过滤实测无效、具体某场常进不了榜** → 当**大事件+场外热点+新闻上下文的二级信号**。**一级需求层仍用免费赛程 query 模板**（必到、可预测）。精确逐词热度才需付费 SerpApi/DataForSEO。RSS 拉取 best-effort 降级（Vercel 可达性待验；不可达则 off-Vercel 拉后入库）。 |
| R3 | FD 实时事件流 7/14 到期 + 无持久化 event_log | 赛中实时不可靠 | 主干用赛后结算触发；赛中流仅 Phase 2 加分（权益期内落 event_log） |
| R4 | scaled-content 处罚是系统/量属性，非逐篇 | 量产可能拖垮整域 | 量管控器（需求门控 + 数据锚定 + 去重 + 日上限）= 结构性防线 |
| R5 | 重复内容（en→zh 若机翻） | 重复内容惩罚 | en/zh **独立成稿非互译**；hreflang 互指；只发实际存在语种 |
| R6 ✅ 已核实(2026-06) | 全站仅 **Supabase 匿名 auth**(signInAnonymously，做去重身份**非授权**)，**无登录/账号/admin 角色**；唯一特权闸 = `CRON_SECRET` | 管理页无现成 user-auth 可挂 | **新建独立闸**：新 env(`BLOG_ADMIN_SECRET` 或 `ADMIN_USER`+`ADMIN_PASS`)，`proxy.ts` 中间件加 **HTTP Basic Auth**(浏览器原生、~10 行、免登录 UI)守 `/admin/blog`；**server action 独立再校验密钥**(不靠 UI/路由)；路由 `/admin/*` + robots disallow + noindex。 |
| R7 | match_id/team_id 外键完整性（重命名/删除） | 死链 | 优雅降级（404 或"赛事已结束"）；slug 归一一致 |
| R8 | 自动发布错稿 | 线上事故 | 一键撤下 + 题材白名单（高危转人工）+ 软闸低置信转隔离 |
| R9 | 生成成本/配额 | 超支/限流 | Gemini 15 RPM 节流；每次少批几篇；DeepSeek Pro 异步无延迟压力 |
| R10 ⚠️ 实测(2026-06-19，CodeX 建议引入 GDELT 后) | 外部信号源从**共享代理 IP 实测即 429**：GDELT 限 ≤1req/5s（连/单发都 429），Google explore 同样 429 | 信号源在本机/共享 IP 不稳 | **deploy-env 验证可达性**(Vercel/海外干净 IP)；统一 ≤1req/5s + 缓存 + **best-effort 降级**(失败不阻塞，赛程模板兜底)；信号抓取放在能直连 Google/GDELT 的环境 |

---

## 14. 分阶段实施计划 + 工时

| 阶段 | 内容 | 工时 | 可独立上线 |
|---|---|---|---|
| **P0 前置** | ✅ 全部已核实：R1(快照就位)/R2(免费模板兜底+可选 SerpApi)/R6(新建 Basic Auth 闸)；唯一动手项 = 扩展 `getMatchSwing` 返回 `p_champion` + 1x2 Δ | 0.5d | — |
| **P1 数据层** | `blog_entries` migration + RLS + GRANT；类型与读写 helper | 1d | ✓ |
| **P2 检测器** | 需求门控（Trends/赛程模板）+ 概率 Δ diff → 生成队列 | 1.5–2d | ✓（先 log 候选不出稿，验证选题质量） |
| **P3 生成 + 闸** | `gen-blog` cron（Gemini-en/DeepSeek-zh）+ 硬闸（数字对账/红线）+ 软闸（异 provider）+ 题材白名单 | 2–3d | ✓（先全部进 needs_review，人工看质量再开自动发） |
| **P4 页面** | `/blog` + `/blog/[slug]`（EN+ZH）+ schema + sitemap + OG mode=blog | 1.5d | ✓ |
| **P5 入口** | match 页 / team 页"相关事件解读"块 + JSON-LD 关联 | 0.5d | ✓ |
| **P6 管理页** | 极简后台（§11）+ 鉴权 + server actions | 1–1.5d | ✓ |
| **合计** | | **≈7–10d** | 建议按阶段灰度：P2 先验选题 → P3 先全进隔离区 → 质量稳后开自动发 |

**灰度策略 ★**：上线初期**关闭自动发布**（所有稿进 `needs_review`），人工看一周确认硬闸/软闸质量与选题相关性，再逐题材开放自动发（先 result/probability，后其余）。

---

## 15. 红线（与全站一致）

- 不用 odds/bet 词族；不诱导真实博彩；过 `findBannedTermsStrict`。
- 不诽谤/侮辱真人；争议判罚/纪律/伤病/政治题材**强制人工**。
- 不整段拷贝来源、不截图转载第三方内容（版权）。
- 概率/比分**只用引擎值**，禁止 AI 造数字。
- 无需求信号不出稿、无数据锚定不自动发（量的纪律 = Google 防线）。

---

> **下一步候选**：① 出 EN/ZH 两套生产级提示词模板（定调子）；② 从 P0 前置核查开始（先解决 R1 球队快照这个硬骨头）。
