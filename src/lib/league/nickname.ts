import { findBannedTerms } from "@/lib/compliance/bannedTerms";

// 昵称校验（任务 5）：2-20 码点、无控制/标签字符、中英雷词双表干净。
// 返回 null = 合法；否则错误码（前端按语言渲染文案）。
export function validateNickname(raw: string): string | null {
  const nick = raw.trim();
  const len = Array.from(nick).length; // 按码点数——CJK 一字算一
  if (len < 2 || len > 20) return "nickname_length";
  if (/[\n\r\t<>]/.test(nick)) return "nickname_invalid";
  if (findBannedTerms(nick, "zh").length > 0 || findBannedTerms(nick, "en").length > 0) {
    return "nickname_banned";
  }
  return null;
}
