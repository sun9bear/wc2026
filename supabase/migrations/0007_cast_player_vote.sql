-- 0007 原子投票 RPC：把"计数→收费→落票"放进一个事务，并用 (user,player) advisory lock 串行化，
-- 杜绝并发下"两个第1票都判免费 / 超过日限5"的竞态（审核 HIGH 1&2）。一并去掉路由层的退款补偿与
-- profile-ensure 竞态（审核 MED 3&4）。规则：每用户每球员每天 第1票免费、第2-5票各扣10、最多5票。
-- 新用户首次付费票给 1000 起始分（与 predict/checkin 口径一致；apply_points 默认建档给 0）。

create or replace function cast_player_vote(p_user uuid, p_player uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today   int;
  v_balance bigint;
  v_total   bigint;
  v_paid    boolean;
begin
  -- 按 (user, player) 串行化：不同球员/用户互不阻塞；事务结束自动释放。
  perform pg_advisory_xact_lock(hashtext(p_user::text || ':' || p_player::text));

  select count(*) into v_today
  from player_votes
  where user_id = p_user
    and player_id = p_player
    and created_at >= (date_trunc('day', now() at time zone 'UTC') at time zone 'UTC');

  if v_today >= 5 then
    return jsonb_build_object('error', 'daily_limit');
  end if;

  v_paid := v_today > 0;
  if v_paid then
    -- 确保档案存在；新建则给 1000 起始分并补 signup 流水。
    insert into profiles (user_id, points_balance) values (p_user, 1000)
      on conflict (user_id) do nothing;
    if found then
      insert into points_ledger (user_id, delta, reason, ref_id)
        values (p_user, 1000, 'signup', null);
    end if;

    -- 原子扣 10，余额不足（含并发）则返回。
    update profiles
      set points_balance = points_balance - 10
      where user_id = p_user and points_balance - 10 >= 0
      returning points_balance into v_balance;
    if not found then
      return jsonb_build_object('error', 'insufficient_points');
    end if;

    insert into points_ledger (user_id, delta, reason, ref_id)
      values (p_user, -10, 'player_vote', p_player);
  end if;

  insert into player_votes (user_id, player_id) values (p_user, p_player);

  select count(*) into v_total from player_votes where player_id = p_player;

  return jsonb_build_object(
    'ok', true,
    'votes', v_total,
    'today_count', v_today + 1,
    'cost', case when v_paid then 10 else 0 end,
    'balance', v_balance
  );
end;
$$;

revoke all on function cast_player_vote(uuid, uuid) from public;
grant execute on function cast_player_vote(uuid, uuid) to service_role;
