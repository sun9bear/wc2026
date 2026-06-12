-- 概率历史快照表（v2：摆动图卡/历史曲线/Brier 对账用）。
-- 应用方式：在 Supabase SQL Editor 执行，或 .env.local 配置 SUPABASE_DB_URL 后由迁移脚本执行。
-- 当前无状态 v1 不依赖本文件；表建立后写入代码即可启用历史功能。

create table if not exists prob_match_snapshots (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  created_at timestamptz not null default now(),
  p_home numeric not null,
  p_draw numeric not null,
  p_away numeric not null,
  market jsonb,          -- 去水共识 {home,draw,away}，无盘口为 null
  model jsonb not null,  -- Elo+泊松 {home,draw,away}
  books int not null default 0,
  top_scores jsonb       -- [{h,a,p}...]
);
create index if not exists idx_pms_match_time on prob_match_snapshots (match_id, created_at desc);

create table if not exists prob_team_snapshots (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  p_advance numeric not null,
  p_r16 numeric not null,
  p_qf numeric not null,
  p_sf numeric not null,
  p_final numeric not null,
  p_champion numeric not null,
  runs int not null
);
create index if not exists idx_pts_team_time on prob_team_snapshots (team_id, created_at desc);

create table if not exists prob_meta (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

alter table prob_match_snapshots enable row level security;
alter table prob_team_snapshots enable row level security;
alter table prob_meta enable row level security;

drop policy if exists "public read prob_match_snapshots" on prob_match_snapshots;
create policy "public read prob_match_snapshots" on prob_match_snapshots for select using (true);
drop policy if exists "public read prob_team_snapshots" on prob_team_snapshots;
create policy "public read prob_team_snapshots" on prob_team_snapshots for select using (true);
drop policy if exists "public read prob_meta" on prob_meta;
create policy "public read prob_meta" on prob_meta for select using (true);
-- 写入仅服务端（service key 绕过 RLS），不设公开写策略。

-- 经 pooler 建表不会触发默认授权，需显式 GRANT（匿名只读，服务端全权）。
grant select on prob_match_snapshots, prob_team_snapshots, prob_meta to anon, authenticated;
grant all on prob_match_snapshots, prob_team_snapshots, prob_meta to service_role;
