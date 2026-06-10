import { cookies } from "next/headers";
import type { Locale } from "./index";

// 服务端读取当前语言（NEXT_LOCALE cookie），默认中文。仅服务端组件使用。
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get("NEXT_LOCALE")?.value === "en" ? "en" : "zh";
}
