import { cookies, headers } from "next/headers";
import { type Locale, isLocale, DEFAULT_LOCALE } from "./locales";

// 服务端读取当前语言。优先级（per-locale URL 改造后）：
//   1) x-locale 请求头——中间件 proxy.ts 按 URL 注入（/zh/* → zh，其余 → en），这是页面渲染的【权威来源】。
//      内容由 URL 唯一决定 → 根路径永远 en、/zh 永远 zh，杜绝 canonical/内容错配。
//   2) NEXT_LOCALE cookie / Accept-Language——仅在无 x-locale 头时兜底（如未过中间件的 API 路由）。
// 仅服务端组件/路由使用（依赖 next/headers）。
export async function getLocale(): Promise<Locale> {
  const h = await headers();
  const fromHeader = h.get("x-locale");
  if (isLocale(fromHeader)) return fromHeader;
  const store = await cookies();
  const saved = store.get("NEXT_LOCALE")?.value;
  if (isLocale(saved)) return saved;
  const accept = h.get("accept-language") ?? "";
  return /(^|[,;\s])zh\b|zh-/i.test(accept) ? "zh" : DEFAULT_LOCALE;
}
