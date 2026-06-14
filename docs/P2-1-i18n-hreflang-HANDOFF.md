# P2-1：双语可爬性（per-locale URL + hreflang）— 新会话交接 spec

> 产出：2026-06-14 ｜ 分支 feat/legal-pages ｜ 状态：未开始（Phase 1A/1B + Phase 2 P1 已上线）
> 用途：新会话凭本文件即可冷启动接手这件**最大且风险最高**的 SEO 工程。配合读 `docs/SEO-GEO-PLAN.md`（§一、§四 P2-1、§八）、`docs/HANDOFF.md`、Claude 记忆文件。
> **强烈建议新会话做**（本任务工程量大）：长会话切 [1m] 会按长上下文费率重读全部历史，成本极高。

---

## 0. 冷启动一句话
> 读 `docs/P2-1-i18n-hreflang-HANDOFF.md` + `docs/HANDOFF.md` 接手 wc2026，做 P2-1：把站点从「单 URL + cookie 切语言」改成「per-locale 可爬 URL + reciprocal hreflang + 各 locale 独立 canonical」。生产部署我已授权，可自行确认。**先出方案让我确认 URL 策略，再动代码。**

## 1. 目标与收益（为什么做）
- **根因**：现在 zh/en 共用同一 URL，靠 cookie/Accept-Language 切换。**Googlebot 不带 zh Accept-Language → 永远只看到英文**，中文内容对爬虫与 AI 答案引擎完全隐身。
- **收益**：这是方案称的「**唯一 schema 补不了的结构性缺陷**」。修好后解锁**中文 WC2026 预测内容的真空白**（中文 SERP 全是灰产假官方站）→ 面向**海外华人**（北美/欧洲，AdSense 高价值区）的内容能被独立收录与引用。
- **代价/定位**：方案 §一明确「工程最大、部署风险最高 → 谨慎并行轨」；payoff 主要在**淘汰赛（7 月）+ 长尾 + 下届**，不是 6/22-27 小组赛窗口。所以这是**窗口后的大投资**，不必抢时间，但**必须干净做**。

## 2. 当前实现（动手前必读，附文件位置）
- **语言判定**：`src/i18n/server.ts` `getLocale()` —— `NEXT_LOCALE` cookie 优先 → 无则 Accept-Language 正则 `/(^|[,;\s])zh\b|zh-/i` → 命中 zh 否则 en。**仅服务端组件用**。
- **首访写 cookie**：`src/proxy.ts`（Next middleware，文件名是 proxy.ts 不是 middleware.ts）首访按 Accept-Language 写 `NEXT_LOCALE`，并写 `wc_country`（Vercel 边缘 IP 国家码，为未来小语种备）。matcher 跳过 `_next/ api/ favicon og.png robots sitemap`。
- **文案两套**：
  - 全局字典 `src/i18n/index.ts`（`Dict` 接口 + `getDict(locale)`，`Record<Locale,Dict>` 强制 zh/en 结构一致）；消息 `src/i18n/messages/zh.ts`、`en.ts`。
  - 各页面另用**就地 `const COPY = { zh, en } as const` + `getLocale()`**（如 forecast/rules/team/group/disclaimer/best-thirds）。两种模式并存。
- **canonical**：每页 `generateMetadata` 里**硬编码绝对单 URL**（如 `alternates:{canonical:"https://www.wc2026.cool/forecast"}`），无 locale 概念，无 hreflang。
- **内链**：全站 `<Link href="/forecast">` 等**无 locale 前缀**。
- **sitemap**：`src/app/sitemap.ts` 每页**单 URL**（无 per-locale、无 alternates）。
- **html lang**：`src/app/layout.tsx`（需确认当前是否随 locale 变；大概率写死）。
- **合规扫描器**：`scripts/seo-compliance-scan.ts` 现在对同一 URL **用 Accept-Language 头扫 en+zh 两遍**——改 per-locale URL 后需改成扫 `/zh/...` 实际路径。

