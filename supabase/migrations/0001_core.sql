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
