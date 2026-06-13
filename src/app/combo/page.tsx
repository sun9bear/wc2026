import { getLocale } from "@/i18n/server";
import { ComboClient } from "@/components/ComboClient";

// 服务端壳：读取 locale 后下传客户端组件（客户端拿不到 next/headers）。
export default async function ComboPage() {
  const locale = await getLocale();
  return <ComboClient locale={locale} />;
}
