import { teamZh, flagUrl } from "@/lib/football/teams";

// 队伍展示：真实国旗图片（跨平台）+ 中文队名。
export function TeamBadge({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const url = flagUrl(name);
  const dim = size === "lg" ? "h-9 w-12" : "h-7 w-10";
  return (
    <div className="flex w-24 flex-col items-center gap-2">
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
      <span className="text-center text-sm font-medium">{teamZh(name)}</span>
    </div>
  );
}
