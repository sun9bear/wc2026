# P2-2：多语种扩展（es / pt / de / fr）— 新会话交接 spec

> 状态：**进行中（staged，未激活）**｜分支：`feat/legal-pages`｜产出 2026-06-14
> 已落地并提交（全绿、行为零变化、未对用户暴露）：**A0** 工单（§12）、**A1** 路由配置驱动重构（locales.ts，commit d86e1be）、**A2** 4 语 UI 字典（satisfies Dict，未挂 dicts，commit 7cd7c78）、**A6 国名表** 192 条（NATIONS 必填字段，commit 86180e7）、**A3-rules** 出线规则页 4 语 COPY（staged）。
> 剩余：**A3**（各页 COPY，含 about/rules + 法务页 privacy/disclaimer 需母语/法务校对）、**A4**（85 裸三元）、**A5**（canonical/sitemap/layout META）、**A6 余**（签名加宽 + 赛段/组名）、**A7**（合规扫描 + 部署）。这些多需「加宽 Locale」一次性激活（不可再增量绿），建议新会话冷启动集中做。
> 用途：新会话凭本文件冷启动接手「把站点从中英双语扩成 6 语种（+西/葡/德/法）」。
> 节奏（用户已定）：**先 A 后 B、四语一起上**。A=外壳本地化（UI+SEO 落地页全量翻译，AI 比赛短文新语种回落英文）；B=给 4 个新语种各自生成入库的 AI 比赛内容。
> 前置必读：`docs/P2-1-i18n-hreflang-HANDOFF.md`（本任务是它结尾预留的「小语种扩展」，`wc_country` cookie 已为此预埋）、`docs/SEO-GEO-PLAN.md`、Claude 记忆文件。
> **强烈建议新会话冷启动**：[1m] 长会话按长上下文费率重读全部历史，成本极高（P2-1 实测一轮可达数百刀）。本任务工程量大，按 §5/§6 分步、必要时跨多会话。

---

## 0. 冷启动一句话
> 读 `docs/P2-2-i18n-es-pt-de-fr-HANDOFF.md` + `docs/P2-1-i18n-hreflang-HANDOFF.md` 接手 wc2026，做 P2-2：在已有 zh/en per-locale 基础设施上扩出 es/pt/de/fr 四个语种。先做 Phase A（外壳本地化），完整干净上线后再评估 Phase B（AI 内容）。生产部署已授权，可自行确认。**Phase A 零 DDL；先把 `Locale` 类型加宽让 tsc 当工头，再按分步走。**

## 1. 目标与收益 / 范围

- **现状（好消息）**：站点**已是中英双语**，P2-1 已落地完整 i18n 基础设施——per-locale URL（en 根、`/zh` 前缀）+ 中间件 `proxy.ts` 注入 `x-locale` 头 + reciprocal hreflang + 各 locale 独立 self-canonical + 双语 AI 内容管线。**本任务是「把二选一扩成多选一」，不是从零搭建。**
- **市场**：西/葡是世界杯流量最大的两个语种市场（拉美/巴西/伊比利亚），德法次之；差异化 SEO 资产（第三名计算器 `/calculator`、出线形势 `/calculator/group/[letter]`、48 个球队页 `/team/[slug]`）正是可被各语种独立收录的面。
- **范围切分（成本驱动）**：
  - **Phase A — 外壳本地化（约 7–9 人日）**：UI 字典、23 个就地 `COPY` 对象、85 处裸三元、4 个法务/说明长文页、192 条国名翻译（§4③）、teams/OG/sitemap/hreflang 全量 es/pt/de/fr 化。每场比赛的 AI 短文（preview/recap/sentiment）新语种**回落英文或省略**——零额外 AI 成本、零新增合规面。
  - **Phase B — AI 内容本地化（+约 4–6 人日 + 4× AI 调用成本）**：给 es/pt/de/fr 各建本地化 AI 管线 + **4 套去博彩化合规雷词库**（最高风险项）+ cron 泛化。
- **四语齐上的经济性**：基础设施（路由/类型/hreflang/sitemap/扫描器）只做一次；翻译是 4× 但机械且 TS 强制完整。逐个加反而重复改基础设施，所以**一次性四语是对的**。

## 2. 当前实现（动手前必读，附文件位置 + 已核实行为）

### 2.1 语言判定与路由（P2-1 已落地）
- `src/i18n/index.ts`：`type Locale = "zh" | "en"`；`Dict` 接口；`dicts: Record<Locale,Dict> = { zh, en }`；`getDict(locale)`；**`localeHref(locale, path)`**（en→原样、zh→`/zh`+path，`/` 特判）；**`stripLocale(pathname)`**（剥 `/zh` 前缀）。
- `src/i18n/server.ts`：`getLocale()` —— 优先 `x-locale` 请求头（中间件按 URL 注入，**权威来源**）→ 降级 `NEXT_LOCALE` cookie → 降级 Accept-Language 正则。仅服务端用。
- `src/i18n/LocaleContext.tsx`：`LocaleProvider`/`useLocale`，根 layout 把权威 locale 下发给客户端子树（客户端读不到 `x-locale` 头）。
- `src/proxy.ts`（Next middleware，文件名是 proxy 不是 middleware）：`isZh = path==="/zh"||startsWith("/zh/")` 二元判定 → 注入 `x-locale` 头；zh 走 `NextResponse.rewrite` 剥前缀到内部无前缀路由（URL 栏保持 `/zh`）。matcher 跳过 `(?:zh/)?(?:_next/|api/|favicon|og\.png|robots|sitemap)`。
- `src/components/LangToggle.tsx`：**二元切换按钮**（`next = locale==="zh"?"en":"zh"`），整页导航 `window.location.assign(localeHref(next, stripLocale(pathname)))`。

