import type { Metadata } from "next";
import { isAuthed, listAllBlog, adminSecret } from "@/lib/blog/admin";
import { BlogAdminClient, BlogAdminLogin } from "@/components/BlogAdminClient";
import { PageContainer } from "@/components/PageContainer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog Admin", robots: { index: false, follow: false } };

// P6 极简管理后台（独立 /admin 频道，robots 屏蔽 /admin + 显式 noindex）。鉴权后用 service_role 列全部条目。
export default async function BlogAdminPage() {
  if (!adminSecret()) {
    return (
      <PageContainer tier="prose">
        <p className="mt-12 text-sm text-muted">
          Admin 未配置：请在 Vercel 环境变量设置 <code className="text-text">ADMIN_TOKEN</code>（或复用已有的{" "}
          <code className="text-text">CRON_SECRET</code>）。
        </p>
      </PageContainer>
    );
  }
  if (!(await isAuthed())) {
    return (
      <PageContainer tier="prose">
        <BlogAdminLogin />
      </PageContainer>
    );
  }
  const entries = await listAllBlog().catch(() => []);
  return (
    <PageContainer tier="prose">
      <BlogAdminClient entries={entries} />
    </PageContainer>
  );
}
