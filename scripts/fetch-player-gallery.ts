/**
 * 抓球员 Wikimedia Commons 自由授权相册（每人 ≤6 张）+ 逐图署名，生成 src/data/players.gallery.ts。
 * 多源候选并集：Wikidata P18 主图 + 英文维基文章内图（generator=images）+ P373 Commons 分类（递归一层年份子类）。
 * 批量 imageinfo 取 330px 缩略图 + 许可 + 署名，硬过滤：仅 jpeg/png、文件名黑名单、尺寸≥320、自由许可、去重 cropped。
 * 只收 CC / 公有领域 / CC0（剔除 fair-use/非自由）。运行：npx tsx scripts/fetch-player-gallery.ts
 * 合并：跳过已得的，只补缺的；429/空 body 退避重试。重跑只增不减。<2 张则不收（详情页回落单图/国旗）。
 */
import { writeFileSync } from "node:fs";
import { PLAYERS } from "../src/data/players.seed";
import { GALLERY as PRIOR, type PlayerGalleryItem } from "../src/data/players.gallery";

const WP = "https://en.wikipedia.org/w/api.php";
const COMMONS = "https://commons.wikimedia.org/w/api.php";
const UA = "wc2026.cool/1.0 (Fan Favorite player gallery; CC verification)";
const N = 6; // 每人最多收录
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Json = Record<string, unknown>;

// api.php 通用调用：429/空 body 退避重试（MediaWiki 高负载会返 200 空 body）。
async function api(base: string, params: Record<string, string>): Promise<Json | null> {
  const u = new URL(base);
  u.search = new URLSearchParams({ format: "json", ...params }).toString();
  for (let a = 0; a < 5; a++) {
    try {
      const r = await fetch(u, { headers: { "User-Agent": UA } });
      if (r.status === 429) {
        await sleep(1200 * (a + 1));
        continue;
      }
      if (r.ok) {
        const j = (await r.json()) as Json;
        if (j && Object.keys(j).length) return j;
      }
    } catch {
      /* 退避 */
    }
    await sleep(1200 * (a + 1));
  }
  return null;
}

// Wikidata 实体（静态 JSON，非 api.php）。
async function entity(qid: string): Promise<Json | null> {
  for (let a = 0; a < 5; a++) {
    try {
      const r = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, {
        headers: { "User-Agent": UA },
      });
      if (r.status === 429) {
        await sleep(1200 * (a + 1));
        continue;
      }
      if (r.ok) return (await r.json()) as Json;
    } catch {
      /* 退避 */
    }
    await sleep(1200 * (a + 1));
  }
  return null;
}

function pageList(j: Json | null): Json[] {
  const pages = (j?.query as { pages?: Record<string, Json> })?.pages ?? {};
  return Object.values(pages);
}

