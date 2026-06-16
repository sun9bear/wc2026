import { describe, it, expect } from "vitest";
import { normalizeName, buildGoalsMap } from "./perfScore";
import type { Scorer } from "@/lib/football/getScorers";

const mk = (playerName: string, goals: number): Scorer => ({
  rank: 1,
  playerName,
  nationality: null,
  teamName: "",
  crest: null,
  goals,
  penalties: null,
  playedMatches: null,
});

describe("perfScore", () => {
  it("normalizeName 去重音/标点/大小写", () => {
    expect(normalizeName("Kylian Mbappé")).toBe("kylianmbappe");
    expect(normalizeName("Vinícius Júnior")).toBe("viniciusjunior");
    expect(normalizeName("Son Heung-min")).toBe("sonheungmin");
  });

  it("buildGoalsMap 建归一化名→进球映射，同名取最大", () => {
    const m = buildGoalsMap([mk("Harry Kane", 3), mk("Kylian Mbappé", 5), mk("Harry Kane", 1)]);
    expect(m.get("harrykane")).toBe(3);
    expect(m.get("kylianmbappe")).toBe(5);
    expect(m.size).toBe(2);
  });
});
