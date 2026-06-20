# Locale 段重构实施方案（任务 C）—— 让页面可被边缘缓存

> 状态：**设计稿（未实施）**。作者 2026-06-20。前置任务 B 已上线（移除每响应 Set-Cookie，commit 1376e01）。
> 目标读者：执行这次重构的会话/人。**这是一次需要专项 + 全量回归的中等规模改造，不是顺手补丁。**
> **v2 修订（2026-06-20，吸收 CodeX 78/100 审核 + 实测 grep 盘点）**：原稿缓存分类过于乐观。改为**四分类**（§4.3）、新增**结算副作用 gate**（§4.5）、**team 优先于 home/match**（§8）、新增 `_rsc`/函数调用量/searchParams 专项验收（§9）。核心结论不变：值得做、但现在只做低成本试点、不全量。
> **v3 修订（2026-06-20，CodeX 复审 86/100）**：① **MUST-FIX**——middleware matcher 必须排除所有带扩展名的静态文件，否则裸 `/ads.txt`→rewrite `/en/ads.txt`→**404**（伤 AdSense `ads.txt` / `llms.txt` / GSC 验证 txt / svg），见 §3；② `team/[slug]` 用 `revalidate=600`（对齐数据层），非 900（§4.3 A）；③ 修正 combo 风险描述（实为 getLocale 间接动态，非直读 next/headers，§7）；④ 迁移清单补 `loading.tsx` 等 route special files（§4.2）。CodeX 结论：**可按 Phase 1 开始试点**（动代码前先把 matcher 静态排除补上）。

---

## 1. 为什么要做（背景）

服务器日志（2026-06-20）实测：爬虫密集抓取时，数据重页面冷渲染 TTFB **6–20 秒**（Yandex 均值 6.2s/最高 19.7s；真人最高 13s）。根因是**全站动态渲染、CDN 零缓存**（`X-Vercel-Cache: MISS`、`Cache-Control: private, no-store`）。

经查证（Vercel/Next 官方文档），边缘缓存有**两道硬闸**，两者都必须拆：

| 闸 | 成因 | 状态 |
|---|---|---|
| **闸 2** Set-Cookie | 中间件每响应写 `NEXT_LOCALE`/`wc_country`；带 Set-Cookie 的响应永不进 CDN | ✅ **任务 B 已拆**（proxy.ts 不再写、Disclaimer 改用 LocaleContext） |
| **闸 1** no-store | 根 layout 的 `getLocale()` 读 `headers()`+`cookies()` → 全树动态 → Next 发 `no-store` | ❌ **本任务 C 要拆** |

拆闸 1 的唯一办法：**让 locale 来自路由参数（`[locale]` 段）而非请求头/cookie**，页面就不再动态、可静态/ISR、被 CDN 缓存。

**硬约束：现有已收录 URL 零 301**（`/forecast`、`/zh/forecast` 等公开 URL 一个字都不能变——否则伤掉目前仅有的收录）。本方案用「内部 rewrite」满足该约束（见 §3）。

---

## 2. 现状盘点（重构前）

- **页面路由 24 个**（全部调用 `getLocale()`，每个 ×3：generateMetadata + 组件 + 偶有 helper）：
  `about, blog, blog/[slug], calculator, calculator/group/[letter], combo, disclaimer, forecast, forecast/best-thirds, leaderboard, league, league/[code], match/[id], me, methodology, page(首页), player/[slug], popularity, privacy, rules, scorers, team/[slug], watch`。
