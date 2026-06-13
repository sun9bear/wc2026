-- 最小埋点表（任务 4，2026-06-13 规格）。
-- 应用方式：154 代理隧道 + scripts/migrate.ts（见 docs/NEXT-SESSION.md "DDL 隧道用法"）。

create table if not exists events (
  id bigint generated always as identity primary key,
  name text not null,
  anon_id text,
  props jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_name_time on events (name, created_at desc);
alter table events enable row level security;

-- 经 pooler 建表不会触发默认授权，需显式 GRANT（仅服务端可读写，不对 anon 开放）。
grant all on events to service_role;
