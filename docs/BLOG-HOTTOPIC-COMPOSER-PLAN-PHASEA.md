# 热点解读撰写器 Phase A — 实现计划

> **执行方式**：任务逐个做，每个任务自带验证 + 提交。本项目无单元测试套件，验证沿用现有风格：`npx tsc --noEmit` + `npx eslint <files>` + `npx tsx scripts/probe-*.ts`（纯逻辑）+ Vercel 部署后 `curl` 线上验证（因 Gemini 本机 geo 拦截，生成只能在 Vercel 验）。DDL 走 socks5 隧道（见 [[wc2026-supabase-db-tunnel]]）。

**目标**：在 /admin 后台手动把热点话题做成图文混排双语解读文章（素材清单+角度→模型自动排版→预览→人工发布）。

**架构**：复用 `blog_entries`（加 `source`/`assets` 两列）+ 现有 /blog 页面/sitemap/IndexNow/admin 基建。图片存 Supabase 公开桶；推文用官方嵌入。手动文章一律人工发布。

**技术栈**：Next.js 16 App Router · React 19 · Supabase（anon 读 / service_role 写 + Storage）· Vercel Hobby（60s）· Gemini(en)/DeepSeek V4 Pro(zh)。

**参考**：spec = `docs/BLOG-HOTTOPIC-COMPOSER-DESIGN.md`；现有同类代码 = `src/lib/blog/{generate,prompts,gates,store,published,admin}.ts`、`src/components/BlogBody.tsx`、`src/app/api/admin/blog/route.ts`、`src/app/admin/blog/page.tsx`。

---

## 文件结构（先锁定边界）

| 文件 | 职责 | 新建/改 |
|---|---|---|
| `supabase/migrations/0011_blog_manual_source.sql` | blog_entries 加 source/assets + blog-media 桶 + 公开读策略 | 新建 |
| `src/lib/blog/slug.ts` | `slugify(title)` + `ensureUniqueSlug(base, taken)` | 新建 |
| `src/lib/blog/assets.ts` | Asset 类型 + `splitBodyByAssets(body)`（解析 `[[asset:N]]`） | 新建 |
| `src/lib/blog/manualPrompts.ts` | 手动文章 EN/ZH system + user 提示词 | 新建 |
| `src/lib/blog/manual.ts` | `generateManualDraft(input, deps)`（生成+解析+软闸+内链检查，无数字硬闸） | 新建 |
| `src/lib/blog/store.ts` | +`upsertManualEntry(row)`（source=manual、assets） | 改 |
| `src/lib/blog/published.ts` | `BlogPost` 带 `assets`；详情读层 select assets | 改 |
| `src/lib/blog/admin.ts` | +`composeManual(input)`（service_role 落 needs_review 草稿） | 改 |
| `src/components/TweetEmbed.tsx` | 客户端：官方 blockquote + widgets.js 单例 | 新建 |
| `src/components/BlogBody.tsx` | 接受 `assets` prop；按 `[[asset:N]]` 切分渲染 embed/image | 改 |
| `src/app/blog/[slug]/page.tsx` | 传 `assets` 给 BlogBody | 改 |
| `src/app/api/admin/blog/upload/route.ts` | admin 鉴权图片上传 → blog-media → URL | 新建 |
| `src/app/api/admin/blog/route.ts` | +`compose` action（调 composeManual） | 改 |
| `src/components/BlogComposeClient.tsx` | 后台「写热点」表单（素材清单+角度→生成） | 新建 |
| `src/app/admin/blog/page.tsx` | 挂入口/表单 | 改 |
| `scripts/probe-manual.ts` | mock 验证 generateManualDraft 路由 | 新建 |

---

## Task 1：迁移 0011（列 + 桶 + 策略）

**Files**: Create `supabase/migrations/0011_blog_manual_source.sql`

