// 服务端渲染 JSON-LD（爬虫不执行 JS，且必须落在首个 flush 块）。
// 安全：JSON.stringify 不转义 '<'，须转 < 防 XSS / 提前闭合 script（Next 官方 + CodeX 外审）。
// 用法：在各路由顶层 Server Component 的同步返回里、任何 Suspense/client 边界之前渲染。
// 原则：只填能填真的字段（空/泛字段 schema 反而有引用惩罚）。
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