- **不动 locale 的**：`admin/blog`（后台，无 locale）。
- **特殊文件（留在 `app/` 根，不进 `[locale]`）**：`robots.ts`、`sitemap.ts`、`icon.png`、`apple-icon.png`、`api/*`（21 个路由）。
- **当前 locale 机制**：`proxy.ts` 把 `/zh/forecast` rewrite 到内部 `/forecast` + 注入 `x-locale` 头；`getLocale()`（`src/i18n/server.ts`）读 `x-locale` 头（→动态）。
- **客户端 locale**：`LocaleProvider`（`src/i18n/LocaleContext.tsx`）由根 layout 下发；客户端用 `useLocale()`。
- **URL 构造**：`localeHref()` / `selfUrl()` / `localizedAlternates()`（`src/lib/seo/canonical.ts`）产出**公开裸 URL**（en 无前缀、其余带前缀）。`sitemap.ts` 同。
- **`getLocale()` 也被 API 用**：`api/league/[code]/route.ts`（保留，API 不缓存）。

---

## 3. 核心机制：`[locale]` 段 + 内部 rewrite（保公开 URL 不变）

```
目录：  src/app/*  (页面)         →   src/app/[locale]/*
        src/app/{robots,sitemap,icon,apple-icon,api}  保持在根，不动

公开 URL（外部可见，零变化）        内部解析（middleware rewrite 后）
  /forecast          (en 根)   →   /en/forecast      ← rewrite（不是 redirect）
  /zh/forecast       (zh)      →   /zh/forecast      ← 自然匹配 [locale]=zh，无需 rewrite
  /es/calculator     (es)      →   /es/calculator    ← 同上
  /                  (en 根)   →   /en
  /en/forecast       (有人直敲) →   308 → /forecast   ← 防 /en 重复内容
```

- 页面 `app/[locale]/forecast/page.tsx` 拿 `params.locale`（'en'|'zh'|...），**不读 headers/cookies → 不动态 → 可静态/ISR → CDN 缓存**。
- 公开 URL 永不出现 `/en` 前缀（en 走内部 rewrite）→ **零 301、已收录 URL 不受影响**。
- `localeHref/canonical/sitemap/hreflang` **完全不用改**——它们本就产出裸 URL；`/en` 内部前缀对外不可见。

### 目标 middleware（`src/proxy.ts`）

```ts
import { NextResponse, type NextRequest } from "next/server";
import { PREFIXED_LOCALES } from "./i18n/locales"; // = ['zh','es','pt','de','fr']

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const seg = pathname.split("/")[1] ?? "";

  // 1) 有人公开访问 /en/* → 308 跳到裸路径，防与根重复内容
  if (seg === "en") {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  // 2) 带前缀 locale（/zh /es ...）→ 天然匹配 app/[locale]，直接放行
  if ((PREFIXED_LOCALES as readonly string[]).includes(seg)) {
    return NextResponse.next();
  }
  // 3) 裸路径（en 根）→ 内部 rewrite 到 /en/*（公开 URL 不变）
  const url = req.nextUrl.clone();
  url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // ⚠️ MUST-FIX（CodeX v3）：必须排除所有带扩展名的静态文件 `.*\..*`——否则裸路径
  //   /ads.txt /llms.txt /<gsc验证>.txt /*.svg 等会被 rewrite 成 /en/ads.txt → 404
  //   （伤 AdSense、llms.txt、GSC 验证）。public/ 下当前有：ads.txt, llms.txt,
  //   6bdb…txt(验证), file/globe/next/vercel/window.svg, og.png。
  //   `.*\..*` 一并覆盖 og.png/robots.txt/sitemap.xml/favicon.ico/icon.png/apple-icon.png（都带扩展名）。
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
```

> 关键变化：**不再注入 `x-locale` 头、不再写任何 cookie**，逻辑比现在更简单；但 matcher 的静态文件排除是上线前的硬性前置（见上注释）。
> 验收必查：`/ads.txt`、`/llms.txt`、`/<验证>.txt`、各 `.svg`、`/og.png`、`/robots.txt`、`/sitemap.xml` 全部仍 200 且内容正确（未被 rewrite 到 /en）。

---

## 4. 目标架构改动清单

