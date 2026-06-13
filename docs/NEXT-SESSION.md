# 下一会话执行清单（2026-06-13 移交，配合 HANDOFF.md）

> 上一会话已完成：结算自驱动+外部 cron、全站双语（含成就/段位/About）、本地时区、加载页、
> hero 改版、69 场倍率种子、OG 出线概率卡、/calculator?team= 传播化、12 组 SEO 着陆页。
> 本文件 = 剩余任务 2-6 的实施规格（已经过代码勘察，照做即可）。

## 已验证事实（勿重查）

- **0002 已应用**：prob_team/match_snapshots 表存在，快照随 cron-job.org 每小时预热 /forecast 自动累积（最新 2026-06-13T00:27Z）。prob_meta 空属正常。
- **cron-job.org 已生效**：settle 每 15 分钟（请求头 `CRON_SECRET: <密钥>`，路由已兼容此写法）+ /forecast 整点预热。
- **ai_content 表**：unique(match_id, type)；`getMatchDetail` 用 byType("preview"/"recap"/"sentiment") 读取（src/lib/markets/getMatchDetail.ts:109-111）。
- **DDL 隧道用法**：先启动 D:\daili 的 154 代理（本地 SOCKS5 端口 11080，**不能用 10808，会黑洞 5432**），再
  `node scripts/socks5-forward.mjs 15432 aws-1-us-west-1.pooler.supabase.com 5432 127.0.0.1 11080`，
  然后用 `postgresql://postgres.hbcwszrvmohsyirqopfk:<密码>@127.0.0.1:15432/postgres`（密码=.env.local 的 SUPABASE_DB_URL 里那个）+ pg Client `ssl:{rejectUnauthorized:false}` 执行 SQL。
  **新表必须显式 GRANT**（pooler 建表不触发默认授权），模式照抄 0002 尾部。
- **GateGuard hook**：每个文件首次 Write/Edit 会被拦，消息里列 4 项事实后原样重试即过（每文件一次）。
- PS 5.1：git commit 消息别用双引号；部署唯一路径 `npx vercel deploy --prod --yes`（已授权免确认）。

## 任务 2：AI 内容英文生成

1. `src/lib/ai/content.ts`：为 preview/recap/sentiment 各加 EN system prompt（风格：r/soccer 评论区轻松梗味，80-120 词；**严禁 odds/bet/betting/wager/stake/payout/multiplier/bookmaker/parlay**，概率措辞用 chances/likely/crowd favorite/dark horse；不写免责声明）。`safeGen` 复制一个 `safeGenEn`：`findBannedTerms(body, "en")` fail-closed，违规重试一次，仍违规用英文兜底句。
2. 存储零 DDL：复用 ai_content，type 用 `preview_en` / `recap_en` / `sentiment_en`。
3. `getMatchDetail` 增 previewEn/recapEn/sentimentEn 字段；match 页 EN 视图优先英文版（有则直接平铺展示，无则维持现状折叠中文）。
4. settle 路由阶段二：每场生成 zh+en 两份 recap（RECAP_CAP 从 8 降到 4，防超 60s）。
5. 回填脚本 `scripts/gen-content-en.ts`：对全部未开赛场次生成 preview_en + sentiment_en（本地跑，DEEPSEEK_API_KEY 已在 .env.local；sentiment 的 hot/cold 短语按各 selection pooled_stake 取最高/最低）。
6. 部署门禁：对生成产物抽样 grep `odds|bet|wager|parlay|stake|payout|multiplier|bookmaker`。

## 任务 3：留存三件（顺序做）

1. `/api/me` 扩展：返回 `recent`（最近 20 笔已结算 bet：{won:boolean, kickoff:string}，按 kickoff 升序）、`streak`/`bestStreak`（按 kickoff 排序计算连胜，**不要按 settled_at**——批量补结算时间相同）。
2. **结算揭晓抽屉**：客户端组件挂 /（首页）与 /me；localStorage 存 `last_seen_settled_at`；有新结算→底部抽屉 + Me tab 红点。文案双语（中文禁"开奖/派彩/注单"）：命中「🎉 猜中了！瑞士 2-1，你的竞猜 ×3.00，+540 积分入账」/ "Spot on! Your pick earned ×3.00, +540 points"；全错「这场没猜中 -100，明天还有 N 场翻盘机会 →」。MVP 不做动画。
3. **emoji 战绩格**：/me 加"复制战绩"按钮（clipboard 需 execCommand 降级，参考 CalculatorFocus.copy）。模板：`⚽ WC2026 竞猜战绩 · 第N比赛日\n🟩🟩🟥 (2/3)\n🔥 连中X场\n搜 wc2026.cool`（EN 版 "WC2026 picks · Matchday N"）。按用户本地日期分组；"击败 N% 玩家"仅全站结算样本≥50 时显示；⚡冷门徽章冷启动期禁用。
4. **连胜展示**：/me 头部「🔥 当前 X 连中 · 历史最佳 Y」，纯派生零存储。

