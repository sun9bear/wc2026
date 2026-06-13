// 擂台口令生成（任务 5）：WC-XXXX，字母表剔除易混字符（0/O/1/I/L）。
// 32^4 ≈ 105 万组合，MVP 量级冲突率可忽略；调用方在 unique 冲突时重试。
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function genLeagueCode(): string {
  let s = "";
  for (let i = 0; i < 4; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `WC-${s}`;
}

/** 用户输入归一化：容忍小写、空格、横杠，以及漏写整个 WC- 前缀（如从聊天里抄 "WC8K2F"）。
 *  口令后缀恒为 4 位，故：去掉所有空格/横杠后，长度 6 且以 WC 开头 → 砍掉前缀 WC 取后 4 位；
 *  长度 4 → 即为裸后缀。其它长度交给调用方的 /^WC-[A-Z2-9]{4}$/ 校验报错（不强行拼接）。 */
export function normalizeLeagueCode(input: string): string {
  const raw = input.trim().toUpperCase().replace(/[\s-]/g, "");
  let suffix = raw;
  if (raw.length === 6 && raw.startsWith("WC")) suffix = raw.slice(2);
  else if (raw.length === 4) suffix = raw;
  return `WC-${suffix}`;
}
