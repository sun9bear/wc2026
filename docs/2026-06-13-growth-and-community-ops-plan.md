# wc2026.cool 增长与社区运营执行方案

| 项目 | 内容 |
|---|---|
| 文档日期 | 2026-06-13 |
| 适用项目 | `https://www.wc2026.cool/` |
| 目标 | 用合规、透明、可持续的方式，为世界杯预测工具获取搜索流量、社媒曝光、社区讨论和自然转发 |
| 核心渠道 | X / Reddit / Google Search / 私域群聊转发 |
| 重要边界 | 不做账号伪装、不做自动化养号、不买赞转发、不组织互赞、不刷屏私信、不隐藏项目关联 |

---

## 0. 本次会话核查增量（2026-06-13 · 5-agent 实地核查 + 逐字核验）

> 本节是本次会话相对本文档其余章节的**新增结论与修正**；下文 §1–§16 仍然有效，本节只补它们没覆盖或需更新的点。
> 协作模型一句话定死：**我做内容+策略引擎（起草每条帖/评论/图卡文案/标题/日历、社区与规则地图），你本人作为真实人类发布。** 这才是正确的"养号"——靠真实参与，不是模拟。可在你在场逐条审核批准下用浏览器代发某条已批准内容；不做无人值守的多周自动化养号。
> （注：`feat/legal-pages` 分支另有 `docs/GROWTH-PLAN.md` 覆盖站内产品修复与分发弹药细节，与本文件互补；本文件当前在 `main` 工作树、未提交。）

### 0.1 爆发力重排：第一爆款是 /match 的 AI 毒舌前瞻，不是计算器

实测 7 个页面的「可分享性 / 一眼看懂」评分（0-10）：

| 页面 | 可分享性 | 一眼看懂 | 最强截图时刻 |
|---|---:|---:|---|
| **/match AI 前瞻** | **8** | 7 | 毒舌金句 +「86%🔥 vs 3%❄️」胜负反差 |
| **/calculator 第三名计算器** | **7** | 7 | 你的队翻成 ✅IN / ❌OUT 的那一刻 |
| /forecast 概率页 | 6 | 6 | 夺冠榜（西班牙 20.8%）+ AI 锐评 + 异动榜 |
| /home 首页 | 4 | 8 | 弱（只有 CTA，无 payoff） |
| /watch 观赛指南 | 4 | 8 | 低（实用无情绪） |
| /combo 串关 | 3 | 4 | 弱（且 ×N 观感偏盘口） |
| /leaderboard | 3 | 6 | 弱（9 个陌生人=负社会证明） |

- **第一爆款 = /match 的 AI 毒舌前瞻**（本文档 §2.1 把 calculator 列为唯一核心，需修正为"双引擎"）：一句"瑞士进世界杯小组赛是人生少数确定的事，和死亡、税收、扎卡吃黄牌并列"本身就是转发燃料，配 86%🔥vs3%❄️ 零数学门槛可站队骂战。
- **第二爆款 = calculator 的 IN/OUT 判决**：更私人、可拥有，是 6/22-27 叙事主轴；短板是要手动点完才到达情绪点。
- **🔴 最高杠杆单点（窗口期前唯一必做的代码改动）：两台引擎都没有"一键带图分享"出口。** /match 金句卡、/calculator IN/OUT 卡都不能一键生成图。把 §3/§7/§11 的"分享图"任务里这两张卡提到最高优先级——其余分享图次之。后台 `/api/og` 摆动卡管线可直接复用。

### 0.2 竞品空白已核实（独家性确认，可正面打）

全网**无第二个**"双语 + 专门第三名 + 翻转剩余赛果"的 scenario calculator。最接近的两个都有硬伤：

- `worldcuppass.com/simulator`：免费免注册，但第三名只是整届 104 场大 bracket 的附属输出、埋得深；**英文单语**。
- `tool.teamzlab.com`：专门第三名、有分界线高亮，但要**手动输每队积分/净胜/进球**而非翻转比赛结果（不能"我队末轮 2-0 取胜能否出线"一键问答）；**英文单语**。
- FIFA 官方无公开交互工具；FotMob / Sofascore 只有静态积分榜、无 what-if。

→ 对外文案可直接打这句独家性：*"the only free bilingual tool where you flip remaining results and watch the 8-best-third cutline move live."*

### 0.3 海外华人分发面（本文档原缺，对"海外华人"定位最关键）

