import Link from "next/link";
import type { FixtureMatch } from "@/lib/fixtures/matches";
import { TeamBadge } from "@/components/TeamBadge";
import { LocalTime } from "@/components/LocalTime";
import { stageName, groupName } from "@/lib/football/teams";
import { getDict, localeHref, type Locale } from "@/i18n";

export function MatchCard({ match, locale }: { match: FixtureMatch; locale: Locale }) {
  const t = getDict(locale);
  const settled =
    match.status === "settled" && match.homeScore != null && match.awayScore != null;
  const started = !settled && new Date(match.kickoffAt).getTime() <= Date.now();

  return (
    <Link
      href={localeHref(locale, `/match/${match.id}`)}
      className="fade-up block rounded-lg border border-border bg-surface p-4 transition duration-150 hover:-translate-y-0.5 hover:border-green/50 active:scale-[0.99] active:border-green/70"
    >
      <div className="mb-3 flex items-center justify-between text-[11px] md:text-xs text-muted">
        <span>
          {stageName(match.stage, locale)}
          {match.group ? ` · ${groupName(match.group, locale)}` : ""}
        </span>
        {settled && (
          <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-[10px]">
            {t.status.finished}
          </span>
        )}
        {started && (
          <span className="flex items-center gap-1 rounded-pill bg-surface-2 px-2 py-0.5 text-[10px] text-green">
            <span className="live-dot" /> {t.status.live}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <TeamBadge name={match.home.name} locale={locale} />
        <div className="text-center">
          {settled ? (
            <div className="font-head text-xl font-bold">
              {match.homeScore} : {match.awayScore}
            </div>
          ) : (
            <>
              <div className="font-head text-sm font-bold text-muted">VS</div>
              <div className="font-head mt-1 text-xs text-text">
                <LocalTime iso={match.kickoffAt} locale={locale} mode="time" />
              </div>
            </>
          )}
        </div>
        <TeamBadge name={match.away.name} locale={locale} />
      </div>
    </Link>
  );
}
