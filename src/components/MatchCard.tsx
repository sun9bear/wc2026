import Link from "next/link";
import type { FixtureMatch } from "@/lib/fixtures/matches";
import { TeamBadge } from "@/components/TeamBadge";

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export function MatchCard({ match }: { match: FixtureMatch }) {
  const settled =
    match.status === "settled" && match.homeScore != null && match.awayScore != null;

  return (
    <Link
      href={`/match/${match.id}`}
      className="block rounded-lg border border-border bg-surface p-4 transition duration-150 hover:-translate-y-0.5 hover:border-green/50"
    >
      <div className="mb-3 flex items-center justify-between text-[11px] text-muted">
        <span>
          {match.stage}
          {match.group ? ` · ${match.group}` : ""}
        </span>
        {settled && (
          <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-[10px]">已结束</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <TeamBadge name={match.home.name} />
        <div className="text-center">
          {settled ? (
            <div className="font-head text-xl font-bold">
              {match.homeScore} : {match.awayScore}
            </div>
          ) : (
            <>
              <div className="font-head text-sm font-bold text-muted">VS</div>
              <div className="font-head mt-1 text-xs text-text">
                {formatKickoff(match.kickoffAt)}
              </div>
            </>
          )}
        </div>
        <TeamBadge name={match.away.name} />
      </div>
    </Link>
  );
}