### 4.1 根 layout（最关键、最易踩坑）
Next 要求**根 layout 含 `<html><body>`**。`<html lang>` 需要 locale。方案：
- **把 `src/app/layout.tsx` 整体下移为 `src/app/[locale]/layout.tsx`**，`<html lang={BCP47_LOCALE[locale]}>`、`LocaleProvider locale={params.locale}`、站点级 JSON-LD 全部用 `params.locale`。
- 因为**所有页面路由都在 `[locale]` 下**，`app/[locale]/layout.tsx` 即事实根 layout（Next 官方 i18n 例子即如此，无需再留 `app/layout.tsx`）。
- ⚠️ **决策点**：是否保留一个极简 `app/layout.tsx`？
  - 若 `global-error.tsx` / 其它根级特殊文件需要根 layout，可能要留一个 pass-through。**实施第一步必须先验证这一点**（见 §7 风险）。
- `params` 现在是 `Promise<{ locale: string }>`（Next 15+ async params），layout 签名改 `{ children, params }`。

### 4.2 页面（24 个）
每个页面 2 处改动：
1. `generateMetadata({ params })` 与默认组件 `({ params })`：
   - 删 `const locale = await getLocale();`
   - 改 `const { locale: raw } = await params; const locale = isLocale(raw) ? raw : "en";`（用 `isLocale` 收窄，非法→en 或 `notFound()`）。
2. 动态子路由（`match/[id]`、`team/[slug]`、`player/[slug]`、`league/[code]`、`calculator/group/[letter]`、`blog/[slug]`）的 `params` 现在**同时含 locale**：`{ locale, id }` / `{ locale, slug }` / `{ locale, letter }` / `{ locale, code }`。更新解构。
3. **route special files 要随页面一起进 `[locale]`（CodeX v3）**：当前有 5 个 `loading.tsx`——`app/loading.tsx`、`calculator/`、`forecast/`、`match/[id]/`、`team/[slug]/`——迁移对应路由时连同搬到 `app/[locale]/…/loading.tsx`，别只搬 page.tsx（否则该路由迁后丢加载态/可能解析异常）。若后续新增 `error.tsx`/`not-found.tsx` 同理。

### 4.3 路由四分类（v2 修订 —— 吸收 CodeX 审核 + 实测 `force-dynamic` 盘点）

⚠️ 原稿缓存表过于乐观。实测 grep 发现 **9 个页面本就 `force-dynamic`**（有真实动态源），不是"只改 locale 就能 ISR"。当前 force-dynamic：`admin/blog, blog, blog/[slug], leaderboard, league, league/[code], page(首页), player/[slug], popularity`。按"额外动态源"四分类：

**A · 纯内容可缓存（仅因 getLocale 动态，去掉即 ISR）→ 直接迁**
`forecast, best-thirds, about, rules, privacy, disclaimer, watch, methodology, combo, scorers, calculator/group/[letter]`（用 `[letter]` 段、**不读 searchParams**）、**`team/[slug]`**（无副作用，但日志最重 p95 18.2s → 试点后**第一个**迁）。
配置：`export const revalidate = 900`（对齐数据 `unstable_cache` 节奏）；重子段 `export const dynamicParams = true`（按需渲染+缓存，不构建期全量预渲染）。
**例外（CodeX v3）：`team/[slug]` 用 `revalidate=600`**——对齐其数据层 `getTeamDetail.ts`（600s），否则页面壳 900s 比数据更滞后。match/[id] 同样 600。

**B · 需先拆 searchParams / 副作用，才能缓存**
- **首页 `/`**：`?filter` searchParams + `after(maybeAutoSettle)`（page.tsx:38）+ `Date.now()` + 未缓存 `getMatches()`（全部实测确认）。要：① `?filter` 改客户端过滤；② 去 after、结算全交 cron（见 §4.5）；③ `getMatches` 包 `unstable_cache`；④ Date.now 移出渲染。**四项做完才能 ISR。**
- **`/calculator`（裸页）**：`?team` searchParams（calculator/page.tsx:142）。要：team 选择改客户端交互，**或此页保留动态**（SEO 主力是 `group/[letter]`，裸 calculator 保留动态成本低，推荐后者）。
- **`/match/[id]`**：`after(maybeAutoSettle)`（:224）+ `Date.now()` + 直播比分。要：先过 §4.5 结算 gate；直播比分本就客户端轮询（不挡外壳缓存）；Date.now 用服务端缓存值替代。处理后 `revalidate=600`+`dynamicParams`。