### 2.2 文案的两种模式（工作量与风险的核心区分）
1. **集中字典**：`src/i18n/messages/{zh,en}.ts`（约 95 条字符串，`Dict` 接口约束）。覆盖 nav/footer/hero/match/combo/me/leaderboard/tiers/ach。
2. **就地 `const COPY = { zh, en } as const` + `COPY[locale]`**：**23 个文件**（grep 命中）。含全部法务/说明页（about 160 行 / rules 173 / privacy 181 / disclaimer 131，0 裸三元，纯 COPY）+ team 页（约 30 键 COPY）+ calculator/forecast/group/best-thirds 等。
3. **裸三元 `locale === "zh" ? 中文 : 英文`**：**85 处 / 31 文件**（grep 命中）。集中在 `api/og/route.tsx`(17)、`match/[id]/page.tsx`(14)、`team/[slug]/page.tsx`(8)、share 库（`swingShare.ts` 5 / `matchCard.ts` 1）。

> **关键差异（决定改法）**：
> - 模式 2（`COPY[locale]`）**TS 强制**——`Locale` 一加宽，所有 `COPY[locale]` 立即编译报错（缺 es/pt/de/fr 键）。安全网，机械补齐即可。
> - 模式 3（裸三元）**TS 不报错**——新语种会**静默回落到英文分支**。必须逐处 grep 揪出，且要分两类：
>   - **文案型**（`locale==="zh" ? "中文标题" : "English title"`）→ **必改**为按 locale 取值，否则西/葡/德/法用户看到英文。
>   - **数据选择型**（`locale==="zh" ? d.zh : d.name`，选队名/对手名/日期格式）→ 新语种**回落英文数据可接受**（Phase A），或经 teams.ts 表升级（可选）。

### 2.3 队名 / 赛段名 / 日期
- `src/lib/football/teams.ts`：`teamName(name, locale: "zh"|"en")`（en 直出、zh 查 `NATIONS` 表）、`stageName`、`groupName`、`flagUrl`（flagcdn，与语种无关）。**签名硬编码 `"zh"|"en"`** → Locale 加宽后调用点 TS 报错（这是好事，tsc 会逼你处理）。
- `src/components/LocalTime.tsx`：`toLocaleString(locale==="zh"?"zh-CN":"en-US")` 之类——需补 4 个 BCP-47 日期 locale。

### 2.4 SEO 元数据 / sitemap / 合规闸
- `src/lib/seo/canonical.ts`：`localizedAlternates(path, locale)` 产出 `{ canonical, languages: { en, "zh-Hans", "x-default" } }`；`selfUrl(path, locale)`。**全站唯一 hreflang 真理点**——改这里一处即全站生效。
- `src/app/sitemap.ts`：`expand()` 每逻辑页展开 en+zh 两条 URL + reciprocal `alternates.languages`；fail-closed catch 只回静态页。
- `src/app/layout.tsx`：`META = { zh, en }`（title/description/og/ogLocale/altLocale）；`generateMetadata` + siteJsonLd（WebSite/Organization，`inLanguage`）；`<html lang={locale}>`。
- `scripts/seo-compliance-scan.ts`：扫 en+zh 真实 URL 的雷词（**部署阻断闸**）。`src/lib/seo/indexnow.ts`、`public/llms.txt`：含 zh 树。

### 2.5 AI 比赛内容（Phase B 的面）
- `src/lib/ai/content.ts`：zh 管线（DeepSeek，`generatePreview/Recap/Sentiment`）+ en 管线（Gemini，`generate*En`）。各带**本地化合规 system prompt**（禁博彩词族）+ `safeGen` 护栏（生成→雷词 lint→重试→兜底文案，fail-closed）。
- `src/lib/compliance/bannedTerms.ts`：`BANNED: Record<"zh"|"en", string[]>` —— **只有中英两套**。`findBannedTerms`（词边界，正文用）/`findBannedTermsStrict`（NFKC 归一+去零宽，身份字段用）/`assertClean`。
- `src/lib/ai/store.ts`：`upsertContent(db, matchId, type, body)`，依赖 `ai_content` 的 `unique(match_id, type)`。**内容按 `type` 字符串区分，非按列**——zh 用 `preview/recap/sentiment`，en 用 `preview_en/recap_en/sentiment_en`。
- `src/lib/markets/getMatchDetail.ts`：`byType()`（zh 雷词闸）/`byTypeEn()`（en 雷词闸）分别取 6 个字段。
- `src/app/api/cron/gen-content/route.ts`：**英文回填 cron**（硬编码 en，Gemini）。settle 路由另生成 recap。

