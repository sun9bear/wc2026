import Link from "next/link";
import type { FixtureMatch } from "@/lib/fixtures/matches";

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Team({ name, flag }: { name: string; flag: string }) {
  return (
    <div className="flex w-24 flex-col items-center gap-2">
      <span className="text-4xl leading-none">{flag}</span>
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}

export function MatchCard({ match }: { match: FixtureMatch }) {
  return (
    <Link
      href={`/match/${match.id}`}
      className="block rounded-lg border border-border bg-surface p-4 transition hover:border-green/50"
    >
      <div className="mb-3 text-[11px] text-muted">
        {match.stage}
        {match.group ? ` · ${match.group}` : ""}
      </div>
      <div className="flex items-center justify-between">
        <Team name={match.home.name} flag={match.home.flag} />
        <div className="text-center">
          <div className="font-head text-sm font-bold text-muted">VS</div>
          <div className="font-head mt-1 text-xs text-text">{formatKickoff(match.kickoffAt)}</div>
        </div>
        <Team name={match.away.name} flag={match.away.flag} />
      </div>
    </Link>
  );
}
