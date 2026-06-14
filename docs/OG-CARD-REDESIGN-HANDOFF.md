# OG 图卡改版 — 新会话交接 spec

> 产出：2026-06-14 ｜ 分支 feat/legal-pages ｜ 状态：未开始
> 冷启动：读本文件 + `docs/HANDOFF.md` 接手。生产部署已授权（`npx vercel deploy --prod --yes`，完成刷新 `D:\wc2026-backup.bundle`）。

## 0. 冷启动一句话
> 读 docs/OG-CARD-REDESIGN-HANDOFF.md + docs/HANDOFF.md 接手 wc2026，改 OG 图卡：**按 locale 决定方向**——zh 出 3:4 竖版(给小红书/微信)、en 出 1.91:1 横版(给 X/FB)；对阵卡日期时间行移到 VS 下方、自适应换行(横向够就一行、不够拆两行：日期+星期 / 时区+时间)、更紧凑。同步全站 openGraph 的 width/height 按 locale 给值。生产部署已授权。

## 1. 目标与确认的决策（用户拍板）
- **方向跟着 locale 走**（不是一刀切 3:4）：
  - **zh → 竖版 3:4 = 1080×1440**（适合小红书/微信/存图发朋友圈/IG Story）。
  - **en → 横版 1.91:1 = 1200×630**（适合 X / Facebook / LinkedIn 链接预览，避免竖图被裁）。
  - 适用**所有模式**：mode=match（对阵）、mode=swing（摆动）、team（球队）、brand（兜底）。每个模式都要**两套版式**：en 横版 + zh 竖版，按 `locale` 选。
- **对阵卡(mode=match)日期时间行**：
  - 位置：移到 **VS 对阵行的正下方**，更紧凑（减小与上方的间距）。
  - 自适应换行：**横向空间够 → 一行**「日期+星期 · 时区+时间」；**不够（竖版）→ 拆两行**：第 1 行 `日期 + 星期`，第 2 行 `时区 + 时间`。**换行点固定在「日期组 / 时间组」边界**，绝不在词中间断。

## 2. 当前实现（动手前必读，文件+行号）
### `src/app/api/og/route.tsx`（唯一的图卡渲染路由）
- `locale` 已在函数顶部确定（`?locale=zh|en`，zh 字体取不到会回退 en）。**方向直接用这个 locale 判定。**
- 四个 `ImageResponse` 出口的当前尺寸：
  - **swing 卡**：`{ width: 1200, height: 630 }`（约 line 213）——版式按横版设计。
  - **match 卡**：`{ width: 1080, height: square ? 1080 : 1440 }`（约 line 359）——**已是 3:4 竖版(默认)**，并有 `fmt=square` 选项；`square = searchParams.get("fmt") === "square"`（line 247）。kickoff 单行渲染在 line 308–312（VS 行下方的居中块里），`const kickoff = clean(searchParams.get("t"), 48)`（line 245）。
  - **brand 兜底卡**：`{ width: 1200, height: 630 }`（约 line 443）。
  - **team 卡**：`{ width: 1200, height: 630 }`（约 line 505）。
- 改造点：
  1. 每个模式按 `locale` 选方向：`en → 1200×630 横版版式`、`zh → 1080×1440 竖版版式`。**横版布局塞进竖版会很空/错位，反之亦然**——必须为每卡补另一方向的版式（字号/间距/留白/排列重排），逐张肉眼核对，不是改个数字。
  2. 把 match 卡现有的 `fmt=square` 逻辑替换/收编为「locale 决定方向」（保留一个可选 override 参数也行，但默认走 locale）。

### `src/lib/share/matchCard.ts`
- `formatKickoff(iso, locale)`（line 32）：现在用一个 `Intl.DateTimeFormat`（month/day/weekday/hour/minute/timeZoneName）输出**一整串**，经 `buildMatchOgUrl` 的 `&t=` 传。
- 改造：让它产出**两段**（用两个 formatter 或 `formatToParts` 干净拆分，保证换行点在边界）：
  - `datePart` = 日期 + 星期：zh「6月13日 周六」/ en「Sat, Jun 13」
  - `timePart` = 时间 + 时区：zh「20:00 GMT+8」/ en「8:00 PM GMT+8」