## 3. 红线（不可破，沿用 P2-1 §3）

1. **「必须干净做或不做」**：每个新 locale 上线即带**完整 reciprocal hreflang + 独立 self-canonical**。活跃 core-update 季半成品有害——某语种来不及干净落地就**整个推迟**，不 ship 一半。
2. **不破坏已收录的根 EN / `/zh` URL**：新语种是**新增的前缀树**（`/es /pt /de /fr`），与 zh 同款**纯增量**，对现有 URL 零 301。沿用 P2-1 的 A2（rewrite + `x-locale` 头）实现，不动文件结构。
3. **合规雷词扫描是部署阻断闸**：
   - Phase A——4 个新 locale 的**静态/翻译文案**上线前必须过雷词扫描（人工翻译误用博彩词在 AdSense 审核期是致命的）。
   - Phase B——4 套**新语种雷词库**是全任务最高风险项（见 §6.1）。
4. **不暴露后端数据源**（Polymarket/博彩品牌），对外只 "public forecasting data"——所有语种适用。
5. **Phase A 与 Phase B 均零 DDL**：Phase A 纯前端/路由/文案；Phase B 的 AI 内容靠 `ai_content` 既有 `unique(match_id,type)` 加新 `type` 字符串（如 `preview_es`）**加行**即可，**无新表、无需 Supabase 隧道/GRANT**。

## 4. 架构决策

### 已定（用户 2026-06-14 全部确认）
- **URL 方案**：沿用 P2-1 的 A——en 留根（x-default），其余语种带前缀。新增 `/es /pt /de /fr`。
- **实现路径**：沿用 A2（`proxy.ts` rewrite + `x-locale` 头，不挪 `src/app/*` 路由结构）。
- **四语齐上、先 A 后 B。**
- **① hreflang 码 = 语言级** `es` / `pt` / `de` / `fr`（+现有 `en` / `zh-Hans` / `x-default`→en）。**一语种一 URL**，不拆 `/pt-BR /pt-PT`（避免 URL/翻译/sitemap 翻倍、维护爆炸）。
- **② 西/葡口吻 = 拉美西语 + 巴西葡语**（覆盖人口最大市场）。仅影响翻译用词与 `ogLocale`，**不拆 URL**。de/fr 用标准书面体。
- **③ 国名本地化 = Phase A 同步补 192 条**（48 国 ×4 语，teams.ts `NATIONS` 表加 es/pt/de/fr 名）。**不走英文回落**。
- **④ Phase B = A 上线后再定**：先把 Phase A 全量干净上线、观察 4 语收录效果，再决定 B 是否启动及怎么排。**Phase A 不依赖 B。**

### 待用户确认
- 无（§4 决策已全部敲定）。下一处需拍板点见 §11（上线后 GSC 收录请求）。

## 5. Phase A 实施分步（外壳本地化；每步独立 build/验证）

> 核心策略：**先加宽 `Locale` 类型让 tsc 把模式 2（COPY[locale]）的活儿全亮成编译错误**，「修到 tsc 净」就是模式 2 的完成定义；模式 3（裸三元）tsc 抓不到，**另用 grep 清剿**。

### A0. 加宽 Locale 类型（让 tsc 当工头）— ✅ 已实测（2026-06-14，已还原）
- `src/i18n/index.ts`：`type Locale = "zh" | "en" | "es" | "pt" | "de" | "fr"`。
- 立即 `npx tsc --noEmit` —— **实测得 80 错误 / 26 文件**（明细见 §12）。已还原回 `"zh"|"en"`，代码树现为绿；正式开工第一步就是重做这行 + 照 §12 工单修到 tsc 净。
- **这份错误清单 = A2/A3/A6（模式 2 + 函数签名）的精确逐行工单**；**注意 85 处裸三元（模式 3）不在其中**（tsc 抓不到），归 §A4 单独 grep 清剿。

### A1. 路由 + locale 解析泛化（基础设施，一次性）

**✅ 已落地（2026-06-14，配置驱动重构，behavior-identical，build/test 全绿，已提交 feat/legal-pages）**
- 新建 `src/i18n/locales.ts`（**纯叶子模块**，无字典依赖，proxy 可安全 import）：单一真理源 `Locale` / `DEFAULT_LOCALE="en"` / `LOCALES` / `PREFIXED_LOCALES=["zh"]` / `isLocale()` / `localeHref()` / `stripLocale()`——后两者改为**遍历 `PREFIXED_LOCALES`**（en 留根、其余加 `/<locale>`），当前 `["zh"]` 故行为与重构前完全一致。
- `src/i18n/index.ts`：`Locale` 类型与 `localeHref/stripLocale` 迁出到 `./locales`，此处**再导出**（39 处 `@/i18n` import 路径不变）；保留 `Dict`/`getDict`/`dicts`。
- `src/i18n/server.ts` `getLocale()`：改用 `isLocale()` 收窄 + `DEFAULT_LOCALE` 兜底（x-locale/cookie/Accept-Language 优先级与 zh 正则**原样**，行为不变）。
- `src/proxy.ts`：前缀检测从硬编码 `isZh` 改为**遍历 `PREFIXED_LOCALES`**（首段命中即 rewrite 剥前缀 + 注入 `x-locale`），import `./i18n/locales`（叶子，不撑大 edge 包）。
- 回归闸：新增 `src/i18n/locales.test.ts`（11 例，锁死 en 留根 / zh 加前缀 / 互逆 / 不误伤 `/zhang` / 配置自洽）。验证：tsc 净、vitest 155 全过、eslint 0、`next build` 净（中间件正常编译）。