- [ ] **Step 1**：写迁移 SQL
```sql
-- 手动「热点解读」文章支持：source 区分、assets 存素材；blog-media 公开桶
alter table public.blog_entries
  add column if not exists source text not null default 'auto',
  add column if not exists assets jsonb not null default '[]'::jsonb;
alter table public.blog_entries
  add constraint blog_entries_source_chk check (source in ('auto','manual'));

-- 图片存储桶（公开读；写仅 service_role 经 API）
insert into storage.buckets (id, name, public)
values ('blog-media','blog-media', true)
on conflict (id) do nothing;

-- 公开读策略（公开桶通常已可读；显式补一条 select 策略，fail-safe）
do $$ begin
  create policy "blog-media public read" on storage.objects
    for select using (bucket_id = 'blog-media');
exception when duplicate_object then null; end $$;
```
- [ ] **Step 2**：经隧道执行（先起隧道：`node scripts/socks5-forward.mjs 55432 aws-1-us-west-1.pooler.supabase.com 5432 127.0.0.1 11080`，再用 pg client 跑 SQL）。
- [ ] **Step 3**：验证：`select column_name from information_schema.columns where table_name='blog_entries' and column_name in ('source','assets')` → 2 行；`select id,public from storage.buckets where id='blog-media'` → public=true。
- [ ] **Step 4**：commit（仅迁移文件）。

> 注：`blog_entries.team_ids` 若为 NOT NULL，手动文章传 `'{}'`；`match_id` 已可空（FK on delete set null）。

---

## Task 2：slug 工具

**Files**: Create `src/lib/blog/slug.ts`；Test: `scripts/probe-manual.ts`（含 slug 用例）

- [ ] **Step 1**：实现
```ts
// 标题 → 拉丁 slug（喂 /blog/[slug]）。去非 ASCII、空白转连字符、收敛。
export function slugify(title: string): string {
  const s = title.toLowerCase().normalize("NFKD")
    .replace(/[^\x00-\x7f]/g, "")           // 去非 ASCII（中文标题靠 en 标题；都空则回退）
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return s || "post";
}
// 撞名去重：base、base-2、base-3 …（taken = 已存在 slug 集合）
export function ensureUniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) { const c = `${base}-${i}`; if (!taken.has(c)) return c; }
}
```
- [ ] **Step 2**：probe 断言：`slugify("Mbappé's Wonder Goal!")` 近似 `"mbappe-s-wonder-goal"`、空标题→"post"、`ensureUniqueSlug("x", new Set(["x","x-2"]))==="x-3"`。
- [ ] **Step 3**：`npx tsx scripts/probe-manual.ts` 通过 + tsc/eslint。Commit。

---

## Task 3：Asset 类型 + 正文切分

**Files**: Create `src/lib/blog/assets.ts`

- [ ] **Step 1**：
```ts
export interface BlogAsset {
  type: "embed" | "image";
  url: string;
  desc?: string;                 // 喂模型用，不渲染
  captionEn?: string; captionZh?: string;
  credit?: string;               // image 必填，渲染出处
  alt?: string;
}
// 把正文按 [[asset:N]] 切成片段序列：{kind:'md',text} | {kind:'asset',index}
export type BodyPart = { kind: "md"; text: string } | { kind: "asset"; index: number };
export function splitBodyByAssets(body: string): BodyPart[] {
  const parts: BodyPart[] = []; const re = /\[\[asset:(\d+)\]\]/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    if (m.index > last) parts.push({ kind: "md", text: body.slice(last, m.index) });
    parts.push({ kind: "asset", index: Number(m[1]) - 1 }); // 1-based → 0-based
    last = re.lastIndex;
  }
  if (last < body.length) parts.push({ kind: "md", text: body.slice(last) });
  return parts;
}
```
- [ ] **Step 2**：probe：`splitBodyByAssets("a[[asset:1]]b")` → [md "a", asset 0, md "b"]；越界 index 由渲染层 fail-closed 跳过。tsc/eslint。Commit。

---

## Task 4：TweetEmbed（客户端，widgets.js 单例）

**Files**: Create `src/components/TweetEmbed.tsx`

- [ ] **Step 1**：
```tsx
"use client";
import { useEffect, useRef } from "react";
// 官方嵌入：blockquote + 全页单例加载 widgets.js；删推/失败仍有「查看原推」链接兜底。
declare global { interface Window { twttr?: { widgets?: { load: (el?: HTMLElement) => void } } } }
export function TweetEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = "twitter-wjs";
    const run = () => window.twttr?.widgets?.load(ref.current ?? undefined);
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id; s.async = true; s.src = "https://platform.twitter.com/widgets.js";
      s.onload = run; document.body.appendChild(s);
    } else run();
  }, [url]);
  return (
    <div ref={ref} className="my-4">
      <blockquote className="twitter-tweet" data-dnt="true">
        <a href={url}>查看原推 / View on X →</a>
      </blockquote>
    </div>
  );
}
```
- [ ] **Step 2**：tsc/eslint（运行时验证留 Task 11 线上）。Commit。

