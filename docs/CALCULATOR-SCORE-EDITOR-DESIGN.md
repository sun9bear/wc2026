# 出线计算器 · 精确比分编辑 实现设计

> 状态：设计定稿，待实现
> 日期：2026-06-19
> 影响面：`/calculator`（第三名出线计算器）；**纯前端 + 一行页面透传**，引擎与数据库零改动

---

## 1. 背景与目标

当前计算器只让用户点选**胜平负**，比分按固定约定折算净胜球：

```ts
// src/components/ThirdCalculator.tsx:163
const SCORE = { h: [1, 0], d: [1, 1], a: [0, 1] };
```

问题：最佳第三名 12 取 8 的生死线判据是 **净胜球 → 进球数**（见 `src/lib/prob/standings.ts:3` 注释与 `cmp3`）。固定比分让每场胜场净胜球恒为 +1，把第三名排名里最关键的「边际」信息压平了——而那恰恰是这工具最招眼、最有争议的输出。

**目标**：让用户能为单场比赛填**精确比分**，并提供「模型最可能比分」一键填入的便捷入口；用户随时可手改。

**设计红线（不可破坏当前工具的命根）**：
- **透明**：比分始终由用户可见、可控；模型比分是「用户主动点击接受的建议」，绝不静默注入。
- **零回归**：页面打开时的默认排名与今天**一字不差**（仍是 1-0/1-1/0-1）。realism 为 opt-in。
- **自洽**：用户设的比分和他选的赛果永远一致（不存在「点了主胜却记成 1-1」）。
- **合规**：只用「模型最可能比分 / Most likely (model)」措辞，**严禁** 正确比分 / correct score / 赔率 / odds 等字眼（沿用 `ScoreProbs.tsx` 的口径）。

---

## 2. 现状（代码事实）

| 关注点 | 位置 | 现状 |
|---|---|---|
| 比分约定表 | `ThirdCalculator.tsx:163` | `SCORE = {h:[1,0],d:[1,1],a:[0,1]}` |
| 用户选择状态 | `ThirdCalculator.tsx:183` | `picks: Record<string,"h"\|"d"\|"a">`，**仅内存 `useState`，不入 URL** |
| 结果拼装 | `ThirdCalculator.tsx:195-201` | `played + remaining.map(用 SCORE 折算)` → `rankGroup/rankThirds` |
| 已完赛锁定渲染 | `ThirdCalculator.tsx:319-350` | 锁定真实比分，活动格显示 `🔒 H-A` |
| 剩余场可点按钮 | `ThirdCalculator.tsx:351-376` | 三按钮 `h/d/a` |
| 模型最可能比分 | `pipeline.ts:229` `topScores(cal.matrix,5)` | **已算好**，挂在 `MatchView.topScores`（`{h,a,p}[]`），已落库 `prob_match_snapshots.top_scores` |
| 页面透传 | `calculator/page.tsx:204-209` | 只转发 `{id,homeId,awayId,likely}`，**丢弃了 topScores** |
| 排序判据 | `standings.ts` `rankGroup/rankThirds` | 直接吃 `GroupResult{homeGoals,awayGoals}`，**与比分表示无关** |
| 可复用：底部面板 | `SettleDrawer.tsx:286-339` | `fixed inset-x-0 bottom-* z-50 … max-w-xl rounded-lg border bg-surface shadow-glow` + `TXT: Record<Locale,…>` 六语 |
| 可复用：比分芯片 | `ScoreProbs.tsx:96-112` | `s.h-s.a` + 概率条 + `pct()`；`Side` 渲染队旗+队名 |

**结论**：所需数据（`topScores`）已存在于管道输出，排序逻辑无需改动。改动集中在「状态表示 + 一个底部弹层 + 一行页面透传」。

---

## 3. 交互设计

### 3.1 总览：双层交互（快路 + 细调），realism 全程 opt-in

```
每场剩余比赛行（沿用现布局，零额外占位）：
┌─────────────────────────────────────────────┐
│  墨西哥   [ 1-0 ✎ ] [  平  ] [ 客胜 ]   韩国   │   ← 三按钮即"快路"
└─────────────────────────────────────────────┘
        ▲ 活动赛果格显示当前精确比分(默认 1-0)，带 ✎；点它=开浮层细调
        其余两格显示 平/客胜 标签；点=切换赛果(填该赛果的平铺比分)，成为新活动格
```