**⬜ 激活新语种时补（与 A2–A7 一起，等翻译就绪后一次性打开，避免半成品上线破红线 1）**
- `src/i18n/locales.ts`：`Locale` 类型 + `PREFIXED_LOCALES` + `LOCALES` 各加 `es/pt/de/fr`（**改这一处，localeHref/stripLocale/getLocale/proxy 自动生效**）。
- `src/i18n/server.ts`：`getLocale()` 的 Accept-Language 兜底按需加 es/pt/de/fr 语言匹配（现仅 zh 有特例）。
- `src/proxy.ts`：**matcher 字面量**手动把 `(?:zh/)?` 扩成 `(?:(?:zh|es|pt|de|fr)/)?`（matcher 须静态，读不到数组——已在文件内注释提醒）。
- `src/components/LangToggle.tsx`：二元按钮 → **多语下拉选单**，遍历 `LOCALES` 渲染；母语自称表（中文 / English / Español / Português / Deutsch / Français）。
- **验证**：`curl` 无 Accept-Language 访问 `/es/forecast` 返回西语外壳、`/forecast` 仍英文、`/zh/forecast` 仍中文。

### A2. UI 字典 ×4 — ✅ 文件已建（2026-06-14，staged 未挂 dicts；tsc/eslint 净、合规词扫描 0 命中）
- 新建 `src/i18n/messages/{es,pt,de,fr}.ts`（各 ~95 键），以 **`satisfies Dict`** 独立受 tsc 完整性校验（缺键/错形即编译报错），**暂不挂进 `dicts`、不动 `Locale`**——故全绿、可独立提交，不暴露半成品（守红线 1）。
- 口吻：es=拉美西语、pt=巴西葡语、de/fr=标准书面体（§4②）。`langLabel` 暂填各语种母语自称（Español/Português/Deutsch/Français），LangToggle 下拉激活时统一改由 `LOCALES` 驱动。
- 合规：各文件顶部保留 en.ts 式禁词红线注释；UI 文案已避开博彩词族（apuesta/aposta/Wette/pari/cote/cuota/odd/casino…，de 用非博彩的 Tipp/Tippspiel）——grep 仅命中注释行、正文 0 命中。
- **⬜ 激活时补**（与 A0 加宽一并）：`Locale` 加 4 值后，把 `es/pt/de/fr` 挂进 `src/i18n/index.ts` 的 `dicts`（`satisfies Dict` 已保证可赋给 `Record<Locale,Dict>`）。建议母语者校对一遍文案（尤其 langLabel/缩写）。

### A3. 就地 COPY 对象 ×23 文件补键（tsc 驱动）
- **✅ rules 页已 staged（2026-06-14）**：`COPY` 补 es/pt/de/fr（含小组排名 / 最佳第三名判据全文——差异化 SEO 资产）；tsc/eslint/vitest 净、合规词 0 命中。
- **⚠️ 结构发现（影响 A3/A4 排期）**：`about` 页**不是** `COPY[locale]` 字典——正文是 `if (locale==="en") return <整段英文 JSX> … return <整段中文 JSX>` 两段硬编码分支（仅 `META` 是字典）。新语种需**先把正文重构成模板/字典**（属 A4，且正文嵌 `<strong>`，改 SEO 页正文宜起服务渲染核对、不盲改）——留激活会话。**激活前需排查其它同类「整段 locale 分支」页**（grep `if (locale === "en")` / `return ( ... )` 双分支）。
- 其余按 A0 的 tsc 错误清单逐文件给 `COPY` 补 `es/pt/de/fr` 块。重点长文：
  - **法务/说明页**：`privacy`/`disclaimer`（含法律免责声明，**德/法辖区建议过法务审或母语校对**）、`about`（需先重构正文结构，见上）。这是 Phase A 最重的纯翻译块。
  - team 页 `COPY`（约 30 键，含 `title/desc/lead/shareText` 等函数式文案）、calculator/forecast/group/best-thirds。
- 修到 `npx tsc --noEmit` 净 = 模式 2 完成。

### A4. 裸三元清剿（grep 驱动，模式 3）
- `grep -rn 'locale === "zh"' src`（85 处）逐一三元分类处理：
  - **文案型** → 抽进对应页 `COPY` 或全局 `Dict`，改 `COPY[locale]`/`t.xxx`（避免再留 `?:`）。重灾区：`match/[id]/page.tsx`（title/description/JSON-LD/OG 文案 14 处）、`api/og/route.tsx`（17 处，见 A6）。
  - **数据选择型**（`?d.zh:d.name`、`?r.oppZh:r.oppName`、`?"zh-CN":"en-US"`）→ 改成「zh 用本地字段，其余回落英文字段」；日期改 BCP-47 locale 映射表。