**C · 保留动态（实测 force-dynamic，有真实理由，别碰）**
`me`（用户态）、`admin/blog`（后台）、**`leaderboard`**（实时排名）、**`popularity`**（实时票数）、**`league` + `league/[code]`**（私域/noindex/口令，CodeX 点 6）、`blog` + `blog/[slug]`（随发布即时更新）、API、直播轮询组件。

**D · 待定 — 调查后再归类**
- **`player/[slug]`**：现 `force-dynamic` + `Date.now()`。CodeX 列它为"重页面可缓存"，但它显式动态。**先查清为何 force-dynamic**：若纯展示（射手/卡牌）→ 可改 ISR（重路由收益）；若依赖实时数据 → 归 C。

> `generateStaticParams` 在 `[locale]` 段返回 `LOCALES.map(l => ({ locale: l }))`；重子段（team/match/player）靠 `dynamicParams=true`。

### 4.5 结算副作用 gate（缓存 home/match 的硬前置 —— CodeX 点 5）

首页与比赛页靠 `after(() => maybeAutoSettle())` 在**每次访问时**驱动结算。**一旦 CDN HIT，这段不再每访问运行 → 结算会漏。** 所以缓存 home/match **之前必须**：
1. 把结算完全收敛到 `/api/cron/settle`（已约 5 分钟/次），并**确认可靠**——日志里出现过 1 次 `502`，先排查 + 加重试/告警；
2. 从 home/match 移除 `after(maybeAutoSettle)`（或保留但不依赖它结算）；
3. 验证：停掉页面 after、纯靠 cron，结算延迟仍可接受（终场后几分钟内）。

**这是 home/match 进缓存桶的硬门槛——没做完不许迁这两类。**

### 4.4 保持不变（重要——少改少错）
- `localeHref / selfUrl / localizedAlternates / hreflang`（canonical.ts）——产出裸 URL，**不动**。
- `sitemap.ts`——**不动**（仍输出裸 URL）。
- `LocaleContext` / `useLocale` / 客户端组件——**不动**（Disclaimer 任务 B 已迁好）。
- `getLocale()`（server.ts）——**保留**给 API 路由用（API 不缓存，无所谓动态）；页面不再调用它。
- `getDict` 等——**不动**。

---

## 5. 零-301 保证（验收硬指标）

1. **公开 URL 一字不变**：`/`, `/forecast`, `/zh/forecast`, `/es/calculator`, `/match/{id}`, `/team/{slug}` …全部维持原样（内部 rewrite 不改地址栏）。
2. **rewrite 非 redirect**：根/裸路径走 `NextResponse.rewrite`（200，无跳转）。
3. **`/en/*` 防重复**：唯一新增 308 是 `/en/*` → 裸（防有人直敲内部前缀造成重复内容）。`/en` 本就不在 sitemap、不被链接，影响仅限手敲。
4. **canonical/hreflang 仍指裸 URL**：因 canonical.ts 不改，自动满足。验收时 curl 抽查确认响应里 canonical 无 `/en`。

---

## 6. 缓存产出（成功标准）

- 重构后内容页：`X-Vercel-Cache: HIT`（第二次起）、`Cache-Control` 带 `s-maxage`（来自 `revalidate`），TTFB 从 6–20s 冷渲染降到**边缘命中的几十毫秒**。
- 若 Next 默认头不够，可加 `CDN-Cache-Control` 精调边缘时长（B 已确保无 Set-Cookie，不再被硬阻断）。
- `/me`、API、直播轮询仍动态（本就不该缓存）。

---

## 7. 风险区（按危险度排序，实施时逐项验证）

