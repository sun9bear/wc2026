import { ImageResponse } from "next/og";
import { getForecast } from "@/lib/prob/pipeline";
import { findTeam } from "@/lib/prob/findTeam";
import { findBannedTerms, findBannedTermsStrict } from "@/lib/compliance/bannedTerms";

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

  // 摆动卡（任务 6）：?mode=swing&team=<slug>&before=93&after=41&result=<一句话>
  // 数值全由调用方（scripts/swing-bake.ts）传入——本路由只渲染，不算数。
  if (searchParams.get("mode") === "swing" && hit) {
    const clamp = (s: string | null) => {
      const v = parseFloat(s ?? "");
      return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : null;
    };
    const before = clamp(searchParams.get("before"));
    const after = clamp(searchParams.get("after"));
    // 路由公开无鉴权——result 任意可控，必须过雷词闸（双语都查，参数不分语言地接受 ASCII/中文）。
    // 命中则整段丢弃（fail-closed），绝不让品牌图卡渲染博彩词（与全站 §9.1 纵深防御一致）。
    const rawResult = (searchParams.get("result") ?? "").slice(0, 60);
    const result =
      findBannedTerms(rawResult, "en").length === 0 && findBannedTerms(rawResult, "zh").length === 0
        ? rawResult
        : "";
    // 分享者署名（用户可控）：① 码点截断到 20（与昵称上限一致，且 Array.from 不拆断代理对，避免 �）；
    // ② 限到「可渲染字符集」CJK+基本拉丁+数字+安全标点，去 emoji/异体脚本 → 卡上不出豆腐块；
    // ③ 严格雷词闸 fail-closed（抗全角/零宽/拆分/驼峰绕过）。署名是短身份串，无正文误伤顾虑。
    const byClean = Array.from(searchParams.get("by") ?? "")
      .slice(0, 20)
      .join("")
      .normalize("NFKC")
      .replace(/[^一-鿿A-Za-z0-9 _.\-·]/g, "")
      .trim();
    const by =
      byClean &&
      findBannedTermsStrict(byClean, "en").length === 0 &&
      findBannedTermsStrict(byClean, "zh").length === 0
        ? byClean
        : "";
    if (before !== null && after !== null) {
      const t = hit.team;
      let fonts: { name: string; data: ArrayBuffer; weight: 700 }[] = [];
      if (locale === "zh") {
        const f = await loadZhFont(
          `${t.zh}${result}${by}出线概率万次蒙特卡洛模拟更新于0123456789.%→·若胜平负 by`
        );
        if (f) fonts = [{ name: "NotoSansSC", data: f, weight: 700 }];
        else locale = "en";
      }
      const L =
        locale === "zh"
          ? { label: "出线概率", sims: "10,000 次蒙特卡洛模拟", updated: `更新于 ${updated} UTC` }
          : {
              label: "Chance to advance",
              sims: "10,000 Monte Carlo simulations",
              updated: `Updated ${updated} UTC`,
            };
      const name = locale === "zh" ? t.zh : t.name;
      const up = after >= before;
      const fmtPct = (v: number) => (v >= 10 ? v.toFixed(0) : v.toFixed(1));
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
                <div style={{ display: "flex", fontSize: 64, fontWeight: 700 }}>{name}</div>
              </div>
              <div style={{ display: "flex", fontSize: 32, color: "#3fb950" }}>wc2026.cool</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", fontSize: 34, color: "#8b949e" }}>{L.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 32 }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 96,
                    fontWeight: 700,
                    color: "#8b949e",
                    textDecoration: "line-through",
                  }}
                >
                  {fmtPct(before)}%
                </div>
                <div style={{ display: "flex", fontSize: 72, color: "#8b949e" }}>→</div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 170,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: up ? "#3fb950" : "#f85149",
                  }}
                >
                  {fmtPct(after)}%
                </div>
              </div>
              {result && (
                <div style={{ display: "flex", fontSize: 36, color: "#e6edf3", marginTop: 8 }}>
                  {result}
                </div>
              )}
              {by && (
                <div style={{ display: "flex", fontSize: 26, color: "#8b949e", marginTop: 6 }}>
                  —— {by}
                </div>
              )}
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
  }

  // 比赛预览卡（mode=match）：对阵 + 模型胜/平/胜概率 + 开球时间 + AI 短评。3:4 竖版(默认)/1:1 方版。
  // 概率/时间/短评全由调用方（比赛页客户端）传入——路由只渲染、不算数、不取当前时区（静态图无法逐观看者本地化）。
  // 安全：队名/时间/短评过雷词闸 fail-closed；队旗仅接受 flagcdn.com（防任意 <img src> 的 SSRF）。
  if (searchParams.get("mode") === "match") {
    const clampPct = (s: string | null) => {
      const v = parseFloat(s ?? "");
      return Number.isFinite(v) ? Math.round(Math.min(100, Math.max(0, v))) : null;
    };
    const clean = (s: string | null, max: number) => {
      const v = (s ?? "").replace(/\s+/g, " ").slice(0, max).trim();
      return v && findBannedTerms(v, "en").length === 0 && findBannedTerms(v, "zh").length === 0 ? v : "";
    };
    const flagOk = (s: string | null) =>
      s && /^https:\/\/flagcdn\.com\//i.test(s) ? s.replace("/w80/", "/w160/") : null;
    const home = clean(searchParams.get("h"), 40);
    const away = clean(searchParams.get("a"), 40);
    const hp = clampPct(searchParams.get("hp"));
    const dp = clampPct(searchParams.get("dp"));
    const ap = clampPct(searchParams.get("ap"));
    const hflag = flagOk(searchParams.get("hf"));
    const aflag = flagOk(searchParams.get("af"));
    const kickoff = clean(searchParams.get("t"), 48);
    const aitake = clean(searchParams.get("q"), 90);
    const square = searchParams.get("fmt") === "square";
    if (home && away && hp !== null && dp !== null && ap !== null) {
      let mfonts: { name: string; data: ArrayBuffer; weight: 700 }[] = [];
      if (locale === "zh") {
        const f = await loadZhFont(
          `${home}${away}${kickoff}${aitake}模型胜平局客胜概率万次蒙特卡洛模拟更新于预测仅供娱乐改一剩余比分自己算出线世界杯小组赛0123456789%·：、，。- `
        );
        if (f) mfonts = [{ name: "NotoSansSC", data: f, weight: 700 }];
        else locale = "en";
      }
      const ML =
        locale === "zh"
          ? { kicker: "世界杯 2026 · 小组赛", hdr: "模型 胜 / 平 / 胜 概率", draw: "平局", sims: "10,000 次蒙特卡洛模拟", updated: `更新于 ${updated} UTC`, cta: "改一改剩余比分，自己算出线 →", disc: "预测仅供娱乐" }
          : { kicker: "World Cup 2026 · Group stage", hdr: "Model win / draw / win chance", draw: "Draw", sims: "10,000 Monte Carlo simulations", updated: `Updated ${updated} UTC`, cta: "Flip any remaining result yourself →", disc: "For entertainment only" };
      const cols = [
        { name: home, pct: hp, color: "#1BE27F", align: "flex-start" as const },
        { name: ML.draw, pct: dp, color: "#FFB02E", align: "center" as const },
        { name: away, pct: ap, color: "#FF5436", align: "flex-end" as const },
      ];
      const team = (name: string, flag: string | null) => (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: 360 }}>
          {flag ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={flag} width={150} height={100} style={{ borderRadius: 10, objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", width: 150, height: 100, borderRadius: 10, backgroundColor: "#1B232D" }} />
          )}
          <div style={{ display: "flex", fontSize: 48, fontWeight: 700, color: "#E8EDF2" }}>{name}</div>
        </div>
      );
      const base: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0A0E13",
        color: "#E8EDF2",
        padding: square ? 72 : 84,
        fontFamily: mfonts.length ? "NotoSansSC" : "sans-serif",
      };
      return new ImageResponse(
        (
          <div style={base}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, backgroundColor: "#1BE27F" }} />
                <div style={{ display: "flex", fontSize: 28, color: "#8A97A6" }}>{ML.kicker}</div>
              </div>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#1BE27F" }}>wc2026.cool</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {team(home, hflag)}
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#3a4654" }}>VS</div>
              {team(away, aflag)}
            </div>

            <div style={{ display: "flex", justifyContent: "center", fontSize: 28, color: "#8A97A6" }}>{kickoff || " "}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", fontSize: 28, color: "#8A97A6" }}>{ML.hdr}</div>
              <div style={{ display: "flex", width: "100%", height: 56, gap: 6 }}>
                <div style={{ display: "flex", flexGrow: hp, flexBasis: 0, borderRadius: 10, backgroundColor: "#1BE27F" }} />
                <div style={{ display: "flex", flexGrow: dp, flexBasis: 0, borderRadius: 10, backgroundColor: "#FFB02E" }} />
                <div style={{ display: "flex", flexGrow: ap, flexBasis: 0, borderRadius: 10, backgroundColor: "#FF5436" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {cols.map((c, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: c.align, width: 280 }}>
                    <div style={{ display: "flex", fontSize: 90, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.pct}%</div>
                    <div style={{ display: "flex", fontSize: 26, color: "#8A97A6", marginTop: 8 }}>{c.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", fontSize: 30, color: "#C9D2DC", lineHeight: 1.35 }}>{aitake ? `“${aitake}”` : " "}</div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80, borderRadius: 14, border: "2px solid #1BE27F", backgroundColor: "#0F2018" }}>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#1BE27F" }}>{ML.cta}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 23, color: "#5a6472" }}>
                <div style={{ display: "flex" }}>{ML.sims}</div>
                <div style={{ display: "flex" }}>{ML.updated}</div>
              </div>
              <div style={{ display: "flex", fontSize: 22, color: "#5a6472" }}>{`wc2026.cool · ${ML.disc}`}</div>
            </div>
          </div>
        ),
        { width: 1080, height: square ? 1080 : 1440, fonts: mfonts.length ? mfonts : undefined }
      );
    }
  }

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
