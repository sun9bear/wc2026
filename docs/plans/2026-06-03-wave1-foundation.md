# Wave 1 — Foundation 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: 用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐条实现本计划。步骤用复选框（`- [ ]`）跟踪。
> 实现时遵循 @superpowers:test-driven-development。

**Goal:** 搭起一个可部署的 Next.js + Supabase 基座：接好 DESIGN.md 主题令牌、建立核心数据表与静态赛程 seed、实现"合规雷词 lint"与积分余额工具，最终是一个能列出 2026 赛事比赛的可运行站点。

**Architecture:** Next.js（App Router, TS）响应式 Web，部署 Vercel；Supabase（Postgres + Auth）作后端；Tailwind 主题由 DESIGN.md 令牌驱动；所有面向用户的文案都要过"每语言雷词 lint"（合规红线，代码强制）。纯逻辑用 Vitest 做 TDD，表结构用 SQL migration。

**Tech Stack:** Next.js 14+（App Router, TypeScript）、Tailwind CSS、Supabase（supabase-js）、Vitest、Vercel。

**合规护栏（不可破 — 见 `docs/设计方案.md` §2/§3）：** 不涉及真钱、积分无价值；公开文案用中性术语（倍率/预测/积分…），**绝不出现** `投注/下注/赌/博彩/赔率/庄家/盘口/押注`——**含否定形式**。Task 7 的雷词 lint 在代码层强制这条。

---

### Task 0: 脚手架 Next.js 应用

**Files:**
- Create: 项目根（`package.json`、`src/app/**`、`tailwind.config.ts` 等由脚手架生成）
- 注意：仓库根目录非空（已有 `docs/`、`.git`、`.gitignore`），`create-next-app` 会拒绝直接在非空目录运行，故先在临时子目录生成再上移。

- [ ] **Step 1: 在临时子目录生成项目**

Run:
```bash
npx create-next-app@latest .scaffold --typescript --tailwind --app --src-dir --eslint --import-alias "@/*" --use-npm --no-git
```
Expected: `.scaffold/` 下生成 Next.js 项目。

- [ ] **Step 2: 把脚手架内容上移到仓库根并删除临时目录**

Run (PowerShell):
```powershell
Get-ChildItem -Path .scaffold -Force | Where-Object { $_.Name -ne '.git' } | Move-Item -Destination . -Force
Remove-Item .scaffold -Recurse -Force
```
Expected: 根目录出现 `src/app/`、`package.json` 等；`.scaffold` 消失。

- [ ] **Step 3: 安装依赖并验证开发服务器可启动**

Run: `npm install` 然后 `npm run build`
Expected: 构建成功，无报错。

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "chore: scaffold Next.js app (TS, Tailwind, App Router)"
```

---

### Task 1: 接入 Vitest 测试框架

**Files:**
- Modify: `package.json`（加测试脚本）
- Create: `vitest.config.ts`
- Create: `src/lib/__tests__/smoke.test.ts`

- [ ] **Step 1: 安装 Vitest**

Run: `npm i -D vitest`

- [ ] **Step 2: 写 `vitest.config.ts`**
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
```

- [ ] **Step 3: 加测试脚本到 `package.json`**

在 `"scripts"` 中加入：`"test": "vitest run"`，`"test:watch": "vitest"`。

- [ ] **Step 4: 写冒烟测试 `src/lib/__tests__/smoke.test.ts`**
```ts
import { it, expect } from 'vitest'
it('test harness works', () => { expect(1 + 1).toBe(2) })
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npm test`
Expected: 1 passed。

- [ ] **Step 6: Commit**
```bash
git add -A && git commit -m "test: add vitest harness"
```

---

### Task 2: 把 DESIGN.md 令牌接进 Tailwind 主题

**Files:**
- Modify: `tailwind.config.ts`（extend colors/fontFamily/borderRadius/boxShadow）
- Modify: `src/app/globals.css`（暗色 CSS 变量 + 字体）
- Modify: `src/app/layout.tsx`（引入 Oswald/Inter/Noto Sans SC 字体）

- [ ] **Step 1: 在 `globals.css` 顶部定义暗色令牌（来自 DESIGN.md §10）**
```css
:root{
  --bg:#0A0E13; --surface:#141A22; --surface-2:#1B232D; --border:#283340;
  --text:#E8EDF2; --muted:#8A97A6;
}
html,body{ background:var(--bg); color:var(--text); }
```

