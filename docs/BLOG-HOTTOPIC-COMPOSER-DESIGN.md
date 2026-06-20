# 热点解读撰写器 + 自动选题/起草 — 设计文档

状态：设计已与用户确认（2026-06-20），待实现。
关联：[[BLOG-EVENT-COMMENTARY-DESIGN]]（自动比赛解读管线，本功能复用其 `blog_entries` / 页面 / sitemap / IndexNow / /admin 基建）。

## 0. 目标与范围

**目标**：让运营者把 X（及其他）上的世界杯热点话题，快速做成**图文混排**的解读文章引流。

**两部分**：
- **A（手动撰写器）**：运营者在 /admin 贴「素材清单 + 角度」→ 大模型写双语正文并自动排版（插素材标记）→ 预览微调 → 人工发布。
- **B（自动选题 + 起草）**：定时探测热门 WC 话题 → 推到后台「选题队列」→ 对每个话题自动起草解读草稿 → 运营者挑推文/配图、定版、发布。

**明确不做（已与用户确认）**：自动搜索/爬取 X + 自动截图主贴和热门回帖。原因：① X API 读取受限且贵、非 API 即违反其反爬 ToS 且技术脆；② 批量截图转载 = 规模化复制他人版权内容；③ 热门回帖多为素人 → 未经同意批量发布第三方个人数据（隐私/GDPR）；④ 自动截图聚合页是 Google 判低质/掉收录的典型。
**护栏原则**：自动化只放在「选题 + 起草」这一侧（安全）；「转载哪条推文、配什么图」这类涉权/涉判断的事，永远人工。

## 1. 架构取舍

**复用 `blog_entries` + `source='manual'`**（已确认），不新建表。手动文章与自动文章同列于 /blog、同详情页渲染、同进 sitemap / IndexNow / /admin 列表。仅给 `blog_entries` 加列 + 新增一张选题队列表（仅 B 用）。

## 2. 数据模型

**迁移 0011**（`blog_entries` 扩列）：
- `source text not null default 'auto'`，取值 `'auto' | 'manual'`。手动文章不走 prob_delta 管线。
- `assets jsonb`：有序素材数组（手动文章用）：
  ```
  [{ "type": "embed" | "image",
     "url": "https://x.com/.../status/...  或  https://<storage>/blog-media/<file>",
     "desc": "一句话说明（喂模型用，因模型看不到图/抓不到推文）",
     "caption_en": "图注(可选)", "caption_zh": "...",
     "credit": "来源/署名（image 类必填）",
     "alt": "无障碍 alt(image 类)" }]
  ```
- 正文 `body_en/body_zh` 用 `[[asset:N]]`（N 从 1 起）标记引用第 N 个素材。
- `match_id / team_ids` 对手动文章可空；`event_type` 取 `'hot_topic'`。

**slug**：手动文章由 en 标题 slugify（小写、去非拉丁、连字符）+ 去重（撞则 `-2`/`-3`）。仍喂 `/blog/[slug]`、`/zh/blog/[slug]`（同 slug 双语，与现状一致）。

**Storage**：Supabase 公开桶 `blog-media`。后台上传图片 → service_role 存桶 → 公开 URL 写进 asset.url。推文嵌入只存 URL（X 自渲染，本站不托管图）。

**迁移 0012（B 用）`topic_queue`**：
```
id uuid pk default gen_random_uuid()
title text            -- 话题（如 "Mbappé injury scare"）
signal jsonb          -- 来源信号(trends/gdelt heat、关联 match_id 等)
draft_slug text       -- 起草后写入的 blog_entries.slug_en(null=未起草)
status text           -- 'new' | 'drafted' | 'dismissed'
created_at timestamptz default now()
```

## 3. 撰写流程（A）

`/admin/blog` 加「写热点」入口 → 撰写表单：
1. 标题/角度/要点（运营者的取向，1-3 句）。
2. 素材清单（可加多条，可拖拽排序）：每条 = 类型(embed/image) + URL或上传 + **说明(必填)** + 可选图注 + image 类**来源/署名(必填)**。
3. 语言：默认双语（可单选 en 或 zh）。
4. 「生成」→ 调新 generator → 模型产出 `{title, excerpt, body(含[[asset:N]]), keywords}`（双语）→ 落 `needs_review` 草稿（`source='manual'`，assets 落库）。
5. 后台「预览」：真实渲染图文（嵌入/图都出来）→ 运营者可改正文/调素材/重新生成 → 满意「发布」。
**手动文章一律人工发布，绝不自动发**（运营者亲撰+预览+手发 = 最强人工闸）。