本文档 §5/§6 聚焦 X/Reddit/Google/群聊；针对核心受众"海外华人"还有更对口、且现有计划完全没写的面：

| 面 | 为什么对口 | 怎么发 |
|---|---|---|
| **小红书** | 拿了 2026 世界杯转播权、平台正主动推足球内容、1 亿+ 球迷、海外年轻华人活跃 | 双语计算器**录屏 demo**（笔记+视频）+ 主页挂链接，#世界杯2026 #最佳第三名 #晋级 |
| **微博** | 实时、**可外链**（朋友圈不可） | 争议赛果后立刻发"日本/韩国还能出线吗？自己算→链接" |
| **懂球帝 动态** | 500 万日活、数据控、中文无同类工具 | 解释 8-best-third 分界线的分析帖 + 链接 |
| **Telegram 体育频道** | 转发链天然扩散、链接自动出预览卡 | 末轮"谁需要什么才能出线"+ 计算器链接 |

纪律同 X/Reddit：先给价值再附链接、透明作者身份、绝不提 betting 词。

### 0.4 具体 subreddit 地图（细化 §6.2 的泛泛"社区类型"）

按价值 × 合规度排序的**具体清单**：

| subreddit | 体量 | 自宣传规则 | 合规发法 |
|---|---|---|---|
| **r/dataisbeautiful** | ~2200 万 | OC 是核心、鼓励 | **最合规出口**：发 `[OC]` 静态信息图"2026 第三名出线所有路径"，**链接放首评**注明数据源 + "也做了交互版" |
| **r/worldcup** | ~93 万 | 较松、欢迎赛事工具 | 窗口期**最高价值**：文字帖讲透赛制 + URL 放首评 |
| 国家队 sub | 5-15 万 | 社区优先、欢迎免费工具 | r/ussoccer / r/CanadaSoccer / r/Selecao / r/Azzurri，每个**单独重写**、卡该队末轮赛前发 |
| r/MLS | ~97 万 | 无明文、按 Reddit 通则 | 框成"追 MLS 球员的国家队出线" |
| **r/soccer** | ~870 万 | **明令禁自宣传** | **只在 match thread 评论里答题带一句**，绝不发帖 |

- **automod / karma 闸**：r/soccer 约 <50 karma 或账号 <30 天自动删、且必须带 flair；新号/低 karma 的链接帖在多数版被自动删。**铁律：链接永远放首评，标题/正文不放链接；绝不跨版复制同一段文案。**
- 你的 Reddit 老号零 karma → 必须先真实评论养 7-14 天再发帖（见 §6.3，本节确认其必要性）。

### 0.5 峰值 SEO 关键词 + 结构化数据（细化 §11 的"SEO metadata"）

末轮暴涨、竞争低的导航/信息词（卡进 /calculator 的 title/H1/meta）：

- EN：`world cup 2026 third place calculator` / `best third place world cup 2026` / `can [team] still advance world cup 2026` / `8 best third place teams world cup 2026` / `world cup 2026 scenario calculator` / `world cup 2026 tiebreaker rules`
- ZH：`世界杯 最佳第三名 晋级` / `世界杯2026 第三名 出线条件` / `世界杯积分榜 第三名 排名`
- H1 用 `World Cup 2026 Third Place Qualification Calculator`；加 **JSON-LD `WebApplication`**（description 覆盖 8-best-third 规则）。Google 收录要 3-7 天，**6/22 前改完才赶得上末轮搜索脉冲**。

### 0.6 平台政策硬事实（强化 §4 / §14 的"为什么不能养号"）

- **X**《Authenticity》明禁：脚本化/自动化运营、伪装来源的账号、协调刷互动（Likes/Reposts/Follows）。规模：2024 封约 **8 亿**账号，2025 下半年再封数亿，2026/2 新一轮反 AI-bot 清洗。
- **Reddit** 禁多号刷量 / 求票 / 组织转发（vote manipulation = 全站封）；检测是 **ML + IP/设备指纹 + 注册同期 + 关系图谱**——拟人化单个号没用，出卖你的是**账号之间的关系**。
- **FTC**：推广自有产品是最强"material connection"，须 *clear & conspicuous* 披露（`#ad`/明示作者身份），**不能只藏在 profile**。
- **封禁规避按"整簇"处理**：主号 + 养的号 + 备份一起端，且不论何时创建。
- 结论一句话：5 周窗口里"自动养号 + 造转发"= 用"随时团灭"去赌"一次短命、低转化的流量泡"，ROI 算不过来。

