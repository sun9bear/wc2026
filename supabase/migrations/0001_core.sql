-- Wave 1 Foundation 核心表（设计方案 §7）。玩法/下注表见后续计划。
-- 应用方式：配置 Supabase 后用 CLI `supabase db push`，或在 SQL Editor 执行本文件。

create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  season text,
  status text not null default 'upcoming',
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  name text not null,
  grp text,
  flag text
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  home_team_id uuid references teams(id),
  away_team_id uuid references teams(id),
  kickoff_at timestamptz not null,
  stage text,
  status text not null default 'scheduled',
  home_score int,
  away_score int,
  settled_at timestamptz
);

create table if not exists profiles (
  user_id uuid primary key,                 -- = auth.users.id（Auth 在后续计划接入）
  nickname text,
  avatar text,
  points_balance bigint not null default 1000,  -- 注册赠送；红线1：不可用钱购买
  rank_tier text not null default 'bronze',
  created_at timestamptz not null default now()
);

create table if not exists points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  delta bigint not null,
  -- signup/daily/ad_reward/invite_reward/bet_stake/bet_payout/reset/refund/cosmetic
  reason text not null,
  ref_id uuid,
  created_at timestamptz not null default now()
);

-- 行级安全（RLS）：
-- 公开表（赛程）允许匿名 SELECT；用户数据表锁定（仅服务端/直连可写）。
alter table tournaments enable row level security;
alter table teams enable row level security;
alter table matches enable row level security;
alter table profiles enable row level security;
alter table points_ledger enable row level security;

drop policy if exists "public read tournaments" on tournaments;
create policy "public read tournaments" on tournaments for select using (true);

drop policy if exists "public read teams" on teams;
create policy "public read teams" on teams for select using (true);

drop policy if exists "public read matches" on matches;
create policy "public read matches" on matches for select using (true);

-- profiles / points_ledger 不设公开策略：默认拒绝匿名访问，仅服务端/直连操作。
