/**
 * 探测 football-data.org 的世界杯数据：看赛季、场次、状态分布、样例。
 * 运行：npx tsx scripts/fd-probe.ts
 */
process.loadEnvFile(".env.local");

interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  stage?: string;
  group?: string | null;
  homeTeam?: { id: number; name: string | null };
  awayTeam?: { id: number; name: string | null };
  score?: { fullTime?: { home: number | null; away: number | null } };
}

async function main(): Promise<void> {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) throw new Error("缺少 FOOTBALL_API_KEY");

  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": key },
  });
  console.log("HTTP", res.status);
  const json = (await res.json()) as {
    competition?: { name?: string };
    filters?: unknown;
    resultSet?: unknown;
    matches?: FdMatch[];
    message?: string;
  };
  if (!res.ok) {
    console.log("返回:", json);
    return;
  }
  const matches = json.matches ?? [];
  console.log("competition:", json.competition?.name);
  console.log("filters:", json.filters, "resultSet:", json.resultSet);
  console.log("总场次:", matches.length);

  const byStatus: Record<string, number> = {};
  for (const m of matches) byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
  console.log("状态分布:", byStatus);

  console.log(
    "样例:",
    matches.slice(0, 3).map((m) => ({
      id: m.id,
      date: m.utcDate,
      status: m.status,
      home: m.homeTeam?.name,
      away: m.awayTeam?.name,
      score: m.score?.fullTime,
    }))
  );
}

main().catch((e) => {
  console.error("✗ 失败:", e?.message ?? e);
  process.exit(1);
});