### 0.7 合规现状核查（更新 §4 红线的当前状态）

逐字核验线上英文面（2026-06-13）：

- **/match 页：禁词全无**（odds / bet / parlay / payout / multiplier… 实测 NONE FOUND）。
- **/combo 页**：仅"combined ×N / If correct +points"——**字面禁词无**，只是"×"符号观感偏盘口。

→ 即**当前线上无字面违规**（此前担心的 parlay/payout/multiplier 是抓取模型的转述，非真实页面文本）。唯一可做：给 /combo 的 ×N 补一句中性解释（"积分奖励 ×N · 社区实时"），优先级低。

### 0.8 把通用 30 天计划锚定到 6/22-27 黄金窗口（补 §8）

引擎不是均匀 30 天，而是**小组赛末轮（6/22-27）"我的队还有戏吗"需求峰值**——当**发射日**办，不是日常发帖。

| 日期 | 你做（真人发布） | 我提前备好的弹药 |
|---|---|---|
| 6/13-19 | Reddit 老号每天 3-5 条真实评论养号；X 起步发每日栏目 + 大号下高信息回复 | 评论口吻范例、X 栏目模板 |
| 6/14-20 | 只备料不发 | OC 图卡文案 + 标题变体、各版首帖文案、scenario 帖模板 |
| 6/21 | 发 1 条 30 秒录屏 Short（情景翻转）到 YouTube/TikTok 预热 | 分镜 + 字幕文案 |
| **6/22-23** | r/dataisbeautiful `[OC]` 图 + r/worldcup 文字帖；小红书双语 demo；微博实时帖 | 全部文案 + 首评模板 |
| **6/24-27** | 各国家队 sub 定制 scenario 帖（赛前发）；X scenario 图卡刷全 12 组；终场 90 秒内 QT 赛果+出线影响 | 每个 bubble 队的定制文案 |

---

## 1. 一句话定位

`wc2026.cool` 不是一个普通赛程站，而是一个面向球迷的 **免费世界杯预测与出线情景工具**：

> 30 秒预测比赛、算出线、看概率、和朋友比谁更懂球。无需注册，纯娱乐积分，无现实价值。

对外传播时，主打三件事：

1. **我的队还有戏吗？**  
   用出线计算器解决 48 队赛制下的真实困惑。

2. **今晚谁最可能爆冷？**  
   用概率、热度、最可能比分制造讨论。

3. **来和朋友比一把。**  
   用好友擂台、排行榜、战报图带来自传播。

---

## 2. 当前站点判断

### 2.1 已经有吸引力的部分

| 页面 / 功能 | 吸引力 | 适合流量来源 | 判断 |
|---|---|---|---|
| `/calculator` 出线计算器 | 很强 | X、Reddit、Google、群聊 | 这是最有爆发力的核心页面 |
| `/forecast` 概率页 | 强 | X、Reddit、搜索 | 适合日更争议话题 |
| `/match/[id]` 单场页 | 强 | 赛前社媒、赛后复盘 | 每场比赛都能产出内容 |
| `/watch` 在哪看比赛 | 中到强 | Google Search | 搜索需求高，但需要持续校验准确性 |
| `/league` 好友擂台 | 强 | 群聊、私域、老用户邀请 | 是转化和裂变核心 |
| `/leaderboard` 排行榜 | 中 | 站内留存、社媒截图 | 需要更多可晒设计 |
| `/me` 我的战绩、签到、成就 | 中 | 留存 | 不是首波流量入口，但能增强回访 |

### 2.2 当前主要短板

1. **可分享资产不足**  
   现在页面功能已经有了，但用户完成预测或计算后，没有足够强的“晒出去”的理由。

2. **SEO 页面颗粒度不够**  
   应该让每个球队、每场焦点战、每个小组都有独立可搜索、可分享的页面标题和描述。

3. **社媒传播缺少固定栏目**  
   需要把每日内容产品化，例如“今日冷门观察”“出线警报”“概率异动榜”。

4. **X / Reddit 不能走灰产式养号**  
   这会带来封号、域名被社区拉黑、品牌反噬。必须走真实参与、透明作者身份和高价值内容路线。

---

## 3. 流量爆发优先级

### P0：出线计算器

目标：让用户看到后立刻想点、想改、想分享。

必须优化：

