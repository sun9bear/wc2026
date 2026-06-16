-- 0006 投票积分经济：从"一人一球员一票"(toggle) 改为累计投票。
-- 规则(API 实现)：每用户每球员每天 第1票免费、第2-5票各扣 10 积分、每天每球员最多 5 票；不可撤、积分不退。
-- 去掉唯一约束让投票累计；加复合索引给"当日票数"查询提速。
alter table player_votes drop constraint if exists player_votes_player_id_user_id_key;
create index if not exists player_votes_user_player_day on player_votes (user_id, player_id, created_at);
