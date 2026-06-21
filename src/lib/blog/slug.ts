// 手动文章 slug：en 标题 → 拉丁 slug（喂 /blog/[slug]），撞名去重。

/** 标题 → 拉丁 slug：NFKD 拆音标 → 非 [a-z0-9] 段转连字符 → 收敛、限长。全非拉丁则回退 "post"。 */
export function slugify(title: string): string {
  const s = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // 去组合音标：ç→c、é→e、ñ→n（否则音标会被当非字母转成连字符，如 curaçao→curac-ao）
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return s || "post";
}

/** 撞名去重：base、base-2、base-3 …（taken = 已存在 slug 集合）。 */
export function ensureUniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) {
    const c = `${base}-${i}`;
    if (!taken.has(c)) return c;
  }
}
