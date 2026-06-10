# 需要你配合的事项（账号 / API Key 申请）

> 我（Claude）已把**不需要密钥的部分全部做完**（见末尾"昨晚已完成"）。下面是需要**你本人**注册账号 / 拿密钥的事项，按优先级排好。每项都写了：**干什么、怎么申请、密钥放哪**。
> 明早你把 ①②办了，我就能接着把数据库接通、继续后面的开发。

---

## 🟢 最小行动清单（明天先做这两件就够我继续）
1. **Supabase 项目** → 拿 3 个 key 填进 `.env.local`，并执行一段建表 SQL。
2. **体育数据 API** → 注册拿 1 个 key（结算要用，可稍后）。

其余（Vercel / AdSense / LLM / 人机验证）等功能做到那一步再办，不急。

---

## ① Supabase（最优先 · Plan 1 收尾必需）
- **干什么**：项目的数据库 + 账号登录 + 实时更新，全靠它。
- **怎么申请**：
  1. 打开 https://supabase.com 注册（**可能需科学上网**）。
  2. New Project → 选离海外用户近的区（如 `US East` 或 `Singapore`）→ 设一个数据库密码 → 等 1–2 分钟初始化。
  3. 进入 Project Settings → **API**，复制三样：`Project URL`、`anon public` key、`service_role` key（service_role 是机密，别外泄）。
- **密钥放哪**：在项目根目录把 `.env.example` 复制成 `.env.local`，填入：
  ```
  NEXT_PUBLIC_SUPABASE_URL=（你的 Project URL）
  NEXT_PUBLIC_SUPABASE_ANON_KEY=（anon public key）
  SUPABASE_SERVICE_ROLE_KEY=（service_role key）
  ```
- **建表**：进入 Supabase 控制台 → SQL Editor → 把仓库里 `supabase/migrations/0001_core.sql` 的内容整段贴进去执行（建 5 张核心表）。
- 办完告诉我，我会把首页从"本地占位数据"切到读真实数据库，并跑 seed 灌入赛程。

## ② 体育数据 API（Plan 3 结算用 · 关键路径，可稍后但别太晚）
- **干什么**：自动拉取比赛**赛程 + 最终比分**，用来给预测自动结算。
- **怎么申请（任选其一，先看免费额度）**：
  - **football-data.org**：注册邮箱拿免费 API token（覆盖主流大赛，免费档有频率限制）。
  - **API-Football（api-sports.io）**：注册拿 key，免费档每天有调用上限。
- **选之前确认**：是否覆盖 2026 这届赛事的赛程+比分、免费额度够不够、ToS 是否允许这种用途。
- **密钥放哪**：`.env.local` 里加（变量名我接入时会最终确定）：
  ```
  FOOTBALL_API_KEY=（你的 key）
  ```

## ③ LLM API（Plan 5 内容自动化）✅ 已接入 DeepSeek
- **干什么**：AI 自动生成赛事前瞻、赛后小结、冷热门解说（纯娱乐内容，不是投注建议）。
- **已完成**：用 DeepSeek（`DEEPSEEK_API_KEY` 已在 `.env.local`）。
  - 赛前前瞻、冷热门看点：本地脚本批量生成入库（`scripts/gen-previews.ts` / `gen-sentiment.ts`），已生成 24 条，全部过雷词检查。
  - 赛后小结：结算时由 cron 自动生成（`scripts/gen-recaps.ts` 可补录）。
  - 所有公开输出都过 `bannedTerms` 雷词 lint，命中则改写/兜底，绝不外泄博彩字眼。
- **⚠️ 待你做（生产环境）**：把 `DEEPSEEK_API_KEY` 加进 **Vercel → Settings → Environment Variables**（标 Sensitive），否则**赛后小结的 cron 自动生成**在线上不可用（前瞻/冷热门已入库，展示不需要密钥）。开赛（6/11）前办好即可，不急于今天。
- **注意**：按用量计费，内容缓存复用省成本；想换更高质量模型只需改 `src/lib/ai/deepseek.ts` 的 endpoint/model。

## ④ Vercel（部署上线 · 你说先不部署，缓办）
- **干什么**：把网站托管上线。
- **怎么做**：vercel.com 用 GitHub 账号登录 → Import 这个仓库 → 把上面 `.env.local` 里的变量逐个填进 Vercel 的 Environment Variables → Deploy。
- **注意**：按你的要求，**我不会自动做生产部署**；等你准备好、亲自点部署。

## ⑤ Google AdSense（变现 · 上线后再办）
- **干什么**：广告变现（个人可注册，见 `设计方案.md` §4.4）。
- **怎么做**：adsense.google.com 注册 → 站点内容审核通过后拿广告位代码 → 收款用电汇或 PayPal Hyperwallet。
- **注意**：需科学上网管理；"竞猜"形态可能触发广告内容审查，建议同时备 Media.net 等备用网络。

## ⑥ Cloudflare Turnstile（反滥用）🟡 已拿 key，接入待 GitHub 恢复
- **干什么**：人机验证，防小号刷榜、刷激励广告（保护 AdSense 账号不被封）。
- **已完成**：Turnstile widget 已建（hostname 含 `wc2026.cool` + `www.wc2026.cool`，Managed 模式）；key 存 `docs/secret/Cloudflare Turnstile.txt`，已填入 `.env.local`（`NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`）。服务端验票核心 `src/lib/security/turnstile.ts` + 单测已写（**无密钥即休眠**，不会误拦）。
- **⚠️ 待你做（生产环境）**：把 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` 加进 **Vercel 环境变量**（后者标 Sensitive）。**但先别加**——等我把客户端组件 + 写操作拦截接好并**真机 QA** 后再启用，否则可能误拦正常下注。
- **待接入（GitHub 恢复后，带真机验证）**：客户端 Turnstile 组件 + 在下注/串关/签到提交时取 token → 服务端 `verifyTurnstile()` 校验。

---

## ✅ 昨晚（自动）已完成 —— Plan 1 Foundation
- 用 Next.js 16 + React 19 + Tailwind v4 搭好项目脚手架。
- 把 `DESIGN.md` 的暗色体育/电竞令牌（配色/字体/圆角/阴影）接进 Tailwind 主题。
- **合规雷词 lint**（`src/lib/compliance/bannedTerms.ts`）——含"否定形式也拦"，带测试。
- **积分余额工具**（`src/lib/points/balance.ts`），带测试。
- 中文文案模块（i18n-ready，不硬编码）。
- Supabase 客户端代码、`.env.example`、核心表 `0001_core.sql`、seed 脚本与占位数据（**均未连真实库**，等你 ①）。
- 响应式**首页**：用本地占位赛程列出比赛 + 中性免责声明。
- **自检**：`npm test`（10 项全过）+ `npm run build`（构建成功）✅。

**你回来后想看效果**：在项目目录跑 `npm run dev`，浏览器开 http://localhost:3000 就能看到暗色风格的比赛列表页（用的是占位数据）。

---

*下一步（等你 ① 办好）：我把首页接真实 Supabase、灌 seed，然后开始 Plan 2（玩法引擎 + 池式倍率 + 预测下单）。全程守七条合规红线。*