- **完成定义**：`grep -rn 'locale === "zh"' src` 仅剩「zh vs 其余」语义正确的判定，无任何「把英文当非-zh 兜底的文案型三元」。

### A5. canonical / hreflang / sitemap / layout META（基础设施）
- `src/lib/seo/canonical.ts` `localizedAlternates`：`languages` map 补 `es/pt/de/fr`（用 §4 敲定的 hreflang 码），canonical 按当前 locale 选 `localeHref(locale, path)`。**改这一处全站页面的 hreflang 即生效。**
- `src/app/sitemap.ts` `expand()`：从「en+zh 两条」改为**遍历 6 locale 出 6 条** + 6 路 reciprocal `alternates.languages`。URL 量 ×3（注意 sitemap 体积，仍 fail-closed）。
- `src/app/layout.tsx`：`META` 补 4 语（title/description/ogDescription/siteName/appName/ogLocale=es_MX/pt_BR/de_DE/fr_FR——es 用 es_MX 贴合拉美口吻+东道主墨西哥，§4②）；`altLocale` 单值概念改为 `openGraph.alternateLocale` 数组（其余 5 locale）；siteJsonLd `inLanguage` 随 locale；`<html lang>` 已随 locale 无需改。
- `src/lib/seo/indexnow.ts`、`public/llms.txt`：补 es/pt/de/fr 树 URL。

### A6. teams.ts / LocalTime / OG 卡
- `src/lib/football/teams.ts`：**✅ `NATIONS` 表已扩（2026-06-14，staged，commit `8…`）**——`Nation` 接口加 es/pt/de/fr **必填**字段（tsc 强制每条齐全），66 条（含别名）×4 名全部补全（§4③，不回落英文）；变音符已处理（Türkiye/Côte d'Ivoire/Curaçao/Ägypten/Österreich 等）。tsc 净、155 测试不受影响、eslint 0。建议母语者抽查拼写。
  - **⬜ 激活时补**：`teamName/stageName/groupName` 签名 `"zh"|"en"` → `Locale`，`teamName` 改读 `NATIONS[name][locale]`；补 4 语赛段名（`STAGE_EN` → 多语表）+ 组名（Group A → Grupo A / Grupo A / Gruppe A / Groupe A）。
- `src/components/LocalTime.tsx`：日期 locale 映射表（zh-CN/en-US/es-ES/pt-BR/de-DE/fr-FR）。
- `src/app/api/og/route.tsx`（824 行，17 三元，**需精读后再动**）：把烤进图片的标题/副文案 locale 化。**德语文本偏长**——逐卡（match/team/swing/report/thirds）做**视觉 QA 防溢出**（截断/缩字号/换行）。share 库 `swingShare.ts`/`matchCard.ts` 的 locale 三元同步。这是 Phase A 第二重的活儿（仅次于法务页翻译）。

### A7. 合规扫描器 + 部署
- `scripts/seo-compliance-scan.ts`：扫描路径扩到 `/es /pt /de /fr` 真实树（沿用 P2-1 扫真实 per-locale URL 的方式）。**对 4 个新语种 0 雷词 = 部署阻断闸。**
- 构建验证 → 部署 → 抽查（见 §8/§9）。

## 6. Phase B 实施分步（AI 内容本地化 ×4 语；A 干净上线后再做）

> **Phase B 状态：暂缓启动（§4④ 用户已定）**——先把 Phase A 全量干净上线、观察 es/pt/de/fr 收录效果，再决定 B 是否启动及怎么排（四语同步 / 先西葡后德法）。Phase B 才是把**合规风险与 token 成本**拉满的环节，**A 不依赖 B**。以下为 B 启动时的实施 spec，留作背景。

### B1. 4 套去博彩化合规雷词库（**最高风险，先做**）
- `src/lib/compliance/bannedTerms.ts`：`BANNED` 补 `es/pt/de/fr`，需研究各语族博彩词族并建表，至少覆盖：
  - **es**：apuesta(s)、apostar、casa de apuestas、cuota(s)、casino、azar、pronóstico（作 tip 义时）…
  - **pt**：aposta(s)、apostar、casa de apostas、odd(s)、cassino/casino、palpite（作 tip 义时）…
  - **de**：Wette(n)、wetten、Wettquote、Quote(n)、Buchmacher、Glücksspiel、Casino…
  - **fr**：pari(s)、parier、cote(s)、bookmaker、casino、jeu d'argent、pronostic（作 tip 义时）…
  - （以上为起点，**须母语+合规复核**，并对齐 AdSense 分类器文本特征；含复数/变位形式与词边界处理。）
- `findBannedTerms` 的词边界正则对带变音符/连写语言需验证（de 复合词、fr 缩合 `d'`、pt/es 重音）。