- 每个球队有独立 URL，例如 `/calculator?team=japan`。
- 页面顶部给一句明确结论：
  - `日本当前 F 组第 2，模型出线概率约 80%。`
  - `如果下一场打平，第三名竞争会变得危险。`
- 增加两个分享动作：
  - `复制结论`
  - `生成图片`
- 增加 Open Graph 图：
  - 标题：`日本还能出线吗？`
  - 副标题：`当前第 2 · 出线概率 80% · 试试你的剧本`
  - URL：`wc2026.cool/calculator?team=japan`

传播角度：

- `Can Japan still qualify? I built a free scenario calculator.`
- `48-team format is confusing, so I made a tool to test every third-place scenario.`
- `你的主队还有戏吗？30 秒算一下。`

### P1：概率页 `/forecast`

目标：每天制造可争论的榜单。

固定栏目：

- `夺冠概率 Top 12`
- `出线概率异动`
- `今晚最可能比分`
- `今日冷门观察`

必须优化：

- 标出更新时间。
- 标出模型说明，避免被理解成确定性预测。
- 给每个榜单生成分享图。
- 给每个球队跳转到对应出线计算器。

### P1：单场比赛页

目标：每场比赛都成为一个内容素材库。

建议结构：

- 赛前前瞻
- 社区热度
- 模型概率
- 最可能比分
- 一键预测
- 一键生成赛前图
- 赛后自动小结

每场比赛的运营节奏：

| 时间 | 内容 |
|---|---|
| T-12 小时 | 发赛前问题：`Brazil vs Morocco, upset watch?` |
| T-3 小时 | 发概率图：胜平负、最可能比分 |
| T+15 分钟 | 发赛果与命中情况 |
| T+2 小时 | 发出线影响：这场结果如何改变小组形势 |

### P2：好友擂台

目标：把单人访问变成群体游戏。

建议优化：

- 首页强入口改成 `创建好友擂台`。
- 创建后自动生成邀请图，而不是只给链接。
- 邀请图文案：
  - `我建了一个 2026 世界杯预测擂台，来比谁更懂球。`
  - `口令：WC-XXXX`
  - `无需注册，进来先拿 1000 积分。`

### P2：在哪看比赛

目标：拿搜索流量。

建议优化：

- 按国家/地区分组。
- 每条写更新时间。
- 链接到官方或持权平台。
- 增加英文版本。
- 不使用盗播、破解、灰色 VPN 诱导等内容。

---

## 4. 合规边界

### 4.1 不能做的事

以下行为不做：

- 模拟真人自动刷 X / Reddit。
- 自动点赞、关注、转发、评论。
- 批量私信推广。
- 买转发、买 upvote、互赞互转。
- 使用小号伪装普通用户推荐网站。
- 隐藏“我是项目作者/运营者”的关系。
- 在无关话题下硬塞链接。
- 用热门 hashtag 引流到无关内容。

原因：

- X 的 Authenticity 规则禁止用不真实行为操纵内容发现和放大，包括批量无关回复、重复链接、协调点赞转发、自动化互动等。
- Reddit 规则要求真实参与社区、遵守 subreddit 规则，不要 spam 或做内容操纵。Reddit 自推广指南也明确反对隐藏关联、买票、求票、让别人代发推广链接。

### 4.2 可以做的事

可以做，并且应该系统化：

- 透明身份运营。
- 人工筛选话题、人工参与讨论。
- 发布高价值工具、图表和观点。
- 回复别人问题时给完整答案，必要时再附工具链接。
- 每条推广内容都能独立提供价值，即使用户不点链接也有收获。
- 对每个 subreddit 先读规则，不确定时先发 modmail 询问。
- 每次外部发布前由你确认内容。

### 4.3 对外身份建议

不要伪装成无关球迷。建议用这种身份：

> I’m building a free fan-made World Cup prediction and qualification tool. No signup, no money, just for fun. I’ll share model updates and scenario calculators during the tournament.

中文：

> 我在做一个免费的球迷自制世界杯预测/出线工具，无需注册、纯娱乐积分。之后会持续分享出线情景、概率异动和赛前小工具。

---

## 5. X 运营方案

### 5.1 账号定位

账号不要只发广告，要变成一个“世界杯数据工具号”。

主页建议：

- Name：`WC 2026 Predictor` 或 `World Cup Scenario Lab`
- Bio：
  - `Free fan-made World Cup 2026 predictor. Qualification calculator, match probabilities, and friend leagues. Not affiliated with FIFA.`
