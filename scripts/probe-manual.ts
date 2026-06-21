/**
 * 手动文章逻辑验证（mock LLM，无网络无 DB）：slug + assets 切分 + generateManualDraft 路由。
 * 用法：npx tsx scripts/probe-manual.ts
 */
import { slugify, ensureUniqueSlug } from "../src/lib/blog/slug";
import { splitBodyByAssets } from "../src/lib/blog/assets";
import { generateManualDraft } from "../src/lib/blog/manual";
import type { GenDeps } from "../src/lib/blog/generate";

let pass = 0;
let fail = 0;
const eq = (label: string, got: unknown, want: unknown): void => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "✓" : "✗"} ${label}${ok ? "" : `\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`}`);
  if (ok) pass++;
  else fail++;
};

const mockBody = `Intro commentary line.

[[asset:1]]

Middle analysis paragraph.

[[asset:2]]

See the [forecast](/forecast).`;
const mockArticle = (loc: string) =>
  JSON.stringify({
    title: loc === "zh" ? "测试标题文字示例" : "Test Title Here For Article",
    excerpt: "e".repeat(40),
    body: mockBody,
    keywords: ["a", "b", "c", "d"],
    topic_flag: null,
  });
const mockDeps: GenDeps = {
  generate: async (loc) => "```json\n" + mockArticle(loc) + "\n```",
  review: async () => JSON.stringify({ verdict: "usable", confidence: 0.9, notes: "ok" }),
};

(async () => {
  eq("slugify 含音标/标点", slugify("Mbappé's Wonder Goal!"), "mbappe-s-wonder-goal");
  eq("slugify 去音标 ç(curaçao)", slugify("ecuador-curaçao-upset"), "ecuador-curacao-upset");
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

  // generator：2 素材，body 引用 [[asset:1]][[asset:2]] → markerOk、needs_review
  const d = await generateManualDraft(
    { angle: "test angle", locales: ["en", "zh"], assets: [{ type: "embed", url: "u1", desc: "d1" }, { type: "image", url: "u2", desc: "d2" }] },
    mockDeps
  );
  eq("manual status=needs_review", d.status, "needs_review");
  eq("manual en markerOk", d.en?.markerOk, true);
  eq("manual zh markerOk", d.zh?.markerOk, true);
  eq("manual reason 干净", d.reason, "manual_review");

  // 3 素材但 body 只引用 1,2 → asset 3 缺失 → markerOk=false
  const d2 = await generateManualDraft(
    { angle: "x", locales: ["en"], assets: [{ type: "embed", url: "u1" }, { type: "image", url: "u2" }, { type: "image", url: "u3" }] },
    mockDeps
  );
  eq("manual markerOk=false(缺asset3)", d2.en?.markerOk, false);

  console.log(`\n${pass} pass / ${fail} fail`);
  if (fail) process.exit(1);
})();