- `buildMatchOgUrl` 改成传两个参数（如 `&t1=` `&t2=`，或保留 `&t=` 再加 `&t2=`）。route 里据此渲染：横版拼 `${datePart} · ${timePart}` 一行；竖版渲染两行。
- 注意：所有传给 og 的字符串仍要过雷词闸（route 里已对 `t` 做 `clean()` fail-closed，新增的 `t2` 同样要 clean）。

### 全站 openGraph 尺寸（必须同步，否则社交预览按错比例渲染）
- 凡声明 `openGraph.images:[{ url, width:1200, height:630 }]` 处，改成**按 locale 给值**（en→1200×630，zh→1080×1440）。涉及（grep `width: 1200` / `width:1200`）：
  - `src/app/team/[slug]/page.tsx`（generateMetadata openGraph，已有 `locale` 在手）
  - `src/app/match/[id]/page.tsx`（两处 openGraph：默认卡 + 爆冷摆动卡，均有 `locale`）
  - `src/app/layout.tsx`（根 openGraph 用 `/og.png` 1200×630——静态品牌图，按需保留或也出 locale 版）
  - 客户端分享组件若内嵌尺寸：`MatchPreviewShare` / `MatchSwingShare` / `HeaderShare`（多数只传 url 给 buildMatchOgUrl/swingOgPath，尺寸在 route 决定——确认它们没有硬编码 width/height 给分享 API）。
- `src/lib/share/swingShare.ts` 的 `swingOgPath` / `matchCard.ts` 的 `buildMatchOgUrl`：确认 og url 不再写死 `fmt`，让 route 按 locale 出方向。

## 3. 验收
- [ ] `GET /api/og?...&locale=en`（match/swing/team/brand 各一）→ **1200×630 横版**，版式不空不错位。
- [ ] `GET /api/og?...&locale=zh`（同上四种）→ **1080×1440 竖版**，版式不空不错位。
- [ ] 对阵卡日期：en 横版**一行**「Sat, Jun 13 · 8:00 PM GMT+8」；zh 竖版**两行**「6月13日 周六」/「20:00 GMT+8」；位置在 VS 正下方、紧凑；换行点在日期/时间边界。
- [ ] 每页 `curl` 原始 HTML 的 `og:image:width/height` 与实际图方向一致（en 1200×630 / zh 1080×1440）。
- [ ] zh 卡中文字体正常（route 的 `loadZhFont` 子集字符串要把新出现的字补进去，如「月日周时区」等）。
- [ ] 雷词闸：`t2` 等新参数过 `clean()`；扫描器/构建/测试全过：`npx tsc --noEmit` 净、`npm run test` 全过、`npm run build` 净、`npx eslint <changed>` 0。
- [ ] 部署后真机/浏览器逐张核对观感（竖版重排必须肉眼验）；微信内打开 zh 卡另存确认清晰。

## 4. 坑 / 约束（沿用本项目）
- **GateGuard**：每文件首次 Write/Edit 必拦，先列 4 项事实再 retry（每文件一次）。
- **PowerShell 5.1**：commit 用单引号 here-string、正文避免双引号；本任务零 DDL。
- **zh 字体**：`loadZhFont(text)` 只取「text 里出现的字」的子集——卡上任何新中文字必须出现在那串里，否则缺字。
- **ImageResponse 限制**：仅支持 flex 布局子集；`@vercel/og` 不支持部分 CSS。改版式时按现有写法（全部 `display:flex`）来。
- 队旗只接受 `flagcdn.com`（route 已有 SSRF 防护，勿放开）。
- 成本：本任务建议**单独新会话**冷启动做（[1m] 长会话重读历史很贵）。