- [ ] **Step 2: extend `tailwind.config.ts`（colors/font/radius/shadow，照 DESIGN.md §10）**
```ts
theme:{ extend:{
  colors:{ bg:'var(--bg)', surface:'var(--surface)', 'surface-2':'var(--surface-2)',
    border:'var(--border)', text:'var(--text)', muted:'var(--muted)',
    green:'#1BE27F', blue:'#2E9BFF', amber:'#FFB02E', red:'#FF5436', gold:'#F5C451' },
  fontFamily:{ head:['Oswald','Noto Sans SC','sans-serif'], body:['Inter','Noto Sans SC','sans-serif'] },
  borderRadius:{ sm:'8px', md:'14px', lg:'18px', pill:'30px' },
  boxShadow:{ card:'0 30px 60px rgba(0,0,0,.55)', glow:'0 0 18px rgba(27,226,127,.15)' },
}}
```

- [ ] **Step 3: 在 `layout.tsx` 用 next/font 引入 Oswald + Inter + Noto Sans SC，挂到 body**

（用 `next/font/google`，把 Inter 设为默认 body，Oswald 作 `font-head`。）

- [ ] **Step 4: 验证构建**

Run: `npm run build`
Expected: 成功。手动 `npm run dev` 打开首页背景为深色 `#0A0E13`。

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat(ui): wire DESIGN.md tokens into Tailwind theme"
```

---

### Task 3: 合规雷词 lint 工具（核心 TDD）

> 这是合规红线的代码强制点（设计方案 §3、§9.1 护栏 2）。纯函数，先测后写。

**Files:**
- Create: `src/lib/compliance/bannedTerms.ts`
- Test: `src/lib/compliance/bannedTerms.test.ts`

- [ ] **Step 1: 写失败测试 `bannedTerms.test.ts`**
```ts
import { it, expect, describe } from 'vitest'
import { findBannedTerms, assertClean } from './bannedTerms'