---

## Task 5：BlogBody 渲染 assets

**Files**: Modify `src/components/BlogBody.tsx`

- [ ] **Step 1**：`BlogBody` 加可选 `assets?: BlogAsset[]` + `locale` prop。正文先 `splitBodyByAssets`；对 `md` 片段走现有 markdown 渲染（抽出现有逻辑为 `renderMarkdown(md, keyPrefix)`），对 `asset` 片段渲染 `<AssetBlock asset={assets[index]} locale=.. />`（index 越界/asset 缺失 → 返回 null，fail-closed）。
- [ ] **Step 2**：`AssetBlock`：`embed` → `<TweetEmbed url=..>`；`image` → `<figure><img loading="lazy" alt=..><figcaption>{caption}（{credit}）</figcaption></figure>`。caption 按 locale 取 captionEn/captionZh。
- [ ] **Step 3**：tsc/eslint。Commit。

---

## Task 6：手动 generator + 提示词

**Files**: Create `src/lib/blog/manualPrompts.ts`、`src/lib/blog/manual.ts`；Test: `scripts/probe-manual.ts`

- [ ] **Step 1**：`manualPrompts.ts` — EN/ZH system（参照 `prompts.ts` 风格，但核心改为）：
  - 只用 INPUT 给的 angle + assets[].desc；**不臆造事实/数字/引语/统计**；解读占主体（实质转化）；
  - 输出 `body` 用 markdown，并在语义最合适处插 `[[asset:N]]`（N=1..assets.length，每个素材**恰好引用一次**）；
  - 禁博彩词；正文带 1-2 个站内链接（给定 INPUT.links）；涉人物负面/政治→中立 + `topic_flag:"sensitive"`；
  - 输出 JSON 键：`title, excerpt, body, keywords, topic_flag`。
- [ ] **Step 2**：`manual.ts` — `generateManualDraft(input, deps)`：en/zh 各 generate→parseArticle（复用 generate.ts 的解析，必要时导出）→ **软闸**（复用 `buildSoftGatePrompt` 思路或新 manual 软闸：查忠于素材/无臆造/中立/无博彩词/markers 齐全）→ 校验每个 `[[asset:N]]` 都出现且不越界（缺失/越界 → 记 issue，落 needs_review 供人工）。**无数字硬闸**。返回 `{en, zh, status:"needs_review", reason, assetCheck}`。
- [ ] **Step 3**：`probe-manual.ts` mock：给 2 个 asset + angle，mock 模型返回含 `[[asset:1]][[asset:2]]` 的双语 body → 断言 markers 齐全、status=needs_review、软闸跑过。tsc/eslint。Commit。

---

## Task 7：手动落库

**Files**: Modify `src/lib/blog/store.ts`、`src/lib/blog/published.ts`

- [ ] **Step 1**：`store.ts` +`upsertManualEntry({slug,titleEn,...,bodyEn,bodyZh,assets,topicSensitive})`：service_role upsert（`source:'manual'`, `event_type:'hot_topic'`, `match_id:null`, `team_ids:'{}'`, `assets`, `status:'needs_review'`, `published_at:null`）。onConflict slug_en。
- [ ] **Step 2**：`published.ts` — `BlogPost` 加 `assets: BlogAsset[]`；`getPublishedBlogBySlug` select 加 `assets`、映射（默认 `[]`）。列表层不变。
- [ ] **Step 3**：tsc/eslint。Commit。

---

## Task 8：上传 API（安全）

**Files**: Create `src/app/api/admin/blog/upload/route.ts`

- [ ] **Step 1**：POST（multipart）：① `isAuthed()`（复用 admin.ts，未授权 401）；② 限 `image/*` + 大小 ≤5MB（否则 400）；③ 文件名随机化（`crypto.randomUUID()` + 原扩展名）；④ `getServerSupabase().storage.from('blog-media').upload(path, bytes, {contentType})`；⑤ 返回 `{ url: publicUrl }`。`export const runtime='nodejs'`（Buffer/crypto）。
- [ ] **Step 2**：tsc/eslint。Commit。（上传走 service_role，绕 RLS；桶公开读。）