1. **🔴 根 layout / `<html><body>` 归属**：把 html/body 放进 `app/[locale]/layout.tsx` 是否被当前 Next 版本接受、`global-error`/特殊文件是否还需根 layout。**第一步先用最小骨架验证**，不行则保留极简 `app/layout.tsx`（pass-through，不含 locale）。
2. **🔴 客户端导航到裸 URL**：`<Link href="/forecast">`（en）在客户端 RSC 预取/跳转时，是否经 middleware rewrite 正确解析到 `[locale]=en`。Vercel 上 middleware 对 RSC 请求也生效，一般可行，但**必须实测预取 + 软导航 + 浏览器前进后退**。
3. **🟠 `[locale]` 校验**：非法 locale 段（如 `/xx/forecast`）要 `notFound()`，别 fallback 成 en 静默收录脏 URL。`generateStaticParams` 限定 6 个 + `dynamicParams` 控制。
4. **🟠 动态子路由 params 形变**：所有 `match/team/player/league/group/blog` 的 `params` 多了 `locale`，漏改会类型错或取错值。tsc 能兜住大部分。
5. **🟠 ISR 首跑成本**：match/team/player 按需渲染，首次仍要冷渲染（之后缓存）。team 页含蒙卡 `getAdvanceRequirements`，首跑可能慢——但只 1 次/revalidate 周期。
6. **🟡 OG 路由 `/api/og`**：在 `api/` 下、读 `?locale=` 查询参不受影响；确认无 getLocale 依赖（它用查询参）。
7. **🟡 sitemap/robots/canonical 不得泄漏 `/en`**：回归时 grep 抽查。
8. **🟡 `combo` 页**（CodeX v3 修正）：它**不是**直读 `next/headers`，而是和其它页一样经 `getLocale()` 间接动态。迁移时**只需把 getLocale() 换成 params.locale**，无特殊处理。

---

## 8. 分阶段实施（建议在预览部署上先验证，不直接上 prod）

- **Phase 0（已完成）**：任务 B——拆 Set-Cookie。✅
- **Phase 1 · 骨架 + 试点（最重要的验证）**：
  1. 建 `app/[locale]/layout.tsx`（html/body/lang/Provider，用 params.locale）；按需处理根 layout 决策（风险 1）。
  2. 改 `proxy.ts` 为 §3 的 rewrite 版。
  3. **只迁 1 个静态路由**（如 `forecast`）到 `app/[locale]/forecast/` + `revalidate=900` + `generateStaticParams`。
  4. 部署到**预览环境**，验：① `/forecast` 与 `/zh/forecast` 内容/语言正确；② 第二次 `X-Vercel-Cache: HIT`；③ 零 301（curl 原 URL 直返 200）；④ 客户端从首页软导航到 forecast 正常；⑤ `/en/forecast` 308→`/forecast`；⑥ canonical/hreflang 无 `/en`。
  5. **Phase 1 不过 → 停，不要继续**（证明机制行不通，及时止损，成本最低）。
- **Phase 2 · 迁 `team/[slug]`（最高 ROI 单点，CodeX 点 2）**：它是 A 类（干净、无副作用）**且日志最贵**（p95 18.2s、`.rsc` p95 6.3s）。单独迁、`revalidate=900`+`dynamicParams`，验 `X-Vercel-Cache: HIT`（含 `_rsc`）+ **函数调用量明显下降**。先吃下最重的页面。
- **Phase 3 · 批量迁 A 类其余**：`about, rules, methodology, best-thirds, calculator/group/[letter], scorers, watch, privacy, disclaimer, combo`，逐个改 params + `revalidate`。
- **Phase 4 · 结算 gate → 再迁 home + match（B 类）**：先完成 §4.5（结算收敛到 cron + 确认可靠），**再**迁首页(拆 `?filter`+`getMatches` 缓存+去 after+去 Date.now)与 `match/[id]`(去 after + Date.now)。**gate 没过不动这两类。**
- **Phase 5 · calculator + player 收尾**：`/calculator` 裸页拆 `?team`（或保留动态）；先调查 `player/[slug]` 为何 force-dynamic 再决定 ISR/保留（§4.3 D）。
- **Phase 6 · 确认 C 类不动 + 全量回归 → 上线**：me/admin/league/league[code]/leaderboard/popularity/blog 保持 force-dynamic；6 语种全量回归（§9）后切 prod。

