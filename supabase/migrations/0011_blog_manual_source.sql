-- 0011 手动「热点解读」文章支持（设计：docs/BLOG-HOTTOPIC-COMPOSER-DESIGN.md §2）。
-- 应用方式：154 代理隧道 + scripts/socks5-forward.mjs，经 pooler 跑 SQL。
-- source 区分自动/手动；assets 存素材（推文嵌入 URL / 图片 URL + 说明/署名）。
-- 列级权限继承 0010 的表级 GRANT，无需再 GRANT。

alter table public.blog_entries
  add column if not exists source text not null default 'auto',
  add column if not exists assets jsonb not null default '[]'::jsonb;

-- source 取值约束（幂等：已存在则跳过）
do $$ begin
  alter table public.blog_entries
    add constraint blog_entries_source_chk check (source in ('auto','manual'));
exception when duplicate_object then null; end $$;

-- 图片存储：公开读桶（写仅 service_role 经 /api/admin/blog/upload；本站不托管推文图）
insert into storage.buckets (id, name, public)
values ('blog-media', 'blog-media', true)
on conflict (id) do nothing;

-- 公开读策略（公开桶通常即可读；显式补一条 select 策略，fail-safe；幂等）
do $$ begin
  create policy "blog-media public read" on storage.objects
    for select using (bucket_id = 'blog-media');
exception when duplicate_object then null; end $$;