## 3. 方案红线（不可破，来自 SEO-GEO-PLAN §四 P2-1 / §八）
1. **「必须干净做或不做」**：reciprocal `zh-Hans` / `en` / `x-default` + **各 locale 独立 self-canonical**。活跃 core-update 季上**半成品有害**——来不及干净落地就**推迟到窗口后**，不要 ship 一半。
2. **zh 树上线前过红线扫描**（`seo-compliance-scan.ts`）作**部署阻断闸**——中文内容里出现一个雷词（投注/赔率/盘口…）在 AdSense 审核期是致命的，而中文是新暴露给爬虫的面。
3. **不要破坏已收录/已提交的根 EN URL**：Phase 1A/1B/2 的所有页（`/forecast`、`/forecast/best-thirds`、12 个 `/calculator/group/[letter]`、48 个 `/team/[slug]`、逐场 `/match/[id]`、`/rules` 等）都以**根路径 EN-first** 收录/已提交 GSC。**绝不能让它们 301/改 URL**（core-update 季大规模重定向有害，且浪费刚做的收录）。
4. **不暴露后端数据源**（Polymarket/博彩品牌），对外只 "public forecasting data" —— 中文树同样适用。

## 4. 架构决策（**先和用户确认再动手**）

### URL 方案（推荐 A）
- **A（推荐）：EN 不带前缀留在根 + ZH 加 `/zh/` 前缀**。
  - `/forecast`（en，x-default）、`/zh/forecast`（zh）。
  - **理由**：完全保住已收录/已提交的根 EN URL（红线 3），零 301；只**新增** zh 树。x-default → 根（en）。
  - 代价：默认无前缀 + 次语言带前缀是 Google 认可的合法模式，但 hreflang 要写对（互指 + x-default）。
- B：两者都带前缀 `/en/ /zh/`，根 `/` 302→`/en/`。**不推荐**——会把已收录的根 URL 全改掉（破红线 3）。
- C：子域 `zh.wc2026.cool`。不推荐（DNS/部署复杂、风险高）。
- D：query `?lang=zh`。不推荐（Google 不当独立页，hreflang 不友好）。

### Next.js 实现路径（App Router **无内置 i18n 路由**，Pages Router 才有）
- **A1（最干净、工程大）**：把 `src/app/*` 路由挪进 `src/app/[locale]/*`（en 默认走 rewrite 到无前缀），`generateStaticParams` 出 locale。改动面最大但语义最正。
- **A2（较轻）**：保持文件结构，用 `src/proxy.ts` middleware **rewrite** `/zh/forecast` → 内部 `/forecast` 并把 locale 经 header 传给 `getLocale()`；en 留在根。文件改动小，但 canonical/hreflang/getLocale 需细心。
- 决策点：让用户/你按工程预算选 A1 vs A2。**`getLocale()` 必须改成从 URL（path 段或 rewrite header）取 locale，不再靠 cookie 切内容**——cookie/Accept-Language 只降级为**首访 302 重定向**到对应 locale URL 的机制（爬虫无 cookie 也能经 URL 直达 zh 内容）。
- **hreflang 用 Next Metadata API**：`alternates: { canonical, languages: { "en": <enUrl>, "zh-Hans": <zhUrl>, "x-default": <enUrl> } }` —— Next 会生成 `<link rel="alternate" hreflang=...>`。每页 en 版 self-canonical 指 en URL、zh 版指 zh URL。

## 5. 必改文件清单（按 A 方案）
- `src/i18n/server.ts`：`getLocale()` 改为从 URL/rewrite header 取 locale（不再 cookie 切内容）。
- `src/proxy.ts`：首访按 Accept-Language **302 重定向**到 `/`（en）或 `/zh/`（zh）；若走 A2 则在此做 `/zh/*` → 内部 rewrite + 传 locale header；调整 matcher。
- 路由结构（A1）：`src/app/*` → `src/app/[locale]/*`（含 layout/page/loading）；或（A2）保持不动靠 rewrite。
- **每页 `generateMetadata`**：canonical 改 locale-aware + 加 `alternates.languages`（hreflang）。涉及：`/`(layout 或 page)、forecast、forecast/best-thirds、calculator、calculator/group/[letter]、team/[slug]、match/[id]、rules、watch、combo、leaderboard、about、privacy、disclaimer。
- **所有内链**：`<Link href>` 改 locale 前缀——建议加 helper `localeHref(locale, path)`（en→原样，zh→`/zh`+path），全站替换。注意 JSON-LD 里的 `url`/`item` 绝对地址、OG/twitter image url、robots、sitemap 也要 locale 化。
- `src/app/sitemap.ts`：每页出**两条 URL**（en + zh）并带 `alternates`（xhtml:link）；保持 settled_at lastmod；保持 fail-closed catch。
- `src/app/layout.tsx`：`<html lang>` 随 locale；确认 `<head>` 里 GSC 验证 meta 不丢。
- `scripts/seo-compliance-scan.ts`：把扫描路径改为真实 per-locale URL（en 根路径 + `/zh/` 路径），不再靠 Accept-Language 头切。
- `src/lib/seo/indexnow.ts`：结算后 ping 的 URL 列表补 zh 版（`/zh/...`）。

