import { cookies, headers } from "next/headers";
import type { Locale } from "./index";

// 服务端读取当前语言：NEXT_LOCALE cookie 优先；无 cookie 时按 Accept-Language 推断
// （中文浏览器→zh；其余含爬虫→en，保证海外首访与 Googlebot 拿到英文）。仅服务端组件使用。
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const saved = store.get("NEXT_LOCALE")?.value;
  if (saved === "en") return "en";
  if (saved === "zh") return "zh";
  const accept = (await headers()).get("accept-language") ?? "";
  return /(^|[,;\s])zh\b|zh-/i.test(accept) ? "zh" : "en";
}
