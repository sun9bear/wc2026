import { it, expect } from "vitest";
import { computeBalance, type LedgerEntry } from "./balance";

const ledger: LedgerEntry[] = [
  { reason: "signup", delta: 1000 },
  { reason: "bet_stake", delta: -200 },
  { reason: "bet_payout", delta: 680 },
  { reason: "daily", delta: 50 },
];

it("sums ledger deltas into a balance", () => {
  expect(computeBalance(ledger)).toBe(1530);
});

it("empty ledger is zero", () => {
  expect(computeBalance([])).toBe(0);
});
