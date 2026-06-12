/**
 * 一次性生成器：抓取 Wikipedia 上 FIFA 规程 Annex C 的 495 行第三名分配表，
 * 解析为 { 晋级组合(8字母排序串): 槽位指派(按 1A,1B,1D,1E,1G,1I,1K,1L 序的8字母串) }。
 * 运行：npx tsx scripts/gen-third-allocation.ts
 * 校验：495 行、键唯一、指派字母集合=键集合、每个指派 ∈ 该槽位允许来源集合。
 */
import { writeFileSync } from "node:fs";

const API =
  "https://en.wikipedia.org/w/api.php?action=parse&page=Template:2026_FIFA_World_Cup_third-place_table&prop=wikitext&format=json&formatversion=2";

// 槽位顺序与允许来源集合（FIFA 规程 R32 对阵表，经 Wikipedia 逐字核对）
const SLOTS = ["A", "B", "D", "E", "G", "I", "K", "L"] as const; // 1A,1B,1D,...
const ALLOWED: Record<string, string> = {
  A: "CEFHI", // M79: 1A vs 3rd of C/E/F/H/I
  B: "EFGIJ", // M85
  D: "BEFIJ", // M81
  E: "ABCDF", // M74
  G: "AEHIJ", // M82
  I: "CDFGH", // M77
  K: "DEIJL", // M87
  L: "EHIJK", // M80
};

async function main(): Promise<void> {
  const res = await fetch(API, { headers: { "User-Agent": "wc2026.cool generator" } });
  const json = (await res.json()) as { parse: { wikitext: string } };
  const chunks = json.parse.wikitext.split(/\n!\s*scope="row"\s*\|\s*/).slice(1);
  if (chunks.length !== 495) throw new Error(`期望 495 行，实际 ${chunks.length}`);

  const out: Record<string, string> = {};
  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    const no = Number(lines[0].trim());
    const cells: string[] = [];
    for (const line of lines.slice(1)) {
      if (line.startsWith("|-") || line.startsWith("!")) continue;
      if (!line.startsWith("|")) continue;
      for (const c of line.replace(/^\|/, "").split("||")) {
        cells.push(c.replace(/'''/g, "").trim());
      }
    }
    const assigns = cells.filter((c) => /^3[A-L]$/.test(c)).map((c) => c.slice(1));
    if (assigns.length !== 8) {
      throw new Error(`行 ${no} 指派解析失败: ${JSON.stringify(cells)}`);
    }
    const key = [...assigns].sort().join("");
    if (new Set(assigns).size !== 8) throw new Error(`行 ${no} 指派有重复`);
    if (out[key]) throw new Error(`行 ${no} 组合键重复: ${key}`);
    assigns.forEach((a, i) => {
      if (!ALLOWED[SLOTS[i]].includes(a)) {
        throw new Error(`行 ${no}: 槽位 1${SLOTS[i]} 指派 3${a} 不在允许集合 ${ALLOWED[SLOTS[i]]}`);
      }
    });
    out[key] = assigns.join("");
  }
  if (Object.keys(out).length !== 495) throw new Error("键数量 != 495");
  writeFileSync("src/lib/prob/thirdAllocation.json", JSON.stringify(out), "utf8");
  console.log(`✓ 已生成 495 行分配表 → src/lib/prob/thirdAllocation.json`);
}

main().catch((e) => {
  console.error("✗ 生成失败:", e);
  process.exit(1);
});