## 4. 生成 + 安全（A）

无 prob_delta 数据锚 → **数字接地硬闸不适用**（无引擎数字可比）。改为：
- **提示词强约束**：只用用户给的素材/说明；**不臆造事实、数字、引语、统计**；解读为主体（实质转化，不堆薄评论）；按语义把 `[[asset:N]]` 插到最合适处；涉人物负面/政治 → 中立 + `topic_flag='sensitive'`；禁博彩词；正文带 1-2 站内链接。
- **软闸（异源 LLM 复审）**：查「忠于素材 / 无臆造 / 中立 / 无博彩词 / 标记齐全」→ 结果给运营者参考（不自动拦，因人工把关）。
- 复用现有：禁博彩词扫描、`hasInternalLink` 内链检查（缺则提示，不强制重写——手动文章人工补即可）。
- **若关联某场比赛**（运营者填了 match_id 或起草来自 B 的 match 信号）：可挂 prob_delta 句作数据锚增强（可选）。

## 5. 渲染（扩 `BlogBody` / 新组件）

- `BlogBody` 解析 `[[asset:N]]` → 取 assets[N-1]：
  - `embed` → 客户端组件 `TweetEmbed`：官方 `<blockquote class="twitter-tweet"><a href="{url}">`，**全页只加载一次** `https://platform.twitter.com/widgets.js`；失败/删推降级为「查看原推 →」链接。
  - `image` → `<figure>`：`<img>`(懒加载) + 图注 + **来源/署名**（小字）。
- 现有 markdown 段落/标题/列表/内链渲染不变。
- 详情页 JSON-LD：手动文章仍 NewsArticle；`image` 资产可填进 `image` 字段（利于富结果）。

## 6. 版权护栏（写进流程，不是事后）

- **嵌入为默认、最稳**（X 自渲染 + 自动署名/回链）；截图为可选。
- 截图（image 类）**强制 `credit` 字段**并渲染出处；表单旁注「确认你有权使用此图」。
- 敏感题材 → `topic_flag='sensitive'`、草稿高亮、必须人工确认。
- 提示词要求解读占主体（实质转化）。

## 7. 自动选题 + 起草（B，依赖 A）

- **探测**（复用现成）：`getTrendingNow.ts`（Google Trends RSS + WC 过滤）+ CodeX 评估过的 GDELT 新闻量，算出热门 WC 话题。cron（cron-job.org，after() 后台化，沿用 gen-blog 模式）。
- **入队**：新话题写 `topic_queue`（去重：标题/match_id）。
- **起草**：对 `status='new'` 的话题，自动生成一版**纯文字解读草稿**（关联比赛则挂 prob_delta 锚），`source='manual'`、`assets=[]`、`needs_review`，并回填 `topic_queue.draft_slug`、`status='drafted'`。
- **运营者**：后台「选题队列」看话题 → 点进草稿 → 补推文嵌入/配图（A 的素材机制）→ 定版发布。
- 自动化止于「选题 + 起草文字」；**转载/配图永远人工**。

## 8. 分阶段实现

- **Phase A**（先做，自包含可上线）：迁移 0011 + `blog-media` 桶 + 上传 API + 新 generator/prompt + 软闸适配 + 撰写表单(后台) + `TweetEmbed`/图片渲染 + slug 工具 + assets 渲染（`BlogBody` 扩展 + 公开读层带 assets）。
- **Phase B**（A 之后）：迁移 0012 `topic_queue` + 探测/起草 cron + 后台选题队列 UI。

## 9. 风险

- **R1 上传/Storage 安全**：上传 API 必须 admin 鉴权（复用 /admin 口令）、限类型(image/*)、限大小、文件名随机化、桶仅公开读。
- **R2 嵌入脚本**：widgets.js 全页单例加载；CSP 若有需放行 platform.twitter.com；推文删除降级链接。
- **R3 截图版权**：靠 credit 强制 + 嵌入优先 + 人工确认 + 实质转化提示词缓解（不能消除——运营者知情担责）。
- **R4 无数字锚的事实风险**：靠「只用素材、禁臆造」提示词 + 软闸 + 人工预览（手动文章不自动发）。
- **R5 markers 渲染**：`[[asset:N]]` 越界/缺失 → 安全跳过不报错（fail-closed）。
- **R6 B 的探测成本**：GDELT 共享 IP 易 429（已知）→ best-effort + 缓存；Trends 轻量。