- Link：`https://www.wc2026.cool/?utm_source=x&utm_medium=bio`
- Pin：
  - 一条介绍工具的线程，含 3 张图：出线计算器、概率页、好友擂台。

### 5.2 X Premium 的使用方式

X Premium 可以帮助提升基础可见度，但不能替代内容质量。

正确用法：

- 发更长的解释线程。
- 使用更清晰的图文。
- 回复大号热门帖时给高质量补充，不硬塞链接。
- 用 Analytics 观察展示、互动、链接点击。
- 把表现好的帖子改写成第二天 Reddit 长帖。

错误用法：

- 高频回复所有热门帖。
- 每条回复都带链接。
- 用无关热门 hashtag。
- 只发复制粘贴内容。

### 5.3 内容栏目

| 栏目 | 频率 | 目标 | 示例 |
|---|---:|---|---|
| Tonight's Upset Watch | 每天 1 条 | 引发争论 | `Brazil 56%, Morocco 18%. Is this the trap game?` |
| Can They Still Qualify? | 每天 2-4 条 | 推出线计算器 | `Can Japan still qualify if they draw Sweden?` |
| Probability Movers | 每天 1 条 | 展示模型变化 | `Biggest qualification movers after Day 3` |
| Most Likely Scores | 每天 1 条 | 赛前预测 | `Germany vs Curacao: top model scores` |
| Friend League Challenge | 每周 2 条 | 推擂台 | `Create a private league before tonight's matches` |
| Post-match Impact | 每场焦点战后 | 追热点 | `USA 4-1 Paraguay changed Group D fast` |

### 5.4 每日发布节奏

按 Asia/Shanghai 运营，兼顾美国时区：

| 时间 | 动作 |
|---|---|
| 09:00 | 查看前一晚比赛结果，生成赛后出线影响 |
| 11:00 | 发 `Probability Movers` |
| 15:00 | 发第一场焦点战赛前图 |
| 19:00 | 发 `Can they still qualify?` |
| 22:00 | 发 `Tonight's Upset Watch` |
| 比赛后 15-30 分钟 | 发赛果影响和下一场悬念 |

每日互动：

- 5-10 条高质量回复。
- 只在 1-2 条回复中带链接。
- 更多时候只提供结论图或一句分析。
- 遇到别人问“怎么算出线”，再给工具链接。

### 5.5 X 文案模板

#### 模板 A：出线计算器

```text
Can Japan still qualify from Group F?

I made a free 2026 scenario calculator for the new 48-team format.

Current model:
Japan: 2nd in Group F
Advance chance: ~80%

Try your own scenario:
https://www.wc2026.cool/calculator?team=japan&utm_source=x&utm_medium=post&utm_campaign=qualifier_japan
```

#### 模板 B：冷门观察

```text
Tonight's upset watch:

Brazil vs Morocco

Model:
Brazil 56%
Draw 26%
Morocco 18%

Most likely scores:
1-1, 1-0, 2-0

Morocco is not a huge favorite, but this is exactly the kind of match where the timeline gets loud.
```

#### 模板 C：透明推广

```text
Small builder note:

I’m building a free fan-made World Cup 2026 predictor:
- no signup required
- no real-money value
- qualification calculator
- friend leagues
- match probabilities

Feedback welcome:
https://www.wc2026.cool/?utm_source=x&utm_medium=post&utm_campaign=builder_intro
```

#### 模板 D：赛后影响

```text
USA 4-1 Paraguay changes Group D quickly.

What changed:
- USA goal difference is now a real cushion
- Paraguay needs points fast
- Australia vs Turkey becomes more important than it looked

Group scenarios:
https://www.wc2026.cool/calculator?team=united-states&utm_source=x&utm_medium=post&utm_campaign=postmatch_usa_paraguay
```

---

## 6. Reddit 运营方案

### 6.1 Reddit 的基本策略

Reddit 不是广告平台，尤其不喜欢新账号突然发链接。正确策略是：

1. 先评论，后发帖。
2. 先提供完整内容，后附链接。
3. 先读规则，不确定就问 mod。
4. 明确披露：`I built this` / `我是作者`。
5. 控制自推广比例，保持 90% 以上是真实参与。

### 6.2 目标 subreddit 类型

优先级从高到低：