### B2. 4 套本地化 AI 管线
- `src/lib/ai/content.ts`：为 es/pt/de/fr 各加 `generatePreview<XX>/Recap<XX>/Sentiment<XX>` + 本地化 system prompt（镜像 en 管线的 voice + 硬规则禁词，禁词列表对齐 B1）+ `safeGen<XX>`（雷词 lint→重试→本地化兜底文案）。底层模型按可用性选（DeepSeek/Gemini，注意本机 geo 拦截，**Gemini 只在 Vercel 端可调**）。

### B3. cron / settle 泛化
- `src/app/api/cron/gen-content/route.ts`：从硬编码 en 泛化为**遍历目标 locale 集**回填 `preview_<xx>/sentiment_<xx>`；注意 `MATCH_CAP`/`DEADLINE_MS` 预算——locale ×4 后单批覆盖变慢，调度（cron-job.org/多 curl）相应加密或提高 cap。settle 路由的 recap 生成同步补 `recap_<xx>`。
- `ai_content` 加 `type`：`preview_es/recap_es/sentiment_es`（pt/de/fr 同构）。**零 DDL**（type-keyed，加行）。

### B4. getMatchDetail 按 locale 取 + 展示层
- `src/lib/markets/getMatchDetail.ts`：`byType*` 泛化为按当前 locale 取 `<type>_<locale>`（en 仍是 `_en`，zh 是裸 `preview`），每语种各自走对应雷词表 fail-closed。
- `src/app/match/[id]/page.tsx` 的 `AiBlock`：现逻辑「en 有英文版平铺、否则折叠中文」泛化为「当前 locale 有本语种内容则平铺、否则回落英文/折叠」。

### B5. 验证 + 部署
- 同 A7 扫描闸（4 新语种 AI 正文 0 雷词）+ 抽查各语种 match 页有本语种短文。

## 7. 必改文件总清单

| 文件 | 改什么 | TS 强制? | Phase |
|---|---|---|---|
| `src/i18n/index.ts` | Locale 加宽 + localeHref/stripLocale 前缀泛化 + dicts 补 4 | 是 | A0/A1/A2 |
| `src/i18n/messages/{es,pt,de,fr}.ts` | 新建，镜像 Dict ~95 键 | 是 | A2 |
| `src/i18n/server.ts` | getLocale 6 值解析 | 部分 | A1 |
| `src/proxy.ts` | 前缀集检测 + rewrite + matcher 正则 | 否 | A1 |
| `src/components/LangToggle.tsx` | 二元按钮→多语下拉 + 母语自称表 | 否 | A1 |
| 23 个 `COPY={zh,en}` 文件（about/rules/privacy/disclaimer/team/calculator/forecast/group/best-thirds/…） | 补 es/pt/de/fr 块（含法务长文翻译） | 是 | A3 |
| 31 文件 / 85 处裸三元（og route 17 / match 14 / team 8 / share 库…） | 文案型抽进 COPY、数据型回落英文 | 否 | A4 |
| `src/lib/seo/canonical.ts` | hreflang languages 补 4 码 | 否 | A5 |
| `src/app/sitemap.ts` | expand 遍历 6 locale | 否 | A5 |
| `src/app/layout.tsx` | META 补 4 + alternateLocale 数组 | 是(META) | A5 |
| `src/lib/seo/indexnow.ts` / `public/llms.txt` | 补 4 语树 | 否 | A5 |
| `src/lib/football/teams.ts` | 签名→Locale + NATIONS 补 192 国名(es/pt/de/fr) + 赛段/组名 4 语 | 是(签名) | A6 |
| `src/components/LocalTime.tsx` | 日期 locale 映射 | 否 | A6 |
| `src/app/api/og/route.tsx` + `swingShare.ts`/`matchCard.ts` | 卡面文案 locale 化 + 德语溢出 QA | 否 | A6 |
| `scripts/seo-compliance-scan.ts` | 扫 4 新语种真实树 | 否 | A7/B5 |
| `src/lib/compliance/bannedTerms.ts` | BANNED 补 4 套词族 | 否 | **B1** |
| `src/lib/ai/content.ts` | 4 套本地化管线 | 否 | B2 |
| `src/app/api/cron/gen-content/route.ts` + settle 路由 | 遍历 locale 回填 | 否 | B3 |
| `src/lib/markets/getMatchDetail.ts` + `match/[id]/page.tsx` AiBlock | 按 locale 取内容 + 展示回落 | 否 | B4 |

## 8. 验收标准

**Phase A**
- [ ] 不带 Accept-Language / cookie 访问 `/es/forecast`（及 pt/de/fr）返回**对应语种正文**；`/forecast`（根）仍英文、`/zh/*` 仍中文；现有根 EN / `/zh` URL **零 301**。
- [ ] 每页原始 HTML 含 6 路 reciprocal hreflang（en / zh-Hans / es / pt / de / fr / x-default→en）+ 各 locale 独立 self-canonical。
- [ ] sitemap 每逻辑页 6 条 URL（带 alternates），lastmod 仍取真实 settled_at；fail-closed 保留。
- [ ] `grep -rn 'locale === "zh"' src` 无残留「文案型」三元（新语种不再夹英文）。
- [ ] `npx tsc --noEmit` 净、`npm run test` 全过、`npx eslint` 0 error、`npm run build` 净。
- [ ] `scripts/seo-compliance-scan.ts` 对 en/zh/es/pt/de/fr 真实 URL **全过 0 雷词**。
- [ ] OG 卡 4 新语种逐卡视觉 QA 无文本溢出（重点德语）。
- [ ] 多 agent 对抗评审（仿 P2-1）safe-to-deploy 再上线。

