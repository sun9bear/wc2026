import Link from "next/link";
import { teamName, flagUrl } from "@/lib/football/teams";
import { teamSlug } from "@/lib/prob/findTeam";
import type { Locale } from "@/i18n";

// 队伍展示：真实国旗图片（跨平台）+ 按语言显示队名（zh 查表，en 直出 DB 英文原名）。
// linkToTeam=true 时整块包成 → /team/[slug] 详情页链接（任务 B）。默认 false：
// MatchCard 已把整卡包进 /match 的 Link，那里若再开会嵌套 <a>，故保持关闭。
export function TeamBadge({
  name,
  locale,
  size = "md",
  linkToTeam = false,
}: {
  name: string;
  locale: Locale;
  size?: "md" | "lg";
  linkToTeam?: boolean;
}) {
  const url = flagUrl(name);
  const dim = size === "lg" ? "h-9 w-12" : "h-7 w-10";
  const inner = (
    <>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className={`${dim} rounded-sm object-cover ring-1 ring-border`}
        />
      ) : (
        <span className="text-3xl leading-none">⚽</span>
      )}
      <span className="text-center text-sm font-medium">{teamName(name, locale)}</span>
    </>
  );
  const cls = "flex w-24 flex-col items-center gap-2";
  return linkToTeam ? (
    <Link href={`/team/${teamSlug(name)}`} className={`${cls} transition hover:opacity-80`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
