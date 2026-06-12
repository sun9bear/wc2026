import { describe, it, expect } from "vitest";
import { normalizeTeamName, buildNameIndex, lookupTeam } from "./names";
import { parseWorldTsv, parseTeamsTsv, eloFor } from "./elo";

describe("normalizeTeamName", () => {
  it("bridges punctuation variants", () => {
    expect(normalizeTeamName("Bosnia & Herzegovina")).toBe(
      normalizeTeamName("Bosnia-Herzegovina")
    );
    expect(normalizeTeamName("Bosnia and Herzegovina")).toBe(
      normalizeTeamName("Bosnia-Herzegovina")
    );
  });
  it("applies explicit overrides", () => {
    expect(normalizeTeamName("Côte d'Ivoire")).toBe("ivory coast");
    expect(normalizeTeamName("USA")).toBe("united states");
    expect(normalizeTeamName("Türkiye")).toBe("turkey");
    expect(normalizeTeamName("Korea Republic")).toBe("south korea");
  });
});

describe("name index", () => {
  it("looks up across spellings", () => {
    const idx = buildNameIndex([{ name: "Bosnia-Herzegovina", value: "id-1" }]);
    expect(lookupTeam(idx, "Bosnia & Herzegovina")).toBe("id-1");
    expect(lookupTeam(idx, "Unknown FC")).toBeNull();
  });
});

describe("elo parsing", () => {
  // 与 eloratings.net 实测格式一致的样例行
  const world = "1\t1\tES\t2157\t1\t2189\n2\t2\tAR\t2115\t1\t2172\nbad line\n";
  const teams = "ES\tSpain\nUS\tUnited States\tUSA\nUS_loc\tin the United States\n";

  it("parses World.tsv codes and ratings", () => {
    const m = parseWorldTsv(world);
    expect(m.get("ES")).toBe(2157);
    expect(m.get("AR")).toBe(2115);
    expect(m.size).toBe(2);
  });
  it("parses teams tsv with aliases, skipping _loc entries", () => {
    const m = parseTeamsTsv(teams);
    expect(m.get(normalizeTeamName("Spain"))).toBe("ES");
    expect(m.get(normalizeTeamName("USA"))).toBe("US");
    expect([...m.values()]).not.toContain("US_loc");
  });
  it("eloFor chains name → code → rating", () => {
    expect(eloFor("Spain", parseTeamsTsv(teams), parseWorldTsv(world))).toBe(2157);
    expect(eloFor("Atlantis", parseTeamsTsv(teams), parseWorldTsv(world))).toBeNull();
  });
});
