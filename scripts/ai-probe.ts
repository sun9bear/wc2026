// 探测 DeepSeek：生成一条前瞻并检查合规（不入库）。
import { generatePreview } from "../src/lib/ai/content";
import { findBannedTerms } from "../src/lib/compliance/bannedTerms";

process.loadEnvFile(".env.local");

async function main() {
  const text = await generatePreview("巴西", "阿根廷", "小组赛");
  console.log("前瞻：", text);
  console.log("字数：", text.length, "｜雷词：", findBannedTerms(text, "zh"));
}
main().catch((e) => {
  console.error("✗", e?.message ?? e);
  process.exit(1);
});
