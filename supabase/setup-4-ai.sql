-- Plan 9：AI 内容缓存表（赛前前瞻 / 赛后小结）。
-- 在 Supabase 控制台 → SQL Editor 粘贴运行。可重复执行。

create table if not exists ai_content (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  type text not null,                       -- preview / recap
  body text not null,
  generated_at timestamptz not null default now(),
  unique (match_id, type)
);

alter table ai_content enable row level security;

drop policy if exists "public read ai_content" on ai_content;
create policy "public read ai_content" on ai_content for select using (true);

grant usage on schema public to anon, authenticated, service_role;
grant select on ai_content to anon, authenticated, service_role;
grant all on ai_content to service_role;