---

## Task 9：compose action

**Files**: Modify `src/lib/blog/admin.ts`、`src/app/api/admin/blog/route.ts`

- [ ] **Step 1**：`admin.ts` +`composeManual(input)`：input={title?, angle, locales, assets:BlogAsset[]} → 取已有 slug 集合去重 → `generateManualDraft` → `upsertManualEntry` → 返回 `{ok, slug, reason, assetCheck}`。
- [ ] **Step 2**：`route.ts` mutations 段加 `if (action==="compose")`：鉴权后调 `composeManual(body.input)`，返回结果（~30-60s 同步，maxDuration=60）。
- [ ] **Step 3**：tsc/eslint。Commit。

---

## Task 10：后台「写热点」表单

**Files**: Create `src/components/BlogComposeClient.tsx`；Modify `src/app/admin/blog/page.tsx`

- [ ] **Step 1**：`BlogComposeClient`（"use client"）：标题/角度 textarea + 素材清单（动态增删：类型选择 embed/image、URL 或「上传图」按钮→调 upload API 回填 url、说明(必填)、image 类署名(必填+「确认有权使用」勾选)）+ 语言选择 → 「生成」调 `/api/admin/blog {action:compose}` → 成功后 `router.refresh()`，提示「草稿已生成，去列表预览/发布」。`busy` 态 + 处理中提示。
- [ ] **Step 2**：`admin/blog/page.tsx`：鉴权后在列表上方加 `<BlogComposeClient/>`（或折叠面板）。
- [ ] **Step 3**：tsc/eslint。Commit。

---

## Task 11：部署 + 线上端到端验证

- [ ] **Step 1**：`npx tsc --noEmit` + `npx eslint`（全部新增/改动文件）全绿。
- [ ] **Step 2**：`npx vercel --prod --yes` 部署。
- [ ] **Step 3**：登录 /admin/blog → 「写热点」：贴 1 条真实推文 URL（embed）+ 上传 1 张自有图（image+署名）+ 角度 → 生成。
- [ ] **Step 4**：列表预览该 needs_review 草稿 → 详情渲染：`curl /blog/<slug>`（或 /zh/）确认正文出现 `[[asset:N]]` 对应的 `<blockquote class="twitter-tweet">` + `<figure>`/`<img>` + 署名；markers 已被替换、无残留 `[[asset`。
- [ ] **Step 5**：发布 → `curl` 确认公开可见 + 进 /blog 列表 + sitemap 收录（已发布即自动进 blogSitemap）。
- [ ] **Step 6**：（若关联比赛/可索引）确认 IndexNow 在发布时 ping（现有 setStatus published 路径已接）。

---

## 验收标准
- 后台能：贴素材+角度→生成双语草稿→预览真实图文→人工发布。
- 嵌入用官方 X embed（不托管推文图）；图片走 blog-media（署名渲染）。
- markers 渲染 fail-closed（越界/缺失不报错）。
- 手动文章 `source='manual'`、`needs_review` 起、**不自动发**；与自动文章同列 /blog、同进 sitemap。
- 无数字硬闸；靠提示词「只用素材/禁臆造」+ 软闸 + 人工预览。

## 风险/坑（实现时注意）
- **隧道 DDL**：新列/桶后若 PostgREST 缓存旧 schema，anon 读 assets 可能短暂失败 → 可 `NOTIFY pgrst, 'reload schema'` 或等待；公开读层对 assets 缺失要默认 `[]`。
- **widgets.js**：仅客户端加载；SSR 时 blockquote 先渲染「查看原推」兜底，hydration 后由 widgets 美化。CSP 若有需放行 `platform.twitter.com`。
- **maxDuration**：compose 同步生成双语（+软闸）~30-60s，贴近 60s；若超时，提示用户重试（草稿 upsert 在最后→未落库→重试即可）。
- **team_ids NOT NULL**：upsertManualEntry 传 `'{}'`。
- **slug 全中文标题**：slugify 回退 "post" → 去重成 post-2…；建议表单可选「英文 slug」字段（YAGNI：先自动，撞多了再加）。