// 署名 HTML → 纯文本（去标签/解实体/折空白/截断）。
function strip(h: string | undefined): string {
  return (h ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#0?160;|&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function isFree(short: string, lic: string): boolean {
  const s = short.toLowerCase();
  const l = lic.toLowerCase();
  if (/fair use|non-?free/.test(s) || /fair use|non-?free/.test(l)) return false;
  return /^(cc|pd|public)/.test(l) || /\bcc\b|cc[- ]?by|cc0|public domain|gfdl/.test(s);
}

// 文件名黑名单：剔除国旗/队徽/图标/签名/奖牌/地图/球衣/壁画等非「球员照片」。
const BAD =
  /flag of |\bflag\b|logo|crest|badge|\bicon\b|signature|\.svg$|medal|trophy|map of |\bmap\b|stadium|stats?|chart|graph|kit |jersey|shirt|mural|wikidata|commons-logo|edit-icon|wiki-/i;

async function getQid(wikiTitle: string): Promise<string | undefined> {
  const j = await api(WP, {
    action: "query",
    prop: "pageprops",
    ppprop: "wikibase_item",
    redirects: "1",
    titles: wikiTitle,
  });
  const p = pageList(j)[0] as { pageprops?: { wikibase_item?: string } } | undefined;
  return p?.pageprops?.wikibase_item;
}

// 文章内图（高信号源，但混入大量国旗/图标 → 后续按 mime/黑名单过滤）。
async function articleFiles(wikiTitle: string): Promise<string[]> {
  const j = await api(WP, {
    action: "query",
    generator: "images",
    gimlimit: "60",
    redirects: "1",
    titles: wikiTitle,
  });
  return pageList(j)
    .map((p) => (p as { title?: string }).title)
    .filter((t): t is string => Boolean(t));
}

// 解析 Commons 分类重定向（categorymembers 不跟随重定向；如「Erling Haaland」→「Erling Braut Haaland」）。
async function resolveCatRedirect(cat: string): Promise<string | null> {
  const j = await api(COMMONS, { action: "query", titles: `Category:${cat}`, redirects: "1" });
  const to = (j?.query as { redirects?: { to?: string }[] })?.redirects?.[0]?.to;
  return to ? to.replace(/^Category:/, "") : null;
}

// Commons 分类成员（文件 + 子类）；递归一层进年份/主题子类取量。
async function catFiles(cat: string, depth = 1): Promise<string[]> {
  const j = await api(COMMONS, {
    action: "query",
    list: "categorymembers",
    cmtitle: `Category:${cat}`,
    cmtype: "file|subcat",
    cmlimit: "50",
  });
  const members =
    ((j?.query as { categorymembers?: { ns: number; title: string }[] })?.categorymembers) ?? [];
  const files = members.filter((m) => m.ns === 6).map((m) => m.title);
  if (depth > 0) {
    for (const sub of members.filter((m) => m.ns === 14).slice(0, 3)) {
      await sleep(250);
      files.push(...(await catFiles(sub.title.replace(/^Category:/, ""), depth - 1)));
    }
  }
  return files;
}

interface Cand extends PlayerGalleryItem {
  w: number;
  h: number;
}

interface ImageInfoPage {
  title?: string;
  imageinfo?: {
    thumburl?: string;
    mime?: string;
    width?: number;
    height?: number;
    extmetadata?: Record<string, { value?: string }>;
  }[];
}

// 批量 imageinfo（≤50/次），逐图过滤后产出候选。
async function resolve(titles: string[]): Promise<Cand[]> {
  const out: Cand[] = [];
  for (let i = 0; i < titles.length; i += 50) {
    const slice = titles.slice(i, i + 50);
    const j = await api(COMMONS, {
      action: "query",
      prop: "imageinfo",
      iiprop: "url|extmetadata|mime|size",
      iiurlwidth: "330",
      titles: slice.join("|"),
    });
    await sleep(250);
    for (const raw of pageList(j)) {
      const p = raw as ImageInfoPage;
      const ii = p.imageinfo?.[0];
      if (!ii || !ii.thumburl || !p.title) continue;
      if (ii.mime !== "image/jpeg" && ii.mime !== "image/png") continue;
      if (BAD.test(p.title)) continue;
      if ((ii.width ?? 0) < 320 || (ii.height ?? 0) < 320) continue;
      const ext = ii.extmetadata ?? {};
      const short = ext.LicenseShortName?.value ?? "";
      const lic = ext.License?.value ?? "";
      if (!isFree(short, lic)) continue;
      out.push({
        url: ii.thumburl,
        author: strip(ext.Artist?.value) || strip(ext.Credit?.value) || "Unknown",
        license: short,
        file: p.title,
        w: ii.width ?? 0,
        h: ii.height ?? 0,
      });
    }
  }
  return out;
}

const isCropped = (f: string) => /\(cropped\)/i.test(f);
const minDim = (c: Cand) => Math.min(c.w, c.h);

async function main(): Promise<void> {
  const out: Record<string, PlayerGalleryItem[]> = { ...PRIOR };
  let added = 0;
  for (const p of PLAYERS) {
    if (out[p.slug]?.length) continue; // 已得，跳过
    await sleep(400);
    const qid = await getQid(p.wikiTitle);
    let p18: string | undefined;
    let cat: string | undefined;
    if (qid) {
      const ej = await entity(qid);
      const claims =
        (
          ej?.entities as Record<
            string,
            { claims?: Record<string, { mainsnak?: { datavalue?: { value?: string } } }[]> }
          >
        )?.[qid]?.claims ?? {};
      p18 = claims.P18?.[0]?.mainsnak?.datavalue?.value;
      cat = claims.P373?.[0]?.mainsnak?.datavalue?.value;
      await sleep(250);
    }

    const seeds = new Set<string>();
    if (p18) seeds.add(`File:${p18}`);
    (await articleFiles(p.wikiTitle)).forEach((t) => seeds.add(t));
    // Commons 分类并集：P373（若有）+ 球员名 + wikiTitle 变体，并解析各自的分类重定向。
    // 兜底 Wikidata 限流丢 P373：Commons 分类名通常就是球员全名（Category:Erling Haaland）；
    // 而名字分类常是重定向（→Erling Braut Haaland），故每个候选名再解析一次重定向目标。
    const cats = new Set<string>([p.name, p.wikiTitle.replace(/_/g, " ")]);
    if (cat) cats.add(cat);
    const resolved = new Set<string>();
    for (const cn of cats) {
      resolved.add(cn);
      await sleep(200);
      const red = await resolveCatRedirect(cn);
      if (red) resolved.add(red);
    }
    for (const cn of resolved) {
      await sleep(250);
      (await catFiles(cn)).forEach((t) => seeds.add(t));
    }

    const items = await resolve([...seeds]);

    // 去重 cropped/uncropped 同图（偏好 cropped；同型偏好更大尺寸）。
    const byKey = new Map<string, Cand>();
    for (const it of items) {
      const key = it.file.replace(/ ?\(cropped\)/i, "").toLowerCase();
      const cur = byKey.get(key);
      if (!cur) {
        byKey.set(key, it);
      } else if (isCropped(it.file) && !isCropped(cur.file)) {
        byKey.set(key, it);
      } else if (isCropped(it.file) === isCropped(cur.file) && minDim(it) > minDim(cur)) {
        byKey.set(key, it);
      }
    }

    const ranked = [...byKey.values()].sort((a, b) => minDim(b) - minDim(a));
    // P18 主图置顶（编辑精选的代表图）。
    if (p18) {
      const i = ranked.findIndex((x) => x.file === `File:${p18}`);
      if (i > 0) ranked.unshift(ranked.splice(i, 1)[0]);
    }

    if (ranked.length >= 2) {
      out[p.slug] = ranked
        .slice(0, N)
        .map(({ url, author, license, file }) => ({ url, author, license, file }));
      added++;
      console.log(`✓  ${p.name}: ${out[p.slug].length}`);
    } else {
      console.log(`-  ${p.name}: ${ranked.length} (不足，跳过)`);
    }
  }

  const total = Object.keys(out).length;
  console.log(`\n本轮新增=${added}  累计=${total}/${PLAYERS.length}`);

  const body =
    `// 生成文件（scripts/fetch-player-gallery.ts）：球员 Wikimedia Commons 自由授权相册（≤6 张）+ 逐图署名。\n` +
    `// 仅含 CC/PD/CC0 自由许可图；非自由/不足 2 张者无相册。请勿手改，重跑脚本刷新（只增不减）。\n\n` +
    `export interface PlayerGalleryItem {\n  url: string;\n  author: string;\n  license: string;\n  file: string;\n}\n\n` +
    `export const GALLERY: Record<string, PlayerGalleryItem[]> = ${JSON.stringify(out, null, 2)};\n`;
  writeFileSync("src/data/players.gallery.ts", body);
  console.log("✓ 已写 src/data/players.gallery.ts");
}

main().catch((e) => {
  console.error("✗ fetch-player-gallery 失败:", e);
  process.exit(1);
});