| 类型 | 示例方向 | 内容方式 |
|---|---|---|
| 国家队社区 | USMNT、日本、韩国、加拿大、墨西哥、英格兰等 | 针对该队出线情景 |
| 世界杯社区 | worldcup、football/soccer 相关社区 | 赛制解释、工具分享 |
| 数据/可视化社区 | dataisbeautiful、sports analytics 方向 | 概率变化、图表 |
| 本地城市社区 | host city 社区 | 比赛在哪看、球迷活动、赛程 |
| 新手问答社区 | NewToReddit 不发推广，只学习规则 | 熟悉平台规则 |

每个社区发帖前必须检查：

- 是否允许 self-promotion。
- 是否允许工具链接。
- 是否要求 flair。
- 是否禁止 AI 内容。
- 是否禁止低 karma 账号发链接。
- 是否需要提前联系 mod。

### 6.3 Reddit 前 14 天动作

| 天数 | 动作 |
|---|---|
| D1-D3 | 只评论，不放链接。回答赛制、球队、观赛问题 |
| D4-D7 | 继续评论，收藏允许工具/原创内容的 subreddit |
| D8-D10 | 发 1 篇无链接长帖：解释 48 队赛制和第三名规则 |
| D11-D14 | 在合适社区发第一篇透明工具帖 |

### 6.4 Reddit 发帖模板

#### 模板 A：高价值工具帖

```text
Title:
I built a free 2026 third-place qualification calculator because the 48-team format is confusing

Body:
The new World Cup format makes the third-place race harder to follow:

- 12 groups of 4
- top 2 from each group advance
- 8 of the 12 third-placed teams also advance
- goal difference and group results can change the picture very quickly

I built a free fan-made calculator where you can change remaining group results and see:

- group standings
- third-place table
- whether a team is currently safe
- how specific results change the path

No signup, no money, just a fan tool.

Disclosure: I built this. If links are not allowed here, mods please remove and I’ll keep the explanation only.

Link:
https://www.wc2026.cool/calculator?utm_source=reddit&utm_medium=post&utm_campaign=third_place_calculator
```

#### 模板 B：国家队社区

```text
Title:
Japan’s Group F path after Matchday 1: what result matters most now?

Body:
I ran a few simple scenarios for Japan:

- A win in the next match likely makes qualification very comfortable
- A draw keeps Japan alive but makes third-place math important
- Goal difference may matter more than people expect in the 48-team format

I built a free scenario calculator for this because I kept getting lost in the third-place table.

Disclosure: I’m the builder. No signup, no paid anything, just a fan-made tool.

Japan page:
https://www.wc2026.cool/calculator?team=japan&utm_source=reddit&utm_medium=post&utm_campaign=japan_group_f
```

#### 模板 C：不带链接的安全评论

```text
The confusing part is not just the group table. In the 48-team format, finishing third can still be enough, but only 8 of the 12 third-place teams advance.

So for a team sitting third, the important things are:
1. points
2. goal difference
3. goals scored
4. how other groups compare

That is why a boring draw in another group can suddenly matter a lot.
```

### 6.5 Reddit 风险控制

不要：

- 跨多个 subreddit 复制同一篇文章。
- 每个评论都放链接。
- 用标题党。
- 请求 upvote。
- 让朋友帮忙顶帖。
- 使用多个账号互相评论。

可以：

- 同一主题为不同社区重写。
- 主帖内完整解释，不靠链接补充。
- 被 mod 删除后礼貌询问原因，不争辩。
- 把 Reddit 用户反馈带回产品迭代。

---

## 7. 内容资产清单

上线前应补齐以下素材：

| 资产 | 用途 | 优先级 |
|---|---|---|
| 出线结论图 | X / Reddit / 群聊 | P0 |
| 今日概率榜图 | X 日更 | P0 |
| 单场赛前图 | 焦点战 | P0 |
| 赛后影响图 | 赛后追热点 | P1 |
| 好友擂台邀请图 | 私域裂变 | P1 |
| 排行榜炫耀图 | 留存和分享 | P1 |
| 站点介绍长图 | Pin / profile | P2 |

### 7.1 分享图格式

建议尺寸：

- X：`1600x900`
- Reddit：`1200x900` 或直接正文图
- 私域群聊：`1080x1440`

每张图必须包含：

- 队名 / 比赛名
- 核心结论
- 时间戳或更新时间
- `wc2026.cool`
- `Fan-made · For fun only`

避免：

- FIFA 官方 logo。
- 世界杯官方视觉。
- 真实博彩词汇。
- 夸张确定性承诺。

---

## 8. 30 天执行计划

### Week 1：基础搭建

