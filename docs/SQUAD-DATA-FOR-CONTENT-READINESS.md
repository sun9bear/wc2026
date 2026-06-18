# Squad 数据用于「队页内容加深」— 就绪核查 & 实施交接

> 2026-06-19 ｜ 只读核查完成（未动任何代码）
> 用途：把 CodeX 采集的**官方阵容数据**（`docs/SQUAD-DATA-COLLECTION-REPORT.md`）用于**预测站队页 `/team/[slug]` 的内容加深**（SEO）。
> ⚠️ **前置**：等桌面排版优化会话收工、工作树干净后再动代码（这些文件是多会话热点，避免同文件并发撞车）。

## 0. 为什么做（数据依据）
GSC（6/18 导出）显示真实搜索需求是英文长尾：`[team] world cup 2026 group X standings qualification scenarios`、`[team] squad/roster`。队页是天然落地页，但现状只有概率/战绩，缺**官方阵容**。CodeX 已采 48 队 × 26 人官方名单，正好补这块。

## 1. 数据能不能读
- ✅ **squad 表已在生产库**（REST 探测返回 401 而非 404 = 存在）。
- ⚠️ **anon 读不了**：`0008` 迁移里 **RLS 已启用 + 只 `grant ... to service_role`**，没给 anon → 公开客户端 401。
- ✅ **可行路径：服务端用 `getServerSupabase()`（service key）读**——该客户端已存在（`src/lib/supabase/server.ts`），service role 绕过 RLS/grant。**无需任何 DDL/GRANT，也不必改 CodeX 的表权限。**
- 备选（不推荐）：若想让 anon 直读，需 `grant select` + RLS 读策略，走 Supabase 隧道做 DDL——比服务端读麻烦，不必。

## 2. 可用字段（取自 `supabase/migrations/0008_squad_game_data.sql`）
- **`squad_teams`**：`fifa_code`、`team_name`、`team_name_zh`、`player_count`、`gk/df/mf/fw_count`、`avg_age`、`avg_height_cm`、`total_caps`、`total_goals`、`head_coach_name`（+ 教练生日/国籍）。⚠️ `fd_crest_url`=队徽，**别用**（版权）。
- **`squad_players`**：`squad_team_id`(FK→squad_teams.id)、`fifa_code`、`position_group`(GK/DF/MF/FW)、`squad_no`、`player_name`、`player_name_zh`、`date_of_birth`、`age_at_tournament_start`、`club`、`club_country`、`height_cm`、`caps`、`international_goals`。
- **`squad_player_competition_stats`**：`goals`、`assists`、`scorer_rank`（世界杯射手榜，喂 `/scorers`）。

## 3. JOIN 方案（关键坑）
站内 `teams.name` ↔ squad `team_name` 多数一致，但 **7 个对不上**，需一张小别名映射（取自 processed `teams.json`）：

| 站内 `teams.name` | squad `team_name` | `fifa_code` |
|---|---|---|
| Cape Verde Islands | Cabo Verde | CPV |
| Iran | IR Iran | IRN |
| Ivory Coast | Côte D'Ivoire | CIV |
| South Korea | Korea Republic | KOR |
| Turkey | Türkiye | TUR |
| United States | USA | USA |
| Bosnia and Herzegovina | Bosnia And Herzegovina | BIH |

- 实现：复用站内已有的 `names.ts` 名称归一逻辑，补这 7 条；其余 41 队按 `team_name` 直配。
- 更稳的做法（可选）：给 `teams` 表加 `fifa_code` 字段、按 code JOIN（squad 侧已有 `fifa_code`）。但别名映射已够用。
- ⚠️ 实现前确认 `teams` 表是否已有 code/fifa 字段（本次核查未取到 teams 全列——安全分类器拦了带 key 的查库命令；schema 改从迁移文件 + processed JSON 读取，足够）。

## 4. 合规 do / don't（来自报告 §12 + schema）
- ✅ **能搬上预测站**：官方 26 人名单（名/号/位/俱乐部/年龄/caps/进球）、教练、平均年龄·身高、射手榜、中文名（886 个）。
- ❌ **别搬**：
  - **11 维游戏属性**（`0009` 的 `squad_player_game_attributes`，派生值）——贴到预测站会砸"诚实统计模型"招牌，留给游戏。
  - **球员照片**（Wikidata→Commons，授权署名链路未做）——补 license/author/attribution 前不展示。
  - **队徽 `fd_crest_url` / FIFA 标志 / 世界杯 Logo**（版权/商标）。
- ⚠️ FIFA 官方排名（`0009` 的 `squad_team_strength`）可作公开事实展示，但保持站内既定红线：**Elo 标"模型实力评分"、FIFA 排名单独标**，不混。

## 5. 实施路径（等排版会话收工后）
1. 新建 `src/lib/squad/getTeamSquad.ts`：`getServerSupabase()` 按别名映射查 `squad_teams` + `squad_players`（按 `position_group` 分组、`squad_no` 排序），`unstable_cache` 包一层（数据基本静态，revalidate 可长，如 86400）。
2. 队页 `/team/[slug]` 加「官方阵容 + 教练 + 平均年龄/总 caps」模块 → 命中 `[team] world cup 2026 squad/roster` 需求 + 加厚 AdSense 正文；`/zh` 用 `player_name_zh`/`team_name_zh`。
3. 叠加另一项队页加深（小组榜 + 本队出线情景，用站内 `standings.ts` + 计算器 clinch 逻辑）→ 队页成为「[队] WC2026 全内容中枢」。
4. 改 `team/[slug]/page.tsx` 是多会话热点文件 → 隔离提交、`git add <具体文件>`、不 `-A`。

## 6. 状态小结
- 数据：**在生产、可读（服务端 service client）、免 DDL**。
- JOIN：**已定（7 条别名映射）**。
- 合规边界：**已划清**。
- 唯一开放项：实现时确认 `teams` 是否有 code 字段（否则用别名表，已够）。
- 与 CodeX 协调：读的是它的游戏表（`squad_*`），用前知会一声即可（只读、不改其数据/权限）。
