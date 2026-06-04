-- 经济硬化：原子积分 RPC + 每日签到防重。
-- 在 Supabase 控制台 → SQL Editor 整段执行（可重复执行）。
-- 依赖现有表：profiles(user_id 唯一/主键, points_balance)、points_ledger(user_id, delta, reason, ref_id, created_at)。
-- 说明：这段 SQL 是「附加式」的——它只新增函数/表，不改动现有逻辑，
--       所以现在跑了也不会影响线上；等用到这些 RPC 的代码 PR 合并后即生效。

-- 1) 原子积分变更：一条 UPDATE 同时改余额，天然并发安全。
--    负向变更（扣分）受 (points_balance + p_delta >= 0) 守卫：余额不足返回 NULL，
--    从根上消除「并发下注重复扣同一笔余额」的双花问题（H1）。
create or replace function apply_points(
  p_user uuid,
  p_delta bigint,
  p_reason text,
  p_ref uuid default null
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance bigint;
begin
  insert into profiles (user_id, points_balance)
    values (p_user, 0)
    on conflict (user_id) do nothing;

  update profiles
    set points_balance = points_balance + p_delta
    where user_id = p_user
      and points_balance + p_delta >= 0
    returning points_balance into v_balance;

  if not found then
    return null;  -- 余额不足（含并发竞争场景）
  end if;

  insert into points_ledger (user_id, delta, reason, ref_id)
    values (p_user, p_delta, p_reason, p_ref);

  return v_balance;
end;
$$;

-- 2) 每日签到防重（H4）：唯一 (user_id, day) 主键即并发锁；首次插入成功才发奖。
create table if not exists daily_checkins (
  user_id uuid not null,
  day date not null,
  primary key (user_id, day)
);
alter table daily_checkins enable row level security;

create or replace function claim_daily(
  p_user uuid,
  p_award bigint,
  p_day date
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance bigint;
begin
  insert into daily_checkins (user_id, day)
    values (p_user, p_day)
    on conflict do nothing;

  if not found then
    return null;  -- 今天已签到（并发下也只有一次插入成功）
  end if;

  insert into profiles (user_id, points_balance)
    values (p_user, 0)
    on conflict (user_id) do nothing;

  update profiles
    set points_balance = points_balance + p_award
    where user_id = p_user
    returning points_balance into v_balance;

  insert into points_ledger (user_id, delta, reason, ref_id)
    values (p_user, p_award, 'daily', null);

  return v_balance;
end;
$$;

-- 3) 最小权限：仅服务端 service_role 可执行/访问。
revoke all on function apply_points(uuid, bigint, text, uuid) from public;
revoke all on function claim_daily(uuid, bigint, date) from public;
grant execute on function apply_points(uuid, bigint, text, uuid) to service_role;
grant execute on function claim_daily(uuid, bigint, date) to service_role;
grant all on table daily_checkins to service_role;
