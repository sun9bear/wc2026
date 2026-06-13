import { describe, it, expect } from "vitest";
import { defaultName } from "./defaultName";
import { validateNickname } from "@/lib/league/nickname";
import { findBannedTermsStrict } from "@/lib/compliance/bannedTerms";

describe("defaultName", () => {
  it("穷举词表全组合：默认名恒过严格雷词闸 + 长度合法（中英双语，覆盖全部 16×14 单元）", () => {
    for (const locale of ["zh", "en"] as const) {
      const stems = new Set<string>(); // 去掉尾部数字 = adj+noun 单元，用于证明所有组合都生成
      const bad: string[] = [];
      for (let i = 0; i < 60_000; i++) {
        const n = defaultName(`uid-${i}-${(i * 2654435761) >>> 0}`, locale);
        stems.add(n.replace(/\d+$/, ""));
        if (validateNickname(n) !== null) bad.push(n);
      }
      expect(bad).toEqual([]); // 任意默认名都能通过昵称校验（严格雷词闸 + 长度）
      expect(stems.size).toBe(16 * 14); // 全部 224 个 形容词×名词 组合都被生成
      // 直接对严格闸再确认（与 validateNickname 内部同源，双保险，锁死未来词表编辑回归）
      for (const s of stems) {
        expect(findBannedTermsStrict(s, "zh")).toEqual([]);
        expect(findBannedTermsStrict(s, "en")).toEqual([]);
      }
    }
  });

  it("确定性：同 id 同 locale 恒同名", () => {
    expect(defaultName("abc-123", "en")).toBe(defaultName("abc-123", "en"));
    expect(defaultName("abc-123", "zh")).toBe(defaultName("abc-123", "zh"));
  });

  it("空 id 不抛错且合法", () => {
    expect(validateNickname(defaultName("", "zh"))).toBeNull();
    expect(validateNickname(defaultName("", "en"))).toBeNull();
  });
});
