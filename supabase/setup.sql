-- ============================================================
-- 一次性安装脚本：在 Supabase 控制台 → SQL Editor 粘贴并 Run。
-- 包含：建表 + 行级安全(RLS) + 占位赛程数据。可重复执行（幂等）。
-- ============================================================

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
  user_id uuid primary key,
  nickname text,
  avatar text,
  points_balance bigint not null default 1000,
  rank_tier text not null default 'bronze',
  created_at timestamptz not null default now()
);

create table if not exists points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  delta bigint not null,
  reason text not null,
  ref_id uuid,
  created_at timestamptz not null default now()
);

-- 行级安全：公开表(赛程)允许匿名 SELECT；用户数据表锁定。
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

-- 授予 Data API 角色对公开表的读取（因建项目时关闭了"自动暴露新表"）。
-- 服务端用 secret key 时不依赖此项；将来要做客户端直读/实时再用。
grant usage on schema public to anon, authenticated, service_role;
grant select on tournaments, teams, matches to anon, authenticated, service_role;

-- 占位赛程数据（仅当 matches 为空时灌入；中性命名，不含 FIFA/世界杯字样）。
do $$
declare t_id uuid;
begin
  if (select count(*) from matches) = 0 then
    insert into tournaments (name, season, status)
      values ('2026 年世界足球大赛', '2026', 'upcoming')
      returning id into t_id;

    insert into teams (tournament_id, name, grp, flag) values
      (t_id, '东道主', 'A 组', '🏟️'),
      (t_id, '巴西',   'C 组', '🇧🇷'),
      (t_id, '阿根廷', 'C 组', '🇦🇷'),
      (t_id, '法国',   'E 组', '🇫🇷'),
      (t_id, '西班牙', 'E 组', '🇪🇸'),
      (t_id, '德国',   'G 组', '🇩🇪'),
      (t_id, '葡萄牙', 'G 组', '🇵🇹');

    insert into matches (tournament_id, home_team_id, away_team_id, kickoff_at, stage)
      select t_id,
             (select id from teams where name='巴西'   and tournament_id=t_id),
             (select id from teams where name='阿根廷' and tournament_id=t_id),
             '2026-06-18T03:00:00Z', '小组赛';
    insert into matches (tournament_id, home_team_id, away_team_id, kickoff_at, stage)
      select t_id,
             (select id from teams where name='法国'   and tournament_id=t_id),
             (select id from teams where name='西班牙' and tournament_id=t_id),
             '2026-06-19T18:00:00Z', '小组赛';
    insert into matches (tournament_id, home_team_id, away_team_id, kickoff_at, stage)
      select t_id,
             (select id from teams where name='德国'   and tournament_id=t_id),
             (select id from teams where name='葡萄牙' and tournament_id=t_id),
             '2026-06-20T21:00:00Z', '小组赛';
  end if;
end $$;