**Phase B**
- [ ] es/pt/de/fr 各 match 页显示本语种 preview/recap/sentiment（或干净回落英文，不夹乱码）。
- [ ] 4 套新语种 AI 正文过雷词扫描 0 命中（部署阻断闸）。
- [ ] gen-content cron 对 4 新语种回填正常、单批预算不超时。

## 9. 验证命令
```powershell
npx tsc --noEmit
npm run test
npx eslint <changed files>
npm run build
# 合规闸（preview 或部署后扫线上）：
npx tsx scripts/seo-compliance-scan.ts https://www.wc2026.cool
# 爬虫视角抽查（关键：不带 Accept-Language 头）：
Invoke-WebRequest -Uri https://www.wc2026.cool/es/forecast -UseBasicParsing  # 应返回西语
Invoke-WebRequest -Uri https://www.wc2026.cool/de/forecast -UseBasicParsing  # 应返回德语
# 残留裸三元清点（用 Grep 工具）：
#   grep -rn 'locale === "zh"' src
```

## 10. 环境约束 / 坑（沿用本项目）
- **部署唯一路径** = `npx vercel deploy --prod --yes`（GitHub 账号被封，不能 push；生产部署已获用户永久授权）。完成后刷新 `D:\wc2026-backup.bundle`。
- **GateGuard hook**：每个文件首次 Write/Edit 必被拦，需先列 4 项事实再 retry（每文件一次）。
- **PowerShell 5.1 提交信息**：用单引号 here-string 且正文不要出现双引号（双引号会让 native 参数 word-split）。
- **CJK/curl 编码坑**：验证含重音/中文 URL 用 node 生成请求，别用 git-bash `--data-urlencode`（见记忆 `wc2026-gitbash-cjk-curl-encoding`）。
- **成本**：[1m] 长会话按长上下文费率重读全部历史。**本任务务必新会话冷启动**，按 §5/§6 分步、必要时跨多会话；Phase A 与 Phase B 可拆不同会话。
- **零 DDL**：A/B 均无需 Supabase 隧道/GRANT（见 §3.5）。
- 字体：Oswald+Inter 均含 Latin subset，es/pt/de/fr 的变音符/ß/ç/ñ/ã 全覆盖，**无需新字体子集**。

## 11. 待用户决策 + 风险登记
- **已定（2026-06-14，见 §4）**：① hreflang 语言级 `es/pt/de/fr`；② 拉美西语 + 巴西葡语口吻（de/fr 标准书面体）；③ 国名 192 条 Phase A 同步补（不回落）；④ Phase B 待 A 上线观察收录后再定。
- **风险登记**：
  - 🔴 **B1 合规雷词库 ×4 语**——全任务最高风险。翻错/漏词在 4 个新语种 AdSense 分类器面前可致账号风险，非 UI bug 级。须母语+合规复核，作为 Phase B 第一关 & 部署阻断闸。
  - 🟠 **A4 裸三元清剿**——85 处、tsc 抓不到，漏改即新语种夹英文。靠 grep 完成定义把关。
  - 🟠 **A3 法务长文翻译**——privacy/disclaimer 德/法辖区法律措辞，建议母语/法务校对。
  - 🟡 **A6 德语 OG 卡溢出**——德语长词，逐卡视觉 QA。
  - 🟡 **Phase B token 成本 ×4**——104 场 ×3 类 ×4 语；cron 预算与调度需相应加密。
- **上线后**：GSC 对重点 es/pt/de/fr 落地页（calculator/group/team/forecast）单独请求收录（4 棵全新暴露面）。
- **跨会话协调（2026-06-14，与「GSC Dataset license」会话）**：另一会话已在 `feat/legal-pages` 提交 `84c2339`——给 `/forecast` 的 Dataset JSON-LD 加 `license: selfUrl("/disclaimer", locale)`（清 GSC「未填 license」告警，非严重、不影响收录），随 P2-2 激活部署一起上线。与本 P2-2 的 COPY 改动不在同一区域，零冲突。
  - **激活时注意**：① 该 license 经 `selfUrl` 自动 locale 化 → es/pt/de/fr 版 forecast 会指向 `/es/disclaimer` 等，**前提是激活时 /disclaimer 已出各 locale 版**（归 A3 法务页翻译，且 disclaimer 需法务/母语审）。② 全站目前仅 `/forecast` 用 Dataset（best-thirds=ItemList、match=SportsEvent，无需 license）；若 P2-2 给新可索引页加 Dataset，记得补 `license` 字段。③ 做 forecast 页 COPY（A3）时**别动 Dataset JSON-LD 块**（`forecast/page.tsx` 约 132–144 行）。