- **快路（1 次点击，= 今天的体验）**：点「平」「客胜」切换赛果，填入该赛果的**平铺比分**（1-1 / 0-1），活动格随即显示该比分。`我全胜/我全平` 预设照旧。
- **细调（opt-in）**：点**已激活**那一格的 `✎`（或长按任意格）→ 弹出底部「比分浮层」。
- 设计取舍：**保留三按钮**是为守住「1 次点击翻赛果」的核心手感（尤其 `我全胜` 探索）；精确比分**复用既有「活动格显示比分」的视觉**（见 `ThirdCalculator.tsx:343` 已完赛 `🔒 H-A` 同款），**不新增任何行内占位**。

### 3.2 比分浮层（新组件 `ScoreSheet`）

底部弹层（复用 `SettleDrawer` 容器样式），自上而下：

1. **标题行**：`队A 旗+名  vs  队B 旗+名`（复用 `ScoreProbs` 的 `Side`），右上角 `✕`。
2. **当前比分 + 步进器**：`[ − ] 大号 H [ + ]   :   [ − ] 大号 A [ + ]`，每侧 0–9 夹取。
3. **模型最可能比分**（核心便捷入口）：`topScores` 前 3 个做芯片，带概率：
   `「2-1 · 18%」「1-1 · 14%」「2-0 · 11%」`，点击=填入并高亮。
   - 文案标签：`模型最可能` / `Most likely (model)`（合规口径）。
   - 若该场 `topScores` 为空（极端降级）→ 整行隐藏，仅留步进器 + 常见比分。
4. **常见比分**：`1-0 / 2-0 / 2-1 / 1-1 / 0-0 / 0-1` 固定芯片。
5. **底部**：`完成`（关闭）/ `重置本场`（回该场默认平铺比分）。

> 浮层只读不写服务端；纯 props 受控。移动端为底部 sheet，桌面端同一组件居中或贴底均可（沿用 `SettleDrawer` 的 `max-w-xl mx-auto`）。

### 3.3 默认值 / 重置 / 焦点预设

| 行为 | 比分 | 说明 |
|---|---|---|
| 页面初始 | `FLAT[m.likely]`（=今天） | **零回归**：默认排名与现状一致 |
| 切换赛果（点平/客胜） | `FLAT[opt]` | 平铺，符合「只想让谁赢」的直觉 |
| 浮层「重置本场」 | `FLAT[m.likely]` | 单场回默认 |
| 顶部「↺ 重置」 | 全部回 `FLAT[m.likely]` | 同今天语义 |
| 「我全胜」 | 焦点队场次 → 1-0(主)/0-1(客) | 平铺最小胜，语义不变 |
| 「我全平」 | 焦点队场次 → 1-1 | 不变 |

其中 `FLAT = { h:[1,0], d:[1,1], a:[0,1] }`（即原 `SCORE` 改名）。

---

## 4. 实现改动

### 4.1 引擎 / 管道：零改动

`topScores` 已在 `pipeline.ts:229` 计算并挂 `MatchView.topScores`。无需碰 `poisson.ts` / `standings.ts` / `simulate.ts` / DB。

### 4.2 页面透传（一行）

```ts
// src/app/calculator/page.tsx:204
const remaining = data.matches.map((m) => ({
  id: m.id,
  homeId: m.homeId,
  awayId: m.awayId,
  likely: m.likely,
  topScores: m.topScores,   // ← 新增：透传模型最可能比分
}));
```

### 4.3 类型扩展

```ts
// src/components/ThirdCalculator.tsx
export interface CalcMatch {
  id: string;
  homeId: string;
  awayId: string;
  likely: "h" | "d" | "a";
  topScores: { h: number; a: number; p: number }[];   // ← 新增
}
```

### 4.4 状态模型：picks 由「赛果」改为「比分」

```ts
type Pick = [number, number]; // [homeGoals, awayGoals]
const FLAT: Record<"h" | "d" | "a", Pick> = { h: [1, 0], d: [1, 1], a: [0, 1] };

const [picks, setPicks] = useState<Record<string, Pick>>(() =>
  Object.fromEntries(remaining.map((m) => [m.id, FLAT[m.likely]]))
);
const [editing, setEditing] = useState<string | null>(null); // 当前开浮层的 matchId
```

派生赛果（用于高亮活动格）：

```ts
const outcomeOf = ([h, a]: Pick): "h" | "d" | "a" => (h > a ? "h" : h < a ? "a" : "d");
```

### 4.5 结果拼装（抽成纯函数，便于单测）

新增 `src/lib/prob/calcResults.ts`：