describe('findBannedTerms', () => {
  it('flags zh gambling terms', () => {
    expect(findBannedTerms('立即投注赢大奖', 'zh')).toContain('投注')
  })
  it('flags zh terms even when negated (scanner ignores context)', () => {
    expect(findBannedTerms('仅供娱乐，非投注建议', 'zh')).toContain('投注')
  })
  it('flags en gambling terms case-insensitively', () => {
    expect(findBannedTerms('Place your BET now', 'en')).toContain('bet')
  })
  it('passes clean neutral copy', () => {
    expect(findBannedTerms('仅供娱乐 · 积分无现实价值 · 不可兑换', 'zh')).toEqual([])
  })
  it('assertClean throws on violation', () => {
    expect(() => assertClean('赔率更新', 'zh')).toThrow()
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test`
Expected: FAIL（模块未实现）。

- [ ] **Step 3: 写最小实现 `bannedTerms.ts`**
```ts
export type Locale = 'zh' | 'en'

const BANNED: Record<Locale, string[]> = {
  zh: ['投注','下注','押注','赌','博彩','赔率','庄家','盘口','彩票','竞彩','体彩'],
  en: ['bet','betting','wager','odds','bookmaker','gamble','gambling','casino','stake'],
}

export function findBannedTerms(text: string, locale: Locale): string[] {
  const hay = locale === 'en' ? text.toLowerCase() : text
  return BANNED[locale].filter((term) =>
    locale === 'en'
      ? new RegExp(`\\b${term}\\b`).test(hay)   // 英文按词边界
      : hay.includes(term)                       // 中文按子串
  )
}

export function assertClean(text: string, locale: Locale): void {
  const hits = findBannedTerms(text, locale)
  if (hits.length) throw new Error(`Banned term(s) in ${locale} copy: ${hits.join(', ')}`)
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat(compliance): per-locale banned-term lint (red-line enforcement)"
```

---

### Task 4: 积分余额工具（TDD）

> 积分只通过 `points_ledger` 流水累加得出（设计方案 §8.3）。纯函数。

**Files:**
- Create: `src/lib/points/balance.ts`
- Test: `src/lib/points/balance.test.ts`

- [ ] **Step 1: 写失败测试**
```ts
import { it, expect } from 'vitest'
import { computeBalance, type LedgerEntry } from './balance'

const ledger: LedgerEntry[] = [
  { reason: 'signup', delta: 1000 },
  { reason: 'bet_stake', delta: -200 },
  { reason: 'bet_payout', delta: 680 },
  { reason: 'daily', delta: 50 },
]
it('sums ledger deltas into a balance', () => {
  expect(computeBalance(ledger)).toBe(1530)
})
it('empty ledger is zero', () => {
  expect(computeBalance([])).toBe(0)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test` → FAIL。

- [ ] **Step 3: 写最小实现 `balance.ts`**
```ts
export type LedgerReason =
  | 'signup' | 'daily' | 'ad_reward' | 'invite_reward'
  | 'bet_stake' | 'bet_payout' | 'reset' | 'refund' | 'cosmetic'

export interface LedgerEntry { reason: LedgerReason; delta: number }

export function computeBalance(entries: LedgerEntry[]): number {
  return entries.reduce((sum, e) => sum + e.delta, 0)
}
```

- [ ] **Step 4: 跑测试确认通过** → PASS。

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat(points): ledger balance util"
```

---

### Task 5: Supabase 客户端 + 环境变量

**Files:**
- Create: `src/lib/supabase/client.ts`、`src/lib/supabase/server.ts`
- Create: `.env.local`（不提交；`.env.example` 提交）
- Create: `.env.example`

- [ ] **Step 1: 安装 supabase-js**

Run: `npm i @supabase/supabase-js`

- [ ] **Step 2: 写 `.env.example`（占位，提交）**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
并在本地 `.env.local` 填入真实值（`.env.local` 已被 `.gitignore` 忽略）。

- [ ] **Step 3: 写浏览器端 client `src/lib/supabase/client.ts`**
```ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
```

- [ ] **Step 4: 写服务端 client `src/lib/supabase/server.ts`（用 service role，仅服务端）**

（封装 `createClient(url, SERVICE_ROLE_KEY)`，导出 `getServerSupabase()`。）

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat(db): supabase client + env scaffolding"
```

---

### Task 6: 核心数据表 migration

> 仅建 Foundation 所需核心表（玩法/下注表留 Plan 2）。按设计方案 §7、"可扩展"设计：tournament → teams → matches；外加 profiles、points_ledger。

**Files:**
- Create: `supabase/migrations/0001_core.sql`

- [ ] **Step 1: 写 migration `0001_core.sql`**
```sql
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null, season text, status text default 'upcoming',
  created_at timestamptz default now()
);
create table teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id),
  name text not null, grp text, flag text
);
create table matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id),
  home_team_id uuid references teams(id),
  away_team_id uuid references teams(id),
  kickoff_at timestamptz not null,
  stage text, status text default 'scheduled',
  home_score int, away_score int, settled_at timestamptz
);
create table profiles (
  user_id uuid primary key,            -- = auth.users.id（Plan 5 接 Auth）
  nickname text, avatar text,
  points_balance bigint default 1000,  -- 注册赠送（红线1：不可购买）
  rank_tier text default 'bronze',
  created_at timestamptz default now()
);
create table points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  delta bigint not null,
  reason text not null,                -- signup/daily/ad_reward/invite_reward/bet_stake/bet_payout/reset/refund/cosmetic
  ref_id uuid,
  created_at timestamptz default now()
);
```

- [ ] **Step 2: 应用 migration（Supabase CLI 或控制台 SQL editor）**

Run: `supabase db push`（或把 SQL 贴进 Supabase SQL editor 执行）
Expected: 5 张表创建成功。

- [ ] **Step 3: 验证表存在**

在 Supabase 控制台确认 5 张表 + `points_ledger.reason` 取值范围与设计方案 §7 一致。

- [ ] **Step 4: Commit**
```bash
git add -A && git commit -m "feat(db): core schema (tournaments/teams/matches/profiles/points_ledger)"
```

---

### Task 7: 静态赛程 seed（2026 赛事）

**Files:**
- Create: `supabase/seed/teams.json`、`supabase/seed/matches.json`（中性命名，**不含** FIFA/世界杯字样 — 红线7）
- Create: `scripts/seed.ts`（读 JSON 写库）

- [ ] **Step 1: 准备中性命名的 seed 数据**

`teams.json` / `matches.json` 用通用字段（队名、分组、开赛时间、阶段）。赛事名用中性"2026 年世界足球大赛"。

- [ ] **Step 2: 写 `scripts/seed.ts`（用服务端 client 批量插入；幂等：先按 name 查重）**

- [ ] **Step 3: 跑 seed**

Run: `npx tsx scripts/seed.ts`
Expected: tournaments/teams/matches 有数据。

- [ ] **Step 4: Commit**
```bash
git add -A && git commit -m "feat(data): seed static fixtures (neutral naming)"
```

---

### Task 8: 比赛列表页（基座 UI，验证全链路）

**Files:**
- Create: `src/lib/matches/getMatches.ts`（服务端读 matches + teams）
- Create: `src/app/page.tsx`（首页：响应式比赛卡列表，暗色主题）
- Create: `src/components/MatchCard.tsx`
- Create: `src/components/Disclaimer.tsx`
- Create: `src/i18n/messages/zh.ts`（文案模块，i18n-ready：不硬编码用户文案）

- [ ] **Step 1: 写 `getMatches.ts`（服务端查询，按 kickoff 排序，关联两队）**

- [ ] **Step 2: 文案模块 + Disclaimer 组件（i18n-ready，不硬编码 — 设计方案 §6.1）**

建 `src/i18n/messages/zh.ts`：
```ts
export const zh = { disclaimer: '仅供娱乐 · 积分无现实价值 · 不可兑换' } as const
```
建 `src/components/Disclaimer.tsx`（从文案模块取，不硬编码）：
```tsx
import { zh } from '@/i18n/messages/zh'
export function Disclaimer() {
  return <p className="text-muted text-[11px]">{zh.disclaimer}</p>
}
```
> Foundation 先用 zh 文案模块奠定"无硬编码字符串"基础；完整 next-intl 多语言路由（/zh /en）在后续计划接入。文案须能通过 Task 3 的 `assertClean(zh.disclaimer, 'zh')`。

- [ ] **Step 3: 写 `MatchCard.tsx`（队徽占位 + 队名 + 开赛时间，DESIGN 卡片样式：`bg-surface border-border rounded-lg`）**

- [ ] **Step 4: 写 `page.tsx`（服务端取 matches，渲染响应式网格：移动端单列、桌面多列；底部放 `<Disclaimer/>`）**

- [ ] **Step 5: 测试：Disclaimer 文案合规（导入实际文案常量，避免漂移）**

Test: `src/components/Disclaimer.test.ts`
```ts
import { it, expect } from 'vitest'
import { findBannedTerms } from '@/lib/compliance/bannedTerms'
import { zh } from '@/i18n/messages/zh'
it('disclaimer copy is compliant', () => {
  expect(findBannedTerms(zh.disclaimer, 'zh')).toEqual([])
})
```
Run: `npm test` → PASS。

- [ ] **Step 6: 构建 + 手动验证**

Run: `npm run build` 然后 `npm run dev`
Expected: 首页深色主题、列出 seed 的比赛、底部有中性免责声明。

- [ ] **Step 7: Commit**
```bash
git add -A && git commit -m "feat(ui): responsive matches list + compliant disclaimer"
```

---

### Task 9: 部署到 Vercel（基座可上线验证）

- [ ] **Step 1:** 在 Vercel 连接此 Git 仓库，配置环境变量（`NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`、`SERVICE_ROLE_KEY`）。
- [ ] **Step 2:** 触发部署，确认线上首页能列出比赛。
- [ ] **Step 3:** 记录线上 URL 到 `docs/设计方案.md` §12（开放项）或 README。

---

## 完成定义（Definition of Done）
- `npm run build` 通过、`npm test` 全绿。
- 线上可访问，首页以暗色主题列出 2026 赛事比赛、底部含合规免责声明。
- 雷词 lint 与积分余额工具有测试覆盖。
- 所有公开文案通过 `findBannedTerms(...,locale)` 为空。

## 下一步
Plan 1 执行完成后，编写 **Plan 2 — Gameplay（markets/selections/bets + 池式倍率 + 预测下单 + 比赛页）**。
