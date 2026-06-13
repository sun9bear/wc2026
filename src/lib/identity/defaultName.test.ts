import { describe, it, expect } from "vitest";
import { defaultName } from "./defaultName";
import { validateNickname } from "@/lib/league/nickname";

describe("defaultName", () => {
  it("任意 user_id 的默认名恒合法（长度/雷词双语）", () => {
    for (let i = 0; i < 3000; i++) {
      const uid = `u-${i}-${(i * 2654435761) % 1_000_000_007}`;
      expect(validateNickname(defaultName(uid, "zh"))).toBeNull();
      expect(validateNickname(defaultName(uid, "en"))).toBeNull();
    }
  });

  it("确定性：同 id 同名", () => {
    expect(defaultName("abc-123", "en")).toBe(defaultName("abc-123", "en"));
    expect(defaultName("abc-123", "zh")).toBe(defaultName("abc-123", "zh"));
  });

  it("空 id 不抛错且合法", () => {
    expect(validateNickname(defaultName("", "zh"))).toBeNull();
    expect(validateNickname(defaultName("", "en"))).toBeNull();
  });
});