## 任务 4：最小埋点

1. `supabase/migrations/0003_events.sql`（走隧道执行）：
   ```sql
   create table if not exists events (
     id bigint generated always as identity primary key,
     name text not null,
     anon_id text,
     props jsonb,
     created_at timestamptz not null default now()
   );
   create index if not exists events_name_time on events (name, created_at desc);
   alter table events enable row level security;
   grant all on events to service_role;
   ```
2. `POST /api/track`：{name, props}；anon_id 取 supabase session uid，无 session 用 localStorage 随机 id；量小无需限流。
3. 客户端埋 5 个事件：home_calc_cta_click（hero 计算器入口，需把该 Link 包成小客户端组件）、calculator_team_selected（CalculatorFocus chip/select）、calculator_share_copy（doCopy 成功）、prediction_submitted（MarketPicks submit 成功）、watch_link_clicked（首页 watch 链接）。fire-and-forget。
4. `npm i @vercel/analytics` + layout 加 `<Analytics />`；**提醒用户**在 Vercel Dashboard → wc2026 → Analytics 点 Enable（免费档，看地理分布，决定小语种）。

## 任务 5：昵称 + 私人擂台 MVP（6/22 前上不了就砍）

1. `supabase/migrations/0004_leagues.sql`（同一次隧道执行）：
   ```sql
   create table if not exists leagues (
     id uuid primary key default gen_random_uuid(),
     code text not null unique,
     name text not null,
     owner_id uuid not null,
     created_at timestamptz not null default now()
   );
   create table if not exists league_members (
     league_id uuid not null references leagues(id) on delete cascade,
     user_id uuid not null,
     joined_at timestamptz not null default now(),
     primary key (league_id, user_id)
   );
   create index if not exists league_members_user on league_members (user_id);
   alter table leagues enable row level security;
   alter table league_members enable row level security;
   grant all on leagues, league_members to service_role;
   ```
2. 昵称：`POST /api/profile` 设 profiles.nickname（bannedTerms zh+en 校验，2-20 字符）；/me 加"起个名字"入口。
3. 擂台 API（全部 service key 查询，客户端不直读表）：POST /api/league（创建，code 形如 `WC-8K2F`）、POST /api/league/join {code}、GET /api/league/[code]（成员昵称+积分+命中率）。**入擂台必须先有昵称**（无昵称满屏"玩家e4b1"，社交前提崩塌）。
4. 页面：/league（创建+输码加入，双语）+ /league/[code]（榜单 + 一键复制邀请文案：「建了个世界杯竞猜擂台，口令 WC-8K2F，看看谁是懂球帝 → 搜 wc2026.cool」/EN 用 League/Challenge，避开 pool）。入口：首页 hero 次级链接行 + /me。
5. 合规：擂台仅微信/私域分发，**绝不出现在 Reddit**；英文 UI 禁词照旧。

## 任务 6：爆冷摆动卡

1. `/api/og` 加 swing 模板：`?mode=swing&team=<slug>&before=93&after=41&result=<一句话情景>` → 大字「出线概率 93% → 41%」卡（前值灰色删除线，后值大号红/绿，附 result 一句话与万次模拟标注；EN 同构）。before/after 由调用方传入，路由不算数。
2. `scripts/swing-bake.ts`（本地预烘焙）：输入 `--match "Japan vs Sweden"`：
   - baseline：读 prob_team_snapshots 最新一期两队 pAdvance（数据已在自动累积）；
   - 条件值：强制注入该场 胜/平/负 三种结果（比分约定 1-0/1-1/0-1），用已导出的 rankGroup/rankThirds + simulate.ts 跑缩减版蒙特卡洛（RUNS=2000）得三种情景的 pAdvance；Elo 构造参考 pipeline.ts 内部 parseWorldTsv/eloFor（不导出，复制 ~20 行）；
   - 输出：三种结局各一条完整 /api/og swing URL（中英各一），运营终场哨响后 15 分钟内打开对应 URL 另存图发布。
3. 发卡前自查：/forecast 已吸收最新赛果（结算链路正常即可信）。

## 全部完成后

构建 `npm run build` + `npx vitest run` + 部署 + 无头浏览器抽查（EN 视角 match 页英文 AI 内容、/league 流程、swing 卡渲染）+ commit + `git bundle create D:/wc2026-backup.bundle --all` + 更新 HANDOFF 已交付表。

## 冷启动开场白（复制给新会话）

> 读 docs/HANDOFF.md 和 docs/NEXT-SESSION.md 接手 wc2026 项目，按 NEXT-SESSION 清单依次执行任务 2-6，一口气做完：构建、测试、部署、线上验证、提交、备份。生产部署我已授权可自行确认，不要中途换模型。