> 每个 Phase 独立 commit、独立预览验证；prod 切换放最后一步。**不要一口气迁完 24 页**（CodeX 明确反对）。

---

## 9. 验收 / 测试清单

- [ ] **零-301**：curl `/`, `/forecast`, `/zh/forecast`, `/es/calculator`, `/match/{id}`, `/team/{slug}` → 全部 200、无 redirect、地址栏不变。
- [ ] **边缘缓存**：上述内容页第二次请求 `X-Vercel-Cache: HIT`、TTFB < 200ms。
- [ ] **`_rsc` 请求也命中**（CodeX）：客户端软导航走的 `?_rsc=` / RSC 请求同样 `X-Vercel-Cache: HIT`（否则软导航仍打 origin，team `.rsc` p95 6.3s 不会降）。
- [ ] **函数调用量下降**（CodeX）：上线后 Vercel function invocations 对比迁移前**明显下降**（爬虫命中边缘而非每次冷渲染）——这是 ROI 的硬证据。
- [ ] **searchParams 页面按设计仍 MISS**（CodeX）：`/calculator?team=`（若保留动态）、`/me` 等故意动态的页面**应**是 MISS——确认我们没误把它们 ISR 化导致内容错配/陈旧。
- [ ] **`/en/*` 防重复**：`/en/forecast` → 308 → `/forecast`。
- [ ] **6 语种内容正确**：en/zh/es/pt/de/fr 各抽 3 页，语言/文案/队名正确。
- [ ] **canonical & hreflang**：响应内 canonical/alternate 全为裸 URL，无 `/en`。
- [ ] **OG/分享卡**：`/api/og?...&locale=` 正常；各页 og:image 正常。
- [ ] **sitemap.xml / robots.txt**：内容不变、无 `/en`。
- [ ] **客户端导航**：首页→各页软导航、预取、浏览器前进后退、LangToggle 切换均正确。
- [ ] **/me 动态**：登录态正确、不被缓存（`X-Vercel-Cache: MISS`/无）。
- [ ] **直播比分**：进行中比赛页比分仍实时更新（客户端轮询不受外壳缓存影响）。
- [ ] **tsc / eslint / 既有测试**全绿。
- [ ] **serverless 成本**：上线后看函数调用量应**大幅下降**（爬虫命中边缘缓存而非每次冷渲染）。

---

## 10. 工作量与建议

- **规模**：~24 页面 + 根 layout + middleware 改写；URL/canonical/sitemap/客户端层基本不动。
- **定性**：**中等工作量、URL 低风险（零-301 由内部 rewrite 保证）、但需谨慎 + 全量回归**。不是"轻量补丁"。
- **建议时机**：作为**独立专项**，最好在内容冲刺告一段落、或赛事窗口后的平静期。先在预览环境跑通 Phase 1 再决定是否全量。
- **ROI 提醒**：当前真人流量仍小（~12/小时），慢主要伤机器人（可容忍，Google 尚未限速）。**性能不是这 5 周窗口的最高优先级**——排名/CTR/内容更重要。本重构的收益（边缘缓存 + serverless 降本 + 抓取预算友好）在流量上量后才显著。**先把方案备好，按需触发。**

---

## 附：触发条件（什么时候该真正动手做 C）
满足任一即值得排期：
1. Google Search Console 出现「抓取频率因服务器响应慢而下降」的迹象；
2. 真人流量上量（如日均会话 > 数百），13s 的尾延迟开始实质伤转化；
3. Vercel serverless 用量/成本因爬虫密集冷渲染显著上升；
4. 内容/排名工作告一段落，进入"性能与降本"阶段。
