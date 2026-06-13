import { ImageResponse } from "next/og";
import { getForecast } from "@/lib/prob/pipeline";
import { findTeam } from "@/lib/prob/findTeam";

export const maxDuration = 60;

// 动态 OG 图卡：/api/og?team=south-korea&locale=zh
// 球队出线概率卡（1200×630）——Twitter/Discord/Telegram/WhatsApp 链接自动展开；
// 微信场景由运营者直接打开本路由另存 PNG 投群。
// 文案只用 出线概率/夺冠/chance/advance——双语面均零禁词。

const pct = (x: number) => {
  const v = x > 1 ? x : x * 100;
  return v >= 10 ? v.toFixed(0) : v.toFixed(1);
};

// 中文字形不在 ImageResponse 默认字体里——按需从 Google Fonts 取子集（仅卡上出现的字）。
// 失败则回退英文卡（fail-soft，绝不 500）。
async function loadZhFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&text=${encodeURIComponent(text)}`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
      )
    ).text();
    const m = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/);
    if (!m) return null;
    const r = await fetch(m[1]);
    return r.ok ? await r.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("team") ?? "";
  let locale = searchParams.get("locale") === "zh" ? "zh" : "en";

  const data = await getForecast();
  const hit = q ? findTeam(data, q) : null;

  const updated = new Date(data.updatedAt).toISOString().slice(0, 16).replace("T", " ");

  // 文案
  let fonts: { name: string; data: ArrayBuffer; weight: 700 }[] = [];
  const zhText = hit
    ? `${hit.team.zh}组第名出线概率夺冠万次蒙特卡洛模拟更新于0123456789ABCDEFGHIJKL.%· `
    : "";
  if (locale === "zh") {
    const f = await loadZhFont(zhText + "我的队还有戏吗世界杯出线计算器免费无需注册次蒙特卡洛模拟");
    if (f) fonts = [{ name: "NotoSansSC", data: f, weight: 700 }];
    else locale = "en"; // 字体取不到就出英文卡
  }

  const L =
    locale === "zh"
      ? {
          advance: "出线概率",
          champion: "夺冠",
          group: (x: string, r: number) => `${x} 组 · 当前第 ${r}`,
          sims: "10,000 次蒙特卡洛模拟",
          updated: `更新于 ${updated} UTC`,
          hook: "我的队还有戏吗？",
          sub: "2026 世界杯出线计算器 · 免费 · 无需注册",
        }
      : {
          advance: "Chance to advance",
          champion: "Title chance",
          group: (x: string, r: number) => `Group ${x} · currently ${r}${["st", "nd", "rd"][r - 1] ?? "th"}`,
          sims: "10,000 Monte Carlo simulations",
          updated: `Updated ${updated} UTC`,
          hook: "Can your team still advance?",
          sub: "World Cup 2026 scenario calculator · free · no sign-up",
        };

  const base: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    backgroundColor: "#0c1116",
    color: "#e6edf3",
    padding: 64,
    fontFamily: fonts.length ? "NotoSansSC" : "sans-serif",
  };

  if (!hit) {
    // 品牌兜底卡（无 team 参数或未匹配）
    return new ImageResponse(
      (
        <div style={base}>
          <div style={{ display: "flex", fontSize: 40, color: "#3fb950" }}>⚽ wc2026.cool</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 700 }}>{L.hook}</div>
            <div style={{ display: "flex", fontSize: 36, color: "#8b949e" }}>{L.sub}</div>
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#8b949e" }}>{L.sims}</div>
        </div>
      ),
      { width: 1200, height: 630, fonts: fonts.length ? fonts : undefined }
    );
  }

  const t = hit.team;
  const name = locale === "zh" ? t.zh : t.name;
  const adv = pct(t.pAdvance);
  const champ = pct(t.pChampion);
  const advColor = (t.pAdvance > 1 ? t.pAdvance : t.pAdvance * 100) >= 50 ? "#3fb950" : "#d29922";

  return new ImageResponse(
    (
      <div style={base}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {t.flag ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.flag.replace("/w80/", "/w160/")} width={120} height={84} style={{ borderRadius: 8, objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", fontSize: 84 }}>⚽</div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 64, fontWeight: 700 }}>{name}</div>
              <div style={{ display: "flex", fontSize: 28, color: "#8b949e" }}>
                {L.group(hit.letter, hit.rank)}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "#3fb950" }}>wc2026.cool</div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 32, color: "#8b949e" }}>{L.advance}</div>
            <div style={{ display: "flex", fontSize: 160, fontWeight: 700, color: advColor, lineHeight: 1 }}>
              {adv}%
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", paddingBottom: 16 }}>
            <div style={{ display: "flex", fontSize: 28, color: "#8b949e" }}>{L.champion}</div>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 700 }}>{champ}%</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#8b949e" }}>
          <div style={{ display: "flex" }}>{L.sims}</div>
          <div style={{ display: "flex" }}>{L.updated}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: fonts.length ? fonts : undefined }
  );
}