```ts
import type { GroupResult } from "./types";
export type Pick = [number, number];

/** 把"已完赛 + 用户所选剩余比分"合成 rankGroup/rankThirds 所需的结果集。纯函数，可单测。 */
export function buildCalcResults(
  played: GroupResult[],
  remaining: { id: string; homeId: string; awayId: string }[],
  picks: Record<string, Pick>,
  fallback: Record<string, Pick>
): GroupResult[] {
  return [
    ...played,
    ...remaining.map((m) => {
      const [homeGoals, awayGoals] = picks[m.id] ?? fallback[m.id];
      return { homeId: m.homeId, awayId: m.awayId, homeGoals, awayGoals };
    }),
  ];
}

export const clampGoal = (n: number) => Math.max(0, Math.min(9, Math.round(n)));
```

组件内 `useMemo` 改为调用 `buildCalcResults(played, remaining, picks, fallbackMap)`，其余（`rankGroup` 12 组 → `rankThirds`、单 RNG 实例 `mulberry32(1)`）**完全不变**。

### 4.6 剩余场渲染（替换 `ThirdCalculator.tsx:351-376`）

```tsx
{remaining.filter(...).map((m) => {
  const pick = picks[m.id] ?? FLAT[m.likely];
  const active = outcomeOf(pick);
  return (
    <div key={m.id} className="mb-1.5 flex items-center gap-2 text-xs">
      <span className="w-20 shrink-0 truncate text-right">{label(...home)}</span>
      <div className="flex flex-1 gap-1.5">
        {(["h","d","a"] as const).map((opt) => {
          const isActive = active === opt;
          return (
            <button key={opt} type="button"
              onClick={() => isActive ? setEditing(m.id)               // 点活动格 → 开浮层
                                      : setPicks(p => ({...p,[m.id]: FLAT[opt]}))} // 切赛果 → 平铺
              className={isActive ? "…绿色活动…" : "…默认…"}>
              {isActive ? `${pick[0]}-${pick[1]} ✎` : t[opt]}
            </button>
          );
        })}
      </div>
      <span className="w-20 shrink-0 truncate">{label(...away)}</span>
    </div>
  );
})}
```

### 4.7 新组件 `ScoreSheet`（受控）

```ts
// src/components/ScoreSheet.tsx
export function ScoreSheet(props: {
  locale: Locale;
  home: { name: string; zh: string; flag: string | null };
  away: { name: string; zh: string; flag: string | null };
  value: [number, number];
  suggestions: { h: number; a: number; p: number }[]; // = match.topScores
  onChange: (v: [number, number]) => void;
  onReset: () => void;
  onClose: () => void;
}): JSX.Element
```

- 容器/样式复用 `SettleDrawer.tsx:286-289`；芯片/`pct()`/`Side` 复用 `ScoreProbs.tsx`。
- 六语 `TXT: Record<Locale,{title,suggested,common,reset,done}>`（见 §5）。
- 在 `ThirdCalculator` 中单实例渲染，`editing` 控制开关；`onChange` → `setPicks`，`onReset` → 写 `FLAT[m.likely]`。

### 4.8 顶部说明文案更新

```
ThirdCalculator.tsx:49 convention（zh）
旧：比分按 主胜1-0 / 平1-1 / 客胜0-1 估算净胜球；判据按 2026 官方新规（不含公平竞赛分）。
新：默认比分 主胜1-0 / 平1-1 / 客胜0-1，可点单场自定义精确比分；判据按 2026 官方新规（不含公平竞赛分）。
```
（en/es/pt/de/fr 同步，措辞见 §5。）

---

## 5. i18n 文案键（6 语：zh/en/es/pt/de/fr）

新增到组件 `TXT` 与 `ScoreSheet` `TXT`：

| key | zh | en |
|---|---|---|
| `editHint`（✎ 提示/aria） | 点比分可自定义 | Tap score to edit |
| `sheetTitle` | 设置比分 | Set the score |
| `suggested` | 模型最可能 | Most likely (model) |
| `common` | 常见比分 | Common scores |
| `resetMatch` | 重置本场 | Reset match |
| `done` | 完成 | Done |
| `convention`（改写） | 默认比分 主胜1-0/平1-1/客胜0-1，可点单场自定义精确比分；判据按 2026 官方新规（不含公平竞赛分）。 | Default scores 1-0/1-1/0-1; tap any match to set an exact score. 2026 official tiebreakers (fair play excluded). |

