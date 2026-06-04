import { describe, it, expect } from "vitest";
import { isMarketClosed } from "./marketOpen";

const NOW = Date.parse("2026-06-12T00:00:00Z");
const future = "2026-06-12T01:00:00Z"; // 开赛在 now 之后
const past = "2026-06-11T23:00:00Z"; // 已开赛

describe("isMarketClosed", () => {
  it("open when kickoff is in the future and nothing settled", () => {
    expect(
      isMarketClosed({ kickoffAt: future, matchStatus: "scheduled", marketStatus: "open", now: NOW })
    ).toBe(false);
  });
  it("closed once kickoff has passed (live match)", () => {
    expect(
      isMarketClosed({ kickoffAt: past, matchStatus: "scheduled", marketStatus: "open", now: NOW })
    ).toBe(true);
  });
  it("closed when match already settled", () => {
    expect(
      isMarketClosed({ kickoffAt: future, matchStatus: "settled", marketStatus: "open", now: NOW })
    ).toBe(true);
  });
  it("closed when market already settled", () => {
    expect(
      isMarketClosed({ kickoffAt: future, matchStatus: "scheduled", marketStatus: "settled", now: NOW })
    ).toBe(true);
  });
  it("closed (fail-closed) on invalid kickoff timestamp", () => {
    expect(
      isMarketClosed({ kickoffAt: "not-a-date", matchStatus: "scheduled", marketStatus: "open", now: NOW })
    ).toBe(true);
  });
});