目标：让产品具备传播素材能力。

产品任务：

- 加出线计算器分享图。
- 加单场比赛页分享图。
- 加 UTM 参数规范。
- 为 `/calculator`、`/forecast`、`/watch` 补齐 metadata。
- 给 `/watch` 增加更新时间和来源。

运营任务：

- 完成 X profile、bio、pin。
- Reddit 账号完善头像、简介，但不要写得像营销号。
- 建一个内容台账：日期、平台、主题、链接、数据。

输出：

- X 5 条原创帖。
- Reddit 10-20 条真实评论。
- 不急着在 Reddit 发推广链接。

### Week 2：第一轮分发

目标：验证哪些内容有点击和互动。

动作：

- 每天 X 2-4 条。
- Reddit 发 1 篇赛制解释帖，可不带链接。
- 找 5 个国家队社区，记录规则。
- 针对当天焦点战发概率图。

观察指标：

- X 展示量。
- X 互动率。
- 链接点击率。
- Reddit 评论质量。
- 是否有自然收藏/转发。

### Week 3：工具帖上线

目标：开始透明推广。

动作：

- 在允许原创工具的社区发第一篇工具帖。
- 每个国家队只发该队相关内容。
- 开始推广好友擂台。
- 将表现最好的 X 帖改写成 Reddit 长帖。

注意：

- 不要同一天在多个社区发同一个链接。
- 每篇都披露作者身份。
- 被删除就停，不要重发。

### Week 4：放大与复盘

目标：形成固定栏目。

动作：

- 固定 3 个表现最好的内容栏目。
- 做一版首页调整：把表现最好的入口放首屏。
- 做一次 SEO 检查。
- 根据数据决定是否做英文/西语深度版本。

复盘问题：

- 哪个页面带来最多新用户？
- 哪个内容带来最多首次预测？
- 哪个社区最友好？
- 哪种图最容易被转发？
- 用户是否创建好友擂台？

---

## 9. 每日运营 SOP

每天 30-60 分钟即可执行。

### 9.1 早间

1. 看昨日比赛结果。
2. 更新概率异动。
3. 生成 1 张赛后影响图。
4. 检查站点关键页面是否正常。
5. 记录前一天 X / Reddit 数据。

### 9.2 赛前

1. 选 1-2 场焦点战。
2. 生成赛前概率图。
3. 写一条问题式 X：
   - `Is this the upset match?`
   - `What result changes Group F the most?`
4. 找相关讨论帖，人工回复 3-5 条。

### 9.3 赛后

1. 发赛果影响。
2. 如果结果爆冷，立刻发：
   - 出线变化。
   - 概率变化。
   - 下一场关键战。
3. 更新相关球队计算器链接。

### 9.4 晚间

1. 整理明天赛程。
2. 准备 2 条 X 草稿。
3. 准备 1 条 Reddit 长帖或评论素材。
4. 记录待优化产品点。

---

## 10. 数据与指标

### 10.1 UTM 规范

统一格式：

```text
?utm_source=x&utm_medium=post&utm_campaign=qualifier_japan
?utm_source=reddit&utm_medium=post&utm_campaign=third_place_calculator
?utm_source=reddit&utm_medium=comment&utm_campaign=group_f_reply
```

### 10.2 核心指标

| 阶段 | 指标 |
|---|---|
| 曝光 | X impressions、Reddit post views |
| 点击 | UTM sessions、CTR |
| 激活 | 首次预测、首次计算、首次签到 |
| 分享 | 复制链接、生成图片、下载图片 |
| 裂变 | 创建擂台、加入擂台、邀请码使用 |
| 留存 | 次日回访、连续签到、二次预测 |

### 10.3 最小 dashboard

每天记录：

| 日期 | 平台 | 内容 | 链接 | 展示 | 点击 | 首次预测 | 分享 | 备注 |
|---|---|---|---|---:|---:|---:|---:|---|

---

## 11. 产品优化排期

### 立即做

1. 出线计算器分享图。
2. 比赛页分享图。
3. `/forecast` 分享图。
4. UTM 参数与事件埋点。
5. 首页 CTA 调整：出线计算器、今日焦点、创建好友擂台。

### 1 周内做

1. 英文页面完整化。
2. 每个球队的 SEO metadata。
3. 观赛指南更新时间和来源标注。
4. 好友擂台邀请图。
5. 排行榜可晒卡。

### 2-3 周做

