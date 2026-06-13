# 计划：可识别的个性化分享身份（零注册）

> ✅ **已实施并上线（6/13，commit 4eb8c18，生产已验证）**——全 6 块完成。
> 🔒 **对抗审查加固已上线（6/13，commit 05b60c1，生产已验证）**：① 合规红线——雷词闸对用户可控身份字段（昵称/擂台名/OG `by`）可被全角·零宽·空格拆分·驼峰·数字粘连绕过并漏到「公开进 sitemap」的 /leaderboard，新增 `findBannedTermsStrict`（NFKC 归一+去零宽+删分隔+子串）专用于身份字段，`validateNickname` 加拒控制/格式字符（含 RTL override）并按规范形存库；正文仍用词边界版。② 排行榜/擂台默认名「暂固定 zh」的尾巴已修：`getLeaderboard`/`getLeagueBoard` 按 locale 透传，删除失效的 `replace(/^玩家/…)` 死补丁（线上验证：EN 视图 CoolMaestro30、ZH 视图 火热射手30，同 uid 平行）。③ OG `by` 码点截断对齐 20+限可渲染字符集（去 emoji 防豆腐块）。④ 改名 UX：Enter 提交/Esc 取消/取消键/aria-label/默认名预填/防双击。
> 剩余小尾巴：分享原生 share 暂不附 by-图片文件（走「保存图片卡」带 by + 正文署名）；跨设备认领仍为后续。

> 定稿 2026-06-13。目标：让被分享的图卡能显示"谁晒的"，同时**绝不加注册墙**（"no sign-up" 是第一转化优势）。
> 做法：把已有的**匿名身份 + 昵称**用起来——趣味默认名 + 随处可改名 + 昵称印上摆动卡。
> 冷启动：`读 docs/plans/2026-06-13-identity-share.md 接手 wc2026，按完整版实施`。生产部署已授权。

## 现状（已核实）
- 匿名登录 `signInAnonymously`，无任何注册（无 signUp）。身份 = 浏览器 session，绑设备。
- 昵称系统已存在但**只在私人擂台流程露出**：`validateNickname`（2–20 码点、中英雷词过滤）、`/api/profile` GET/POST 存 `profiles.nickname`。`/me` 无改名入口。
- 无昵称的显示兜底是 `玩家${user_id.slice(0,4)}`（见 `getLeaderboard.ts:31`、`getLeagueBoard.ts`）——丑、不可晒。
- 摆动 OG 卡（`/api/og` mode=swing）**不含任何用户身份**。
- 分享组件已拉 `/api/me`：`MatchSwingShare.tsx`（个性化）、`SettleDrawer.tsx`（晒爆冷）。

## 实施（6 块，全部零注册）

### 1. 趣味默认名（替换"玩家3f2a"）
- 新建 `src/lib/identity/defaultName.ts`：`defaultName(userId: string): string`，**确定性**（按 userId 哈希播种，渲染期不可用 Math.random）。从两套**雷词安全**词表组合：形容词+名词+2 位数字，中英各一套（locale 决定）。必须自检通过 `validateNickname`（加单测：随机 1000 个 uid 全部 valid）。
- 用它替换所有 `玩家${id.slice(0,4)}` 兜底：`getLeaderboard.ts`、`getLeagueBoard.ts`。
- 是**显示兜底**不入库；纯函数双端可用（客户端分享时也算 `nickname ?? defaultName(uid)`）。

### 2. /api/me 暴露 nickname
- `/api/me` 响应加 `nickname`（已 auth 用户，读 profiles.nickname）。分享组件据此算 `effectiveName = nickname ?? defaultName(session.user.id)`（uid 从 `supabase.auth.getSession()`）。

### 3. 昵称印上摆动卡（OG）
- `/api/og` 加 `?by=<name>`：slice ≤16 字 + `findBannedTerms` 双语过滤（命中则丢弃，fail-closed，与 `result` 同款），渲染一行小字"by {name}"（右上角或 footer 附近，低调）。
- **关键区分**：og:image（链接展开，页面级、对所有人相同）**不带 by**——它不是某个分享者的。带 `by` 的是**用户主动动作**：`MatchSwingShare` 的「保存图片卡」直链 + 分享附图 URL（微信主路径=存 PNG 再发，所以这条最重要）。`swingShare.ts` 加 `swingOgPath(swing, locale, by?)`。

### 4. /me 改名入口
- `MeClient.tsx` 加昵称区：显示当前 effectiveName + 编辑（POST `/api/profile`，乐观更新，服务端 `validateNickname`）。错误码双语文案。

### 5. 分享时内联起名（低摩擦，不阻塞）
- `MatchSwingShare` / `SettleDrawer` 分享处：若 `nickname==null`，分享**仍可立刻进行**（用默认趣味名），旁边给「✎ 改名」一键内联输入框（一个 field → POST /api/profile → 之后图卡带新名）。绝不挡住分享。

### 6. 合规 + 验收
- 昵称两道闸：设置时 `validateNickname` + OG 路由 `by` 再过滤。长度限制。英文面 `by`/默认名零雷词（默认名词表预先筛过）。
- eslint 净 / vitest 全过（+ defaultName 单测）/ next build 净。
- 对抗审查（建议）：默认名雷词、`by` 注入/越权、og:image 不串号、匿名身份跨页一致。
- 部署 + 提交 + 备份 + 回写 HANDOFF。

## 诚实代价（已与用户确认接受）
匿名身份绑浏览器：清 cookie / 换设备丢名字与战绩。5 周活动期可接受。若后续要跨设备 → Supabase 匿名号"事后认领"（选填邮箱/OAuth，数据不丢），是**事后可选**非事前墙——单列为后续项，不在本计划。
