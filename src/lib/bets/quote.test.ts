import { it, expect, describe } from "vitest";
import { validateStake, quotePayout } from "./quote";

describe("validateStake", () => {
  it("拒绝非正整数", () => {
    expect(validateStake(0, 1000)).toBeTruthy();
    expect(validateStake(-5, 1000)).toBeTruthy();
    expect(validateStake(1.5, 1000)).toBeTruthy();
  });
  it("拒绝超过余额", () => {
    expect(validateStake(2000, 1000)).toBeTruthy();
  });
  it("接受合法投入", () => {
    expect(validateStake(200, 1000)).toBeNull();
  });
});

describe("quotePayout", () => {
  it("投入 × 倍率，四舍五入", () => {
    expect(quotePayout(200, 3.4)).toBe(680);
    expect(quotePayout(100, 3)).toBe(300);
  });
});