1. 西语版本。
2. 每场比赛的动态 OG 图。
3. 自动生成每日内容包。
4. 简单后台：今日可发内容、待审核文案、热门比赛。

### 赛中持续做

1. 赛后 15 分钟内出影响图。
2. 每日概率异动。
3. 重点球队出线专题。
4. 用户反馈驱动页面微调。

---

## 12. 我可以协助的运营方式

可以协助：

- 每天生成 X / Reddit 草稿。
- 根据当天比赛生成图片文案。
- 帮你重写成英文、中文、西语风格。
- 检查 Reddit 社区规则并给出发帖建议。
- 做内容排期表。
- 做数据复盘。
- 在你明确批准具体内容和目标平台后，协助发布。

不能协助：

- 偷偷登录并模拟真人长期操作。
- 自动刷互动。
- 隐藏身份做软广。
- 引导别人转发、点赞、upvote。
- 绕过平台风控。

实际推荐协作模式：

1. 我每天生成 `今日内容包`。
2. 你挑选要发的内容。
3. 我按平台改写。
4. 你确认。
5. 再发布或排期。
6. 第二天我根据数据复盘。

---

## 13. 第一批可直接使用的内容

### 13.1 X Pin

```text
I’m building a free fan-made World Cup 2026 predictor.

What it does:
- 30-second match picks
- third-place qualification calculator
- live group scenarios
- match probabilities
- friend leagues

No signup required. No real-money value. Just for fun.

Try it:
https://www.wc2026.cool/?utm_source=x&utm_medium=pin&utm_campaign=launch
```

### 13.2 X 今日概率榜

```text
World Cup 2026 title probability snapshot:

1. Spain 20.8%
2. Argentina 15.5%
3. France 11.8%
4. England 7.7%
5. Brazil 5.6%

The fun part: the new 48-team format makes paths weird fast.

Live model:
https://www.wc2026.cool/forecast?utm_source=x&utm_medium=post&utm_campaign=forecast_snapshot
```

### 13.3 Reddit 工具帖标题备选

```text
I built a free 2026 World Cup third-place qualification calculator
```

```text
The 48-team format is confusing, so I made a tool to test qualification scenarios
```

```text
Which third-place teams advance? I built a free fan-made calculator
```

### 13.4 Reddit 评论

```text
The third-place table is the part that makes this format hard to follow.

Finishing 3rd is not automatically bad, but only 8 of the 12 third-place teams advance. That means a result in another group can change your team's path even if your team is not playing.

The safest teams are usually the ones with 4 points and decent goal difference. Teams on 3 points can get nervous quickly.
```

---

## 14. 风险清单

| 风险 | 触发方式 | 处理 |
|---|---|---|
| X 被限流 | 高频重复链接、无关回复、滥用 hashtag | 降低链接比例，提高原创图文 |
| Reddit 删帖 | 社区不允许 self-promo | 停止重发，联系 mod 或换社区 |
| 域名被社区厌恶 | 隐藏身份、刷屏 | 永远透明披露，少发链接 |
| 版权/商标风险 | 使用 FIFA 官方视觉 | 使用自制中性视觉 |
| 博彩误解 | 文案像投注平台 | 强化免费、纯娱乐、积分无价值 |
| 数据不准 | 观赛渠道或赛程变动 | 标更新时间和来源 |
| 内容不可持续 | 每天手写太多 | 固定栏目 + 自动生成草稿 + 人审 |

---

## 15. 参考来源

- X Authenticity Policy: https://help.x.com/en/rules-and-policies/authenticity
- X Premium FAQ: https://help.x.com/en/using-x/x-premium-faq
- Reddit Rules: https://redditinc.com/policies/reddit-rules
- Reddit Self-Promotion Guide: https://www.reddit.com/r/reddit.com/wiki/selfpromotion/
- FIFA World Cup 2026 official tournament page: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026
- wc2026.cool homepage and product pages: https://www.wc2026.cool/

---

## 16. 最终建议

不要把增长押在“养号技巧”上。这个项目真正有机会爆的是：

1. **出线计算器的即时实用价值**。
2. **概率榜带来的争论**。
3. **焦点战赛前/赛后的时效内容**。
4. **好友擂台带来的群体传播**。

执行上先做小闭环：

> 每天 1 个出线问题 + 1 张概率图 + 1 个焦点战观点 + 5 条真实互动 + 1 次数据复盘。

坚持 2 周后，用数据决定放大哪个栏目，而不是靠感觉猜。
