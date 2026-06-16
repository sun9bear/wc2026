-- 0005 球员人气榜 / Fan Favorite（设计：docs/PLAYER-POPULARITY-DESIGN.md）。
-- 应用方式：154 代理隧道 + scripts/migrate.ts。读取走 service_role（服务端），全锁 anon。
-- 经 pooler 建表不会触发默认授权 → 必须显式 GRANT（见 0003_events.sql / 0004_leagues.sql 先例）。

create table if not exists players (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  team_name   text not null,
  country_iso text,
  position    text,
  shirt_no    int,
  wiki_title  text,
  photo_url   text,
  photo_attr  text,
  source      text not null default 'seed',  -- 'seed' | 'scorers'
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists player_votes (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  user_id    uuid not null,
  created_at timestamptz not null default now(),
  unique (player_id, user_id)
);
create index if not exists player_votes_player on player_votes (player_id);
create index if not exists player_votes_user on player_votes (user_id);

create table if not exists player_metrics (
  player_id       uuid primary key references players(id) on delete cascade,
  buzz_raw        numeric not null default 0,   -- 维基 pageviews（近 7 日合计）
  buzz_updated_at timestamptz,
  ai_blurb        text,                          -- 中文短评（DeepSeek）
  ai_blurb_en     text,                          -- 英文短评（Gemini）
  ai_updated_at   timestamptz
);

-- 票数聚合视图（service_role 读；视图以属主权限运行，绕 player_votes 的 RLS）。
create or replace view player_vote_counts as
  select player_id, count(*)::bigint as votes
  from player_votes
  group by player_id;

alter table players enable row level security;
alter table player_votes enable row level security;
alter table player_metrics enable row level security;

grant all on players, player_votes, player_metrics to service_role;
grant select on player_vote_counts to service_role;
