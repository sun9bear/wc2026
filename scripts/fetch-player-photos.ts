/**
 * 抓球员 Wikimedia Commons 自由授权头像 + 署名，生成 src/data/players.photos.ts。
 * 只收 CC / 公有领域 / CC0 自由许可（剔除 fair-use/非自由）。运行：npx tsx scripts/fetch-player-photos.ts
 * 合并：跳过已得的，只补缺的；空响应也退避重试（MediaWiki 高负载会返 200 空 body）。重跑只增不减。
 */
import { writeFileSync } from "node:fs";
import { PLAYERS } from "../src/data/players.seed";
import { PHOTOS as PRIOR } from "../src/data/players.photos";

const WP = "https://en.wikipedia.org/w/api.php";
const UA = "wc2026.cool/1.0 (Fan Favorite player photos; CC verification)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function api(params: Record<string, string>): Promise<Record<string, unknown> | null> {
  const u = new URL(WP);
  u.search = new URLSearchParams({ format: "json", ...params }).toString();
  try {
    const r = await fetch(u, { headers: { "User-Agent": UA } });
    return r.ok ? ((await r.json()) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function firstPage<T>(j: Record<string, unknown> | null): T | undefined {
  const pages = (j?.query as { pages?: Record<string, Record<string, unknown>> })?.pages ?? {};
  return Object.values(pages)[0] as T | undefined;
}

// 取主图（空响应=瞬时，退避重试）。
async function pageImage(title: string): Promise<{ file: string; thumb: string } | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const j = await api({
      action: "query",
      prop: "pageimages",
      piprop: "thumbnail|name",
      pithumbsize: "320",
      redirects: "1",
      titles: title,
    });
    const page = firstPage<{ pageimage?: string; thumbnail?: { source?: string } }>(j);
    if (page?.pageimage && page.thumbnail?.source) {
      return { file: page.pageimage, thumb: page.thumbnail.source };
    }
    await sleep(1200 * (attempt + 1));
  }
  return null;
}

async function license(file: string): Promise<{ short: string; lic: string; author: string } | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const j = await api({ action: "query", titles: `File:${file}`, prop: "imageinfo", iiprop: "extmetadata" });
    const page = firstPage<{ imageinfo?: { extmetadata?: Record<string, { value?: string }> }[] }>(j);
    const ext = page?.imageinfo?.[0]?.extmetadata;
    if (ext) {
      return {
        short: ext.LicenseShortName?.value ?? "",
        lic: ext.License?.value ?? "",
        author: (ext.Artist?.value ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 80),
      };
    }
    await sleep(1200 * (attempt + 1));
  }
  return null;
}

function isFree(short: string, lic: string): boolean {
  const s = short.toLowerCase();
  const l = lic.toLowerCase();
  if (/fair use|non-?free/.test(s) || /fair use|non-?free/.test(l)) return false;
  return /^(cc|pd|public)/.test(l) || /\bcc\b|cc[- ]?by|cc0|public domain|gfdl/.test(s);
}

interface Photo {
  url: string;
  author: string;
  license: string;
}

async function main(): Promise<void> {
  const out: Record<string, Photo> = { ...PRIOR };
  let added = 0,
    nonfree = 0,
    none = 0;
  for (const p of PLAYERS) {
    if (out[p.slug]) continue; // 已得，跳过
    await sleep(400);
    const img = await pageImage(p.wikiTitle);
    if (!img) {
      none++;
      console.log(`-  ${p.name}: 无图`);
      continue;
    }
    const lic = await license(img.file);
    if (!lic || !isFree(lic.short, lic.lic)) {
      nonfree++;
      console.log(`x  ${p.name}: 非自由 (${lic?.short || "?"})`);
      continue;
    }
    out[p.slug] = { url: img.thumb, author: lic.author, license: lic.short };
    added++;
    console.log(`✓  ${p.name}: ${lic.short}`);
  }

  const total = Object.keys(out).length;
  console.log(`\n本轮新增=${added}  非自由=${nonfree}  无图=${none}  累计=${total}/${PLAYERS.length}`);

  const body =
    `// 生成文件（scripts/fetch-player-photos.ts）：球员 Wikimedia Commons 自由授权头像 + 署名。\n` +
    `// 仅含 CC/PD/CC0 自由许可图；非自由/无图者回落国旗。请勿手改，重跑脚本刷新。\n\n` +
    `export interface PlayerPhoto {\n  url: string;\n  author: string;\n  license: string;\n}\n\n` +
    `export const PHOTOS: Record<string, PlayerPhoto> = ${JSON.stringify(out, null, 2)};\n`;
  writeFileSync("src/data/players.photos.ts", body);
  console.log("✓ 已写 src/data/players.photos.ts");
}

main().catch((e) => {
  console.error("✗ fetch-player-photos 失败:", e);
  process.exit(1);
});
