import { findBannedTermsStrict } from "@/lib/compliance/bannedTerms";

// 昵称校验（任务 5）：2-20 码点、无控制/格式/标签字符、中英雷词双表干净（严格版抗绕过）。
// 返回 null = 合法；否则错误码（前端按语言渲染文案）。

/** 归一化为存库/校验的规范形：NFKC（折叠全角等）+ 合并连续空白 + 去首尾空白。
 *  存库务必用本函数的输出，确保「存进去的」与「校验过的」完全一致（防全角/零宽偷渡）。 */
export function canonicalizeNickname(raw: string): string {
  return raw.normalize("NFKC").replace(/\s+/g, " ").trim();
}

export function validateNickname(raw: string): string | null {
  const nick = canonicalizeNickname(raw);
  const len = Array.from(nick).length; // 按码点数——CJK 一字算一
  if (len < 2 || len > 20) return "nickname_length";
  // 标签字符 + 控制/格式字符（零宽、RTL override 等用于显示欺骗/绕过的不可见字符）一律拒。
  if (/[\n\r\t<>]/.test(nick) || /[\p{Cc}\p{Cf}]/u.test(nick)) return "nickname_invalid";
  if (findBannedTermsStrict(nick, "zh").length > 0 || findBannedTermsStrict(nick, "en").length > 0) {
    return "nickname_banned";
  }
  return null;
}
