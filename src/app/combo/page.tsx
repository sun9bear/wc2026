import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { localizedAlternates } from "@/lib/seo/canonical";
import { ComboClient } from "@/components/ComboClient";

// 显式绝对自指 canonical（根 layout 不再设 canonical；CodeX 外审 M2 补齐 sitemap 内页覆盖）。
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    alternates: localizedAlternates("/combo", locale),
  };
}

// 服务端壳：读取 locale 后下传客户端组件（客户端拿不到 next/headers）。
export default async function ComboPage() {
  const locale = await getLocale();
  return <ComboClient locale={locale} />;
}