es/pt/de/fr 按现有 `TXT`/`COPY` 风格补齐（参照 `SettleDrawer`/`ScoreProbs` 既有六语）。

---

## 6. 合规

- 芯片与标题只用 `模型最可能 / Most likely (model)`、`常见比分 / Common scores`。
- **禁止**：正确比分、correct score、赔率、odds、投注、bet、串关赔付等（沿用 `findBannedTerms` 红线与 `ScoreProbs.tsx:1-3` 注释口径）。
- 模型比分定位为「建议」，用户点击即接受；页面文案不暗示「该比分会发生」。

---

## 7. 边界与校验

- 进球数夹取 `0..9`（`clampGoal`；引擎 `SCORE_MAX=8`，UI 卡 9 足够覆盖且防离谱输入）。
- 已完赛场次：**不可编辑**，渲染逻辑不动（`ThirdCalculator.tsx:319-350`）。
- `topScores` 缺失/为空：浮层隐藏「模型最可能」整行，步进器+常见比分仍可用（fail-soft）。
- 客户端/服务端 RNG 一致性：`mulberry32(1)` 单实例顺序不变，结论稳定（保持 `ThirdCalculator.tsx:202-204` 注释约束）。

---

## 8. 验证计划

**单测（新增 `src/lib/prob/calcResults.test.ts`）**
- `buildCalcResults`：缺省回退、用户比分覆盖、played 不被改写。
- `clampGoal`：边界 0/9/负数/小数。
- 回归：构造一个「同分仅净胜球分先后」的第三名场景，断言改单场比分能把第 8/9 名对调（证明 net-goal 通路打通）。`standings.test.ts` 既有用例无需改。

**预览（preview_* 工作流）**
1. 打开 `/calculator`，确认初始 12 组表与现状一致（零回归）。
2. 某场点活动格 → 浮层 → 点「模型最可能」芯片 → 表实时重排；改步进器再验。
3. 把某弱队第三名场次设大比分 → 看其在最佳第三名榜越过出线线。
4. 「重置本场 / ↺ 重置 / 我全胜」行为正确。
5. 已完赛场不可编辑；移动端 sheet 布局与点击区。
6. 切 en/zh 验证文案与合规词。

---

## 9. 工程量与分期

### Phase 1（本设计核心，半天级）
状态重构 + `ScoreSheet` + 一行透传 + 六语文案 + 单测。**引擎/DB/排序零改动**。

| 文件 | 改动 |
|---|---|
| `src/app/calculator/page.tsx` | +1 行透传 `topScores` |
| `src/components/ThirdCalculator.tsx` | 状态 `Pick`、剩余场渲染、接 `ScoreSheet`、文案 |
| `src/components/ScoreSheet.tsx` | 新增（受控底部弹层 + 六语） |
| `src/lib/prob/calcResults.ts` (+ `.test.ts`) | 新增纯函数 + 单测 |

### Phase 2（可选，net-new 价值：可分享剧本）
当前分享只带 `?team=`，**沙盘状态根本没入 URL**（`ThirdCalculator.tsx:183` 仅 `useState`）。可把「非默认场次」编码进 URL（如 `?s=…`，仅存偏离默认的场），首次实现「分享我排的剧本」——契合串关/裂变定位。

- 编码键稳定性：避免用会变的「剩余场序号」；建议用 `match.id` 短哈希或 `external_id`，只编码偏离 `FLAT[likely]` 的场次以压短。
- 落地点：与 `HeaderShare` / `CalculatorFocus` 串起来；URL → 初始 `picks` 注水。
- 独立于 Phase 1，可后置。

---

## 10. 明确不做

- **不**自动用模型比分当默认（破坏「用户驱动 + 零回归 + 自洽」三红线；用户主动点击 ≠ 静默注入）。
- **不**改排序判据 / 引擎 / 蒙特卡洛 / 数据库。
- **不**引入「正确比分预测/赔率」类玩法或措辞。
- Phase 2 URL 编码本期**可不做**。

---

## 11. 风险与缓解

| 风险 | 缓解 |
|---|---|
| 细调比快路贵（多一步） | 三按钮保 1-tap 快路；模型芯片让「要 realism」也仅多 1 tap |
| 用户困惑「活动格怎么变成比分了」 | 活动格带 `✎` + `editHint`；沿用已完赛 `🔒 H-A` 同款视觉，认知一致 |
| 移动端行内空间 | 复用活动格显示比分，**零新增占位**；浮层承载所有细节 |
| `topScores` 降级为空 | 浮层 fail-soft，仅隐藏建议行 |
