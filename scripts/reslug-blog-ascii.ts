/**
 * 把已存在的非 ASCII blog slug 改成 ASCII（如 ecuador-curaçao-upset → ecuador-curacao-upset）。
 * 非 ASCII slug 在 /blog/[slug] 路由的百分号编码 / Unicode 归一（NFC vs NFD）不一致 → 点击打不开。
 * 用法：
 *   npx tsx scripts/reslug-blog-ascii.ts          # dry-run，只打印将要改的
 *   npx tsx scripts/reslug-blog-ascii.ts --apply   # 执行更新
 */
import { createClient } from "@supabase/supabase-js";
import { slugify, ensureUniqueSlug } from "../src/lib/blog/slug";

process.loadEnvFile(".env.local");

const apply = process.argv.includes("--apply");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("✗ 缺 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY（.env.local）");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const NONASCII = /[^\x00-\x7F]/;

(async () => {
  const { data, error } = await sb
    .from("blog_entries")
    .select("slug_en, slug_zh, status, title_en");
  if (error) {
    console.error("✗ 查询失败:", error.message);
    process.exit(1);
  }
  const rows = data ?? [];
  console.log(`共 ${rows.length} 条 blog_entries。`);
  const taken = new Set(rows.map((r) => String(r.slug_en)));
  const bad = rows.filter(
    (r) => NONASCII.test(String(r.slug_en ?? "")) || NONASCII.test(String(r.slug_zh ?? ""))
  );
  if (!bad.length) {
    console.log("✓ 没有非 ASCII slug，无需处理。");
    return;
  }
  console.log(`发现 ${bad.length} 条含非 ASCII 字符的 slug：`);
  for (const r of bad) {
    const oldSlug = String(r.slug_en);
    const base = slugify(oldSlug);
    taken.delete(oldSlug); // 自己不算占用
    const next = ensureUniqueSlug(base, taken);
    taken.add(next);
    console.log(`  [${r.status}] ${oldSlug}  →  ${next}   « ${r.title_en ?? ""} »`);
    if (apply) {
      const { error: uErr } = await sb
        .from("blog_entries")
        .update({ slug_en: next, slug_zh: next, updated_at: new Date().toISOString() })
        .eq("slug_en", oldSlug);
      console.log(uErr ? `    ✗ 更新失败: ${uErr.message}` : "    ✓ 已更新");
    }
  }
  console.log(apply ? "\n完成（已执行更新）。" : "\n以上为 dry-run；确认无误后加 --apply 执行。");
})();
