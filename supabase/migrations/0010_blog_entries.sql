-- 0010 事件解读 Blog 频道 / Event Commentary（设计：docs/BLOG-EVENT-COMMENTARY-DESIGN.md §7）。
-- 应用方式：154 代理隧道 + scripts/socks5-forward.mjs + scripts/migrate.ts。
-- 经 pooler 建表不会触发默认授权 → 必须显式 GRANT（见 0002/0003/0004/0005 先例）。
-- 读取策略：公开页 SSR 用 anon 客户端 + RLS 仅放行 status='published'（草稿/待审 DB 层即不可见）；
--           管理页走 service_role（绕 RLS，HTTP Basic Auth 守 /admin/blog）。

create table if not exists blog_entries (
  id            uuid primary key default gen_random_uuid(),
  -- 双语同行：hreflang 配对原子化；slug 描述性、各语唯一（仅 en/zh，与 5 营销语种解耦）
  slug_en       text unique,
  slug_zh       text unique,
  title_en      text,
  title_zh      text,
  excerpt_en    text,
  excerpt_zh    text,
  body_en       text,            -- markdown
  body_zh       text,            -- markdown
  -- 挂载：match 详情页按 match_id、team 详情页按 team_ids 反查
  match_id      uuid references matches(id) on delete set null,
  team_ids      uuid[] not null default '{}',
  event_type    text,            -- swing|upset|clinched|eliminated|milestone
  prob_delta    jsonb,           -- 引擎 before/after（展示 + 审计；正文数字的唯一可信来源）
  demand_signal jsonb,           -- 触发它的需求信号（赛程模板 / Trending RSS：来源/query/热度/新闻）
  review        jsonb,           -- LLM 软闸 verdict/confidence/flagged_spans
  status        text not null default 'draft'
                check (status in ('draft','needs_review','published','hidden','rejected')),
  topic_flag    text,            -- 'sensitive' 等（高危题材强制人工）
  author        text not null default 'WC2026 Editorial',
  published_at  timestamptz,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- 公开索引页：按发布时间倒序列已发布
create index if not exists blog_entries_pub on blog_entries (status, published_at desc);
-- 详情页入口反查
create index if not exists blog_entries_match on blog_entries (match_id);
create index if not exists blog_entries_team on blog_entries using gin (team_ids);

alter table blog_entries enable row level security;

-- 公开只读：仅 status='published'（草稿/待审/隐藏/拒稿对 anon 不可见，DB 层硬保证）。
drop policy if exists "public read published blog_entries" on blog_entries;
create policy "public read published blog_entries" on blog_entries
  for select using (status = 'published');
-- 写入仅服务端（service_role 绕 RLS），不设公开写策略。

-- 经 pooler 建表需显式 GRANT（anon/authenticated 只读，service_role 全权）。
grant select on blog_entries to anon, authenticated;
grant all on blog_entries to service_role;
