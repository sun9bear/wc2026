import { it, expect, describe } from "vitest";
import { rankTier } from "./rankTier";

describe("rankTier", () => {
  it("起始 1000 → 青铜", () => {
    expect(rankTier(1000).label).toBe("青铜");
  });
  it("阈值边界", () => {
    expect(rankTier(1500).label).toBe("白银");
    expect(rankTier(2500).label).toBe("黄金");
    expect(rankTier(4000).label).toBe("铂金");
    expect(rankTier(6000).label).toBe("钻石");
    expect(rankTier(9000).label).toBe("王者");
  });
  it("低于白银仍青铜", () => {
    expect(rankTier(0).label).toBe("青铜");
    expect(rankTier(1499).label).toBe("青铜");
  });
});
