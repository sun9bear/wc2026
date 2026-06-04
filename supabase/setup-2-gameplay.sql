-- ============================================================
-- Plan 2 玩法表：在 Supabase 控制台 → SQL Editor 粘贴并 Run。
-- 前提：先跑过 Plan 1 的 supabase/setup.sql。可重复执行（幂等）。
-- ============================================================

create table if not exists markets (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  type text not null,                       -- '1x2' 胜平负 等
  status text not null default 'open',      -- open / locked / settled
  created_at timestamptz not null default now()
);

create table if not exists selections (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references markets(id) on delete cascade,
  code text not null,                       -- home / draw / away
  label text not null,                      -- 主胜 / 平局 / 客胜（中性措辞）
  pooled_stake bigint not null default 0,
  current_multiplier numeric(6,2) not null default 0
);

create table if not exists bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null default 'single',      -- single / parlay
  total_stake bigint not null,
  total_multiplier numeric(8,2) not null,
  status text not null default 'pending',   -- pending / won / lost / refunded
  payout bigint,
  created_at timestamptz not null default now()
);

create table if not exists bet_selections (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid references bets(id) on delete cascade,
  selection_id uuid references selections(id),
  multiplier_at_bet numeric(6,2) not null,
  leg_status text not null default 'pending'
);

-- 行级安全
alter table markets enable row level security;
alter table selections enable row level security;
alter table bets enable row level security;
alter table bet_selections enable row level security;

drop policy if exists "public read markets" on markets;
create policy "public read markets" on markets for select using (true);
drop policy if exists "public read selections" on selections;
create policy "public read selections" on selections for select using (true);

-- 用户只能读自己的预测
drop policy if exists "own bets" on bets;
create policy "own bets" on bets for select using (auth.uid() = user_id);
drop policy if exists "own bet_selections" on bet_selections;
create policy "own bet_selections" on bet_selections for select
  using (exists (select 1 from bets b where b.id = bet_id and b.user_id = auth.uid()));

-- 读取授权（写入一律走服务端 secret key / service_role，不开放匿名写）
grant usage on schema public to anon, authenticated, service_role;
grant select on markets, selections to anon, authenticated, service_role;
grant select on bets, bet_selections to authenticated, service_role;

-- 服务端写入：service_role 拥有全部应用表的完整 DML（写入一律走服务端 secret key，绝不开放匿名写）。
grant all on tournaments, teams, matches, profiles, points_ledger, markets, selections, bets, bet_selections to service_role;
