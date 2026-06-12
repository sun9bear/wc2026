import { describe, it, expect } from "vitest";
import {
  R32,
  R16,
  QF,
  SF,
  FINAL,
  THIRD_ALLOWED,
  THIRD_SLOT_ORDER,
  allocateThirds,
  matchThirds,
} from "./bracket";

describe("R32 structure", () => {
  it("has 16 matches numbered 73-88", () => {
    expect(R32).toHaveLength(16);
    expect(R32.map((m) => m.match).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, i) => 73 + i)
    );
  });
  it("third slots never face their own group winner", () => {
    for (const slot of THIRD_SLOT_ORDER) {
      expect(THIRD_ALLOWED[slot]).not.toContain(slot);
    }
  });
  it("progression chain is consistent (every R16 source is an R32 match)", () => {
    const r32 = new Set(R32.map((m) => m.match));
    for (const [x, y] of Object.values(R16)) {
      expect(r32.has(x)).toBe(true);
      expect(r32.has(y)).toBe(true);
    }
    const r16 = new Set(Object.keys(R16).map(Number));
    for (const [x, y] of Object.values(QF)) {
      expect(r16.has(x)).toBe(true);
      expect(r16.has(y)).toBe(true);
    }
    const qf = new Set(Object.keys(QF).map(Number));
    for (const [x, y] of Object.values(SF)) {
      expect(qf.has(x)).toBe(true);
      expect(qf.has(y)).toBe(true);
    }
    expect(FINAL).toEqual([101, 102]);
  });
});

describe("allocateThirds (Annex C lookup)", () => {
  it("matches FIFA row 1: E/F/G/H/I/J/K/L qualified", () => {
    expect(allocateThirds(["E", "F", "G", "H", "I", "J", "K", "L"])).toEqual({
      A: "E",
      B: "J",
      D: "I",
      E: "F",
      G: "H",
      I: "G",
      K: "L",
      L: "K",
    });
  });
  it("matches FIFA row 250: A/C/D/F/G/H/I/J qualified", () => {
    expect(allocateThirds(["A", "C", "D", "F", "G", "H", "I", "J"])).toEqual({
      A: "H",
      B: "G",
      D: "J",
      E: "C",
      G: "A",
      I: "F",
      K: "D",
      L: "I",
    });
  });
  it("every lookup result respects allowed sets (sampled combos)", () => {
    const combos = [
      ["A", "B", "C", "D", "E", "F", "G", "H"],
      ["A", "B", "C", "D", "I", "J", "K", "L"],
      ["B", "C", "E", "F", "H", "I", "K", "L"],
    ];
    for (const c of combos) {
      const m = allocateThirds(c);
      for (const slot of THIRD_SLOT_ORDER) {
        expect(THIRD_ALLOWED[slot]).toContain(m[slot]);
        expect(c).toContain(m[slot]);
      }
      expect(new Set(Object.values(m)).size).toBe(8);
    }
  });
});

describe("matchThirds fallback", () => {
  it("finds a valid perfect matching respecting allowed sets", () => {
    const m = matchThirds(["C", "D", "E", "F", "G", "H", "I", "J"])!;
    expect(m).not.toBeNull();
    for (const slot of THIRD_SLOT_ORDER) expect(THIRD_ALLOWED[slot]).toContain(m[slot]);
    expect(new Set(Object.values(m)).size).toBe(8);
  });
});
