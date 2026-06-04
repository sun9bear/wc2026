-- Plan 3：为 matches 增加 external_id（映射 football-data.org 的比赛 id），用于赛程/比分同步。
-- 在 Supabase 控制台 → SQL Editor 粘贴运行。可重复执行。

alter table matches add column if not exists external_id bigint;
create unique index if not exists matches_external_id_key on matches (external_id) where external_id is not null;