## 6. 推荐实施分步（每步可独立 build/验证，降低风险）
1. **路由 + locale 解析**：定 A1/A2 → 改路由结构 + `getLocale()` + `proxy.ts`（302/rewrite）。验证：`curl` 无 Accept-Language 头访问 `/zh/forecast` 返回**中文**；`/forecast` 返回英文。
2. **metadata/hreflang/canonical**：逐页 locale-aware canonical + `alternates.languages`。验证：`curl` 原始 HTML 每页有 reciprocal hreflang(en/zh-Hans/x-default) + 各自 self-canonical。
3. **内链 locale 化**：`localeHref` helper + 全站替换；JSON-LD/OG/robots 绝对地址 locale 化。
4. **sitemap + 合规扫描器**：sitemap 双 locale + alternates；扫描器改扫真实 zh URL。验证：`seo-compliance-scan` 对 zh 树 0 雷词（**部署阻断闸**）。
5. **构建验证 + 部署**：`next build` 净 + `vitest` 全过 + `eslint` 0 + 扫描器 0 → `npx vercel deploy --prod --yes` → 线上 `curl` 抽查 5+ 页双 locale + hreflang + sitemap → 刷新 `D:\wc2026-backup.bundle`。

## 7. 验收标准
- [ ] **不带 Accept-Language / 不带 cookie** 访问 `/zh/forecast` 返回中文正文（证明爬虫可经 URL 直达 zh，不靠 cookie）。
- [ ] `/forecast`（根）返回英文；根 EN URL **全部保持不变、无 301**（红线 3）。
- [ ] 每页原始 HTML 含 reciprocal hreflang `en` / `zh-Hans` / `x-default` + **各 locale 独立 self-canonical**。
- [ ] sitemap 列出双 locale URL（带 alternates），lastmod 仍取真实 settled_at。
- [ ] `scripts/seo-compliance-scan.ts` 对 en + zh 真实 URL **全过 0 雷词**。
- [ ] `next build` 净、`vitest` 全过、`eslint` 0 error。
- [ ] 多 agent 对抗评审（仿 Phase 2）safe-to-deploy 再上线。

## 8. 验证命令
```powershell
npx tsc --noEmit
npm run test
npx eslint <changed files>
npm run build
# 合规闸（先起 preview 或部署后扫线上）：
npx tsx scripts/seo-compliance-scan.ts https://www.wc2026.cool
# 爬虫视角抽查（关键：不带 Accept-Language 头）：
Invoke-WebRequest -Uri https://www.wc2026.cool/zh/forecast -UseBasicParsing   # 应返回中文
```

## 9. 环境约束 / 坑（沿用本项目）
- **部署唯一路径** = `npx vercel deploy --prod --yes`（GitHub 账号被封，不能 push；生产部署已获用户永久授权）。完成后刷新 `D:\wc2026-backup.bundle`。
- **GateGuard hook**：每个文件首次 Write/Edit 必被拦，需先列 4 项事实再 retry（每文件一次）。
- **PowerShell 5.1 提交信息**：用**单引号 here-string** 且**正文不要出现双引号**（双引号会让 native 参数 word-split，本会话踩过两次）。
- **成本**：[1m] 长会话按长上下文费率重读全部历史（实测一轮可达数百刀）。**本任务务必新会话冷启动**，并考虑按 §6 分步、必要时跨多个会话。
- 别造「接受任意连接串执行 DDL 的临时 admin 路由」（权限分类器会拦且理由正当）。本任务**零 DDL**（纯前端/路由/文案）。

## 10. 待用户（本任务相关）
- URL 方案确认（推荐 A：en 根 + `/zh/` 前缀）。
- i18n 上线后，GSC 对**重点 zh 页**单独请求收录（中文树是全新暴露面）。
- （可选）方案 §四 P2-1 提到的小语种（es/pt/ar）扩展——`wc_country` cookie 已为此预埋，但属本任务之后。