## 12. A0 实测工单（2026-06-14 已跑，`Locale` 加宽 → `tsc` 红灯快照）

> A0 已执行：把 `Locale` 临时加宽到 6 值跑 `npx tsc --noEmit`，得 **80 错误 / 26 文件**（之后已还原，代码树现为绿、tsc exit 0）。这是**模式 2（TS 强制）+ 函数签名的精确逐行工单**——「修到 tsc 净」即这部分完成。**85 处裸三元（模式 3）不在此列**（tsc 抓不到），仍走 §A4 grep 清剿。

错误码 → 动作：

| 码 | 数 | 含义 / 动作 |
|---|---|---|
| TS7053 | 32 | `COPY[locale]` / `META[locale]` 索引缺键 → 给该对象补 es/pt/de/fr（**翻译活**，归 A3/A5） |
| TS2345 | 30 | 把 `Locale` 传给 `"zh"\|"en"` 参数（`teamName/stageName/groupName/getLeaderboard/getMatchReport`…）→ 放宽函数签名到 `Locale`（A1/A6），**改完批量清掉** |
| TS2322 | 11 | 把 `Locale` 赋给 `"zh"\|"en"` 类型的变量 / 组件 prop → 放宽 prop 类型 |
| TS7006 | 6 | 隐式 any 回调参数（上面修完即随之消） |
| TS2739 | 1 | `dicts` 缺 es/pt/de/fr → 建 4 个 message 文件（A2） |

逐文件（`码×数`）：

| 文件 | 错误码 | 性质 |
|---|---|---|
| `src/app/match/[id]/page.tsx` | TS2345×18 TS2322×6 | 多为 teamName/stageName 调用（签名一改即消）+ 少量标题/描述（模式 3 → A4） |
| `src/app/rules/page.tsx` | TS7053×2 TS7006×4 | COPY 补译 |
| `src/app/team/[slug]/page.tsx` | TS7053×2 TS2322×3 | COPY 补译 + prop 放宽 |
| `src/components/SettleDrawer.tsx` | TS7053×1 TS2345×3 | COPY + 签名 |
| `src/app/calculator/group/[letter]/page.tsx` | TS7053×2 TS7006×1 | COPY 补译 |
| `src/app/calculator/page.tsx` | TS7053×2 TS2322×1 | COPY 补译 |
| `src/app/forecast/best-thirds/page.tsx` | TS7053×3 | COPY 补译 |
| `src/app/forecast/page.tsx` | TS7053×3 | COPY 补译 |
| `src/app/privacy/page.tsx` | TS7053×3 | **法务长文补译**（A3） |
| `src/app/watch/page.tsx` | TS7053×2 TS7006×1 | COPY 补译 |
| `src/components/MeClient.tsx` | TS7053×2 TS2345×1 | COPY + 签名 |
| `src/app/disclaimer/page.tsx` | TS7053×2 | **法务长文补译**（A3） |
| `src/app/layout.tsx` | TS7053×2 | META 补 4 语（A5） |
| `src/app/league/[code]/page.tsx` | TS7053×1 TS2345×1 | COPY + 签名 |
| `src/components/ComboClient.tsx` | TS2345×2 | 签名 |
| `src/components/MatchCard.tsx` | TS2345×2 | 签名（teamName/stageName） |
| `src/app/about/page.tsx` | TS7053×1 | **法务/说明补译**（A3） |
| `src/app/api/league/[code]/route.ts` | TS2345×1 | 签名（nickname locale 透传） |
| `src/app/leaderboard/page.tsx` | TS2345×1 | 签名（getLeaderboard） |
| `src/components/CalculatorFocus.tsx` | TS7053×1 | COPY 补译 |
| `src/components/InviteCopy.tsx` | TS7053×1 | COPY 补译 |
| `src/components/LeagueClient.tsx` | TS7053×1 | COPY 补译 |
| `src/components/MyTeamCard.tsx` | TS2322×1 | prop 放宽 |
| `src/components/TeamBadge.tsx` | TS2345×1 | 签名（teamName） |
| `src/components/ThirdCalculator.tsx` | TS7053×1 | COPY 补译 |
| `src/i18n/index.ts` | TS2739×1 | **`dicts` 缺键 → 建 4 个 message 文件（A2）** |

**实施读法**：
- **先放宽 `teams.ts` 的 `teamName/stageName/groupName` 签名 `"zh"|"en"`→`Locale`（A6）**——`match/[id]`(24)、MatchCard、TeamBadge、SettleDrawer、ComboClient 等的 TS2345 多由此而来，一改批量清掉，剩下的才是真正要逐条补译的 COPY。
- 纯 `TS7053`/`TS2739` 文件 = **要翻译**（补 COPY/dict 键）；含 `TS2345`/`TS2322` 文件 = **多半改签名即自动消**。
- 校准了 §1/§2.2 的 grep 估值：模式 2 实为 **26 文件 / 80 错**（非 grep 估的 23 文件），模式 3 仍是 ~85 处裸三元（独立工作流）。
