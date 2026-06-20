/**
 * 手动文章纯逻辑验证（无网络无 DB）：slug + assets 切分（Task 6 再追加 generator mock）。
 * 用法：npx tsx scripts/probe-manual.ts
 */
import { slugify, ensureUniqueSlug } from "../src/lib/blog/slug";
import { splitBodyByAssets } from "../src/lib/blog/assets";

let pass = 0;
let fail = 0;
const eq = (label: string, got: unknown, want: unknown): void => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "✓" : "✗"} ${label}${ok ? "" : `\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`}`);
  if (ok) pass++;
  else fail++;
};

eq("slugify 含音标/标点", slugify("Mbappé's Wonder Goal!"), "mbappe-s-wonder-goal");
eq("slugify 全中文→post", slugify("姆巴佩进球了"), "post");
eq("ensureUniqueSlug 去重", ensureUniqueSlug("x", new Set(["x", "x-2"])), "x-3");
eq("ensureUniqueSlug 不撞", ensureUniqueSlug("y", new Set(["x"])), "y");
eq("split 无 marker", splitBodyByAssets("hello"), [{ kind: "md", text: "hello" }]);
eq("split a[[asset:1]]b", splitBodyByAssets("a[[asset:1]]b"), [
  { kind: "md", text: "a" },
  { kind: "asset", index: 0 },
  { kind: "md", text: "b" },
]);
eq("split 相邻双 marker", splitBodyByAssets("[[asset:2]][[asset:1]]"), [
  { kind: "asset", index: 1 },
  { kind: "asset", index: 0 },
]);

console.log(`\n${pass} pass / ${fail} fail`);
if (fail) process.exit(1);
