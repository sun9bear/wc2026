import { getLocale } from "@/i18n/server";
import { MeClient } from "@/components/MeClient";

// 服务端壳：读取 locale 后下传客户端组件。
export default async function MePage() {
  const locale = await getLocale();
  return <MeClient locale={locale} />;
}
