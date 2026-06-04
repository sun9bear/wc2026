import { it, expect, describe } from "vitest";
import { result1x2 } from "./result";

describe("result1x2", () => {
  it("主队赢", () => {
    expect(result1x2(2, 1)).toBe("home");
    expect(result1x2(3, 0)).toBe("home");
  });
  it("客队赢", () => {
    expect(result1x2(0, 1)).toBe("away");
  });
  it("平局", () => {
    expect(result1x2(1, 1)).toBe("draw");
    expect(result1x2(0, 0)).toBe("draw");
  });
});
