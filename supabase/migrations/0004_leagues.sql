-- 好友私有擂台（任务 5，2026-06-13 规格）。
-- 应用方式：154 代理隧道 + scripts/migrate.ts。客户端不直读这两张表（全部走 service key API）。

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

-- 经 pooler 建表不会触发默认授权，需显式 GRANT（仅服务端，全锁 anon）。
grant all on leagues, league_members to service_role;
