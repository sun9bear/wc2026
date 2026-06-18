import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getDict } from "@/i18n";
import { MeClient } from "@/components/MeClient";
import { SettleDrawer } from "@/components/SettleDrawer";

// 个人战绩页：数据为每用户本地(localStorage)私有，服务端只渲染骨架；
// 不在 sitemap，故显式 noindex，避免 Google 收录空壳。补上此前缺失的页面标题。
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDict(locale);
  return {
    title: `${t.nav.me} · ${t.appName}`,
    robots: { index: false },
  };
}

// 服务端壳：读取 locale 后下传客户端组件。
export default async function MePage() {
  const locale = await getLocale();
  return (
    <>
      <MeClient locale={locale} />
      <SettleDrawer locale={locale} />
    </>
  );
}
