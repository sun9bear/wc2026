import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { getForecast } from "@/lib/prob/pipeline";
import { findTeam } from "@/lib/prob/findTeam";
import { teamName, flagUrl } from "@/lib/football/teams";
import { getRanking } from "@/lib/players/getRanking";
import { type Locale, isLocale } from "@/i18n";
import { findBannedTermsStrict } from "@/lib/compliance/bannedTerms";

export const maxDuration = 60;

const SITE = "https://www.wc2026.cool";

// 动态 OG 图卡：/api/og?team=south-korea&locale=zh
// 所有模式统一 3:4 竖版（1080×1440，对齐对阵卡）——小红书/微信存图发圈、IG Story；
// 链接预览(Twitter/Discord/Telegram/WhatsApp)按竖版比例展开；微信场景运营者直接打开本路由另存 PNG。
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

// 二维码（任务 D）：只编码本站 URL（path 由调用方传入并白名单过滤），fail-soft 返回 null。
// 仅 zh 卡渲染——微信/小红书长按识别 QR 是标配；西方平台 App 不扫 feed 图 QR，故 en 卡不加。
async function qrDataUrl(path: string | null): Promise<string | null> {
  const safe = path && /^\/[A-Za-z0-9\-_/?=&.%]*$/.test(path) && path.length <= 120 ? path : "/";
  try {
    return await QRCode.toDataURL(`${SITE}${safe}`, {
      margin: 1,
      width: 200,
      errorCorrectionLevel: "M",
      color: { dark: "#0A0E13", light: "#FFFFFF" },
    });
  } catch {
    return null;
  }
}

// 「最可能比分」Top-3（任务 E）：解析 "1-0:17,2-0:12,0-0:8" → ["1-0 17%", …]。
// 纯数字/连字符/冒号，无雷词风险；越界丢弃。
function parseScoreline(sl: string | null): string[] {
  if (!sl) return [];
  return sl
    .split(",")
    .slice(0, 3)
    .map((s) => {
      const m = s.match(/^(\d{1,2})-(\d{1,2}):(\d{1,3})$/);
      if (!m) return null;
      const h = +m[1];
      const a = +m[2];
      const p = +m[3];
      if (h > 20 || a > 20 || p < 1 || p > 100) return null;
      return `${h}-${a} ${p}%`;
    })
    .filter((x): x is string => x !== null);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("team") ?? "";
  // 6 语种 OG 卡：locale 取自 query，非法回落 en。zh 走 CJK 字体；es/pt/de/fr 用默认 Latin 字体
  //（含变音符——en 卡的 Türkiye/México 已验证可渲染）。德语文本偏长，标签已选简短措辞防溢出。
  const localeParam = searchParams.get("locale");
  let locale: Locale = isLocale(localeParam) ? localeParam : "en";

  // 二维码意图（任务 D）：默认仅 zh 卡渲染；qr=1 强制开、qr=0 强制关。u=要编码的站内路径。
  const qrFlag = searchParams.get("qr");
  const uPath = searchParams.get("u");

  // 球迷最爱 Top 10 图卡（mode=ranking）：社区人气指数榜，传播弹药。数据 = getRanking()。
  // 只渲染 DB/聚合静态数据（球员名=策展种子、指数=合成），无任何用户输入文本 → 零雷词风险。
  if (searchParams.get("mode") === "ranking") {
    const ranking = (await getRanking().catch(() => [])).slice(0, 10);
    const nowStr = new Date().toISOString().slice(0, 16).replace("T", " ");
    let rfonts: { name: string; data: ArrayBuffer; weight: 700 }[] = [];
    if (locale === "zh") {
      const txt =
        ranking.map((r) => r.name).join("") +
        ranking.map((r) => teamName(r.teamName, "zh")).join("") +
        "世界杯球迷最爱社区人气指数仅供娱乐扫码投票公开数据更新于0123456789.%· Top";
      const f = await loadZhFont(txt);
      if (f) rfonts = [{ name: "NotoSansSC", data: f, weight: 700 }];
      else locale = "en";
    }
    const RL = (
      {
        zh: { kicker: "世界杯 2026 · 球迷最爱", sub: "社区人气指数 · Top 10", updated: `更新于 ${nowStr} UTC`, disc: "仅供娱乐 · 社区投票与公开数据", scan: "扫码投票" },
        en: { kicker: "World Cup 2026 · Fan Favorites", sub: "Community popularity index · Top 10", updated: `Updated ${nowStr} UTC`, disc: "For entertainment only · community votes + public data", scan: "scan to vote" },
        es: { kicker: "Mundial 2026 · Favoritos de la afición", sub: "Índice de popularidad · Top 10", updated: `Actualizado ${nowStr} UTC`, disc: "Solo entretenimiento · votos + datos públicos", scan: "" },
        pt: { kicker: "Copa 2026 · Favoritos da torcida", sub: "Índice de popularidade · Top 10", updated: `Atualizado ${nowStr} UTC`, disc: "Apenas entretenimento · votos + dados públicos", scan: "" },
        de: { kicker: "WM 2026 · Publikumslieblinge", sub: "Beliebtheits-Index · Top 10", updated: `Aktualisiert ${nowStr} UTC`, disc: "Nur zur Unterhaltung · Stimmen + öffentliche Daten", scan: "" },
        fr: { kicker: "Mondial 2026 · Favoris des fans", sub: "Indice de popularité · Top 10", updated: `Mis à jour ${nowStr} UTC`, disc: "Divertissement · votes + données publiques", scan: "" },
      } as Record<Locale, { kicker: string; sub: string; updated: string; disc: string; scan: string }>
    )[locale];
    const qr = locale === "zh" && qrFlag !== "0" ? await qrDataUrl(uPath ?? "/popularity") : null;
    const rbase: React.CSSProperties = {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      backgroundColor: "#0A0E13",
      color: "#E8EDF2",
      padding: 64,
      fontFamily: rfonts.length ? "NotoSansSC" : "sans-serif",
    };
    return new ImageResponse(
      (
        <div style={rbase}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, backgroundColor: "#1BE27F" }} />
                <div style={{ display: "flex", fontSize: 28, color: "#8A97A6" }}>{RL.kicker}</div>
              </div>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#1BE27F" }}>wc2026.cool</div>
            </div>
            <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: "#E8EDF2" }}>{RL.sub}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", marginTop: 8 }}>
            {ranking.map((r, i) => {
              const flag = flagUrl(r.teamName);
              return (
                <div
                  key={r.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 74, borderBottom: "1px solid #161C24" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <div style={{ display: "flex", width: 40, justifyContent: "flex-end", fontSize: 30, fontWeight: 700, color: i < 3 ? "#1BE27F" : "#8A97A6" }}>{i + 1}</div>
                    {flag ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={flag.replace("/w80/", "/w160/")} width={54} height={36} style={{ borderRadius: 5, objectFit: "cover" }} />
                    ) : (
                      <div style={{ display: "flex", width: 54, height: 36, borderRadius: 5, backgroundColor: "#1B232D" }} />
                    )}
                    <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#E8EDF2" }}>{r.name}</div>
                    <div style={{ display: "flex", fontSize: 22, color: "#5a6472" }}>{teamName(r.teamName, locale)}</div>
                  </div>
                  <div style={{ display: "flex", width: 90, justifyContent: "flex-end", fontSize: 34, fontWeight: 700, color: "#1BE27F" }}>{r.index}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginTop: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, color: "#5a6472" }}>
              <div style={{ display: "flex", fontSize: 23 }}>{RL.updated}</div>
              <div style={{ display: "flex", fontSize: 21 }}>{`wc2026.cool · ${RL.disc}`}</div>
            </div>
            {qr ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} width={120} height={120} style={{ borderRadius: 10 }} />
                <div style={{ display: "flex", fontSize: 20, color: "#8A97A6" }}>{RL.scan}</div>
              </div>
            ) : null}
          </div>
        </div>
      ),
      { width: 1080, height: 1440, fonts: rfonts.length ? rfonts : undefined }
    );
  }

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
    // 路由公开无鉴权——result 任意可控，必须过严格雷词闸（NFKC+去零宽+删分隔+子串，抗全角/拆分/驼峰绕过，
    // 与同卡 by 同级；词边界版会被 BetKing/ｂｅｔ/b.e.t 绕过）。命中则整段丢弃（fail-closed），
    // 绝不让品牌图卡渲染博彩词（与全站 §9.1 纵深防御一致）。
    const rawResult = (searchParams.get("result") ?? "").slice(0, 60);
    const result =
      findBannedTermsStrict(rawResult, "en").length === 0 &&
      findBannedTermsStrict(rawResult, "zh").length === 0
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
          `${t.zh}${result}${by}出线概率万次蒙特卡洛模拟更新于赛前预测仅供娱乐0123456789.%·`
        );
        if (f) fonts = [{ name: "NotoSansSC", data: f, weight: 700 }];
        else locale = "en";
      }
      const L = (
        {
          zh: { label: "出线概率", from: "赛前", sims: "10,000 次蒙特卡洛模拟", updated: `更新于 ${updated} UTC`, disc: "预测仅供娱乐" },
          en: { label: "Chance to advance", from: "was", sims: "10,000 Monte Carlo simulations", updated: `Updated ${updated} UTC`, disc: "For entertainment only" },
          es: { label: "Probabilidad de avanzar", from: "era", sims: "10.000 simulaciones de Montecarlo", updated: `Actualizado ${updated} UTC`, disc: "Solo para entretenimiento" },
          pt: { label: "Chance de avançar", from: "era", sims: "10.000 simulações de Monte Carlo", updated: `Atualizado ${updated} UTC`, disc: "Apenas entretenimento" },
          de: { label: "Weiterkommen-Chance", from: "war", sims: "10.000 Monte-Carlo-Simulationen", updated: `Aktualisiert ${updated} UTC`, disc: "Nur zur Unterhaltung" },
          fr: { label: "Chance de qualification", from: "était", sims: "10 000 simulations Monte-Carlo", updated: `Mis à jour ${updated} UTC`, disc: "Divertissement uniquement" },
        } as Record<Locale, { label: string; from: string; sims: string; updated: string; disc: string }>
      )[locale];
      const name = locale === "zh" ? t.zh : teamName(t.name, locale);
      const up = after >= before;
      const fmtPct = (v: number) => (v >= 10 ? v.toFixed(0) : v.toFixed(1));
      const base: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0A0E13",
        color: "#E8EDF2",
        padding: 84,
        fontFamily: fonts.length ? "NotoSansSC" : "sans-serif",
      };
      return new ImageResponse(
        (
          <div style={base}>
            {/* 顶部：队旗 + 队名 ｜ 品牌（长队名换行不挤压品牌） */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 28, flex: 1, minWidth: 0 }}>
                {t.flag ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.flag.replace("/w80/", "/w160/")} width={150} height={100} style={{ borderRadius: 10, objectFit: "cover" }} />
                ) : (
                  <div style={{ display: "flex", fontSize: 96 }}>⚽</div>
                )}
                <div style={{ display: "flex", flex: 1, minWidth: 0, fontSize: 56, fontWeight: 700, color: "#E8EDF2", lineHeight: 1.05 }}>{name}</div>
              </div>
              <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#1BE27F", flexShrink: 0 }}>wc2026.cool</div>
            </div>

            {/* 中部：出线概率大数字（after）+ 赛前值（before 删除线） */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, gap: 8 }}>
              <div style={{ display: "flex", fontSize: 42, color: "#8A97A6" }}>{L.label}</div>
              <div style={{ display: "flex", fontSize: 250, fontWeight: 700, lineHeight: 1, color: up ? "#1BE27F" : "#FF5436" }}>
                {fmtPct(after)}%
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 8 }}>
                <div style={{ display: "flex", fontSize: 40, color: "#5a6472" }}>{L.from}</div>
                <div style={{ display: "flex", fontSize: 60, color: "#5a6472", textDecoration: "line-through" }}>
                  {fmtPct(before)}%
                </div>
              </div>
            </div>

            {/* 结果文案 + 署名 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {result ? (
                <div style={{ display: "flex", width: "100%", justifyContent: "center", textAlign: "center", fontSize: 42, color: "#C9D2DC", lineHeight: 1.25 }}>
                  {result}
                </div>
              ) : null}
              {by ? (
                <div style={{ display: "flex", fontSize: 30, color: "#8A97A6" }}>—— {by}</div>
              ) : null}
            </div>

            {/* 底部 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#5a6472" }}>
                <div style={{ display: "flex" }}>{L.sims}</div>
                <div style={{ display: "flex" }}>{L.updated}</div>
              </div>
              <div style={{ display: "flex", fontSize: 24, color: "#5a6472" }}>{`wc2026.cool · ${L.disc}`}</div>
            </div>
          </div>
        ),
        { width: 1080, height: 1440, fonts: fonts.length ? fonts : undefined }
      );
    }
  }

  // 比赛预览卡（mode=match）：对阵 + 模型胜/平/胜概率 + 开球时间 + AI 短评。统一 3:4 竖版（1080×1440）。
  // 概率/时间/短评全由调用方（比赛页客户端）传入——路由只渲染、不算数、不取当前时区（静态图无法逐观看者本地化）。
  // 安全：队名/时间/短评过雷词闸 fail-closed；队旗仅接受 flagcdn.com（防任意 <img src> 的 SSRF）。
  if (searchParams.get("mode") === "match") {
    const clampPct = (s: string | null) => {
      const v = parseFloat(s ?? "");
      return Number.isFinite(v) ? Math.round(Math.min(100, Math.max(0, v))) : null;
    };
    const clean = (s: string | null, max: number) => {
      const v = (s ?? "").replace(/\s+/g, " ").slice(0, max).trim();
      // 用户可控且渲染到品牌图卡 → 严格雷词闸 fail-closed（NFKC+去零宽+删分隔+子串，抗全角/拆分/驼峰绕过），
      // 与同卡 by/result 同级（findBannedTerms 词边界版会被 BetKing/ｂｅｔ/b.e.t 绕过）。
      return v &&
        findBannedTermsStrict(v, "en").length === 0 &&
        findBannedTermsStrict(v, "zh").length === 0
        ? v
        : "";
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
    const kdate = clean(searchParams.get("t"), 48);
    const ktime = clean(searchParams.get("t2"), 48);
    const aitake = clean(searchParams.get("q"), 90);
    if (home && away && hp !== null && dp !== null && ap !== null) {
      let mfonts: { name: string; data: ArrayBuffer; weight: 700 }[] = [];
      if (locale === "zh") {
        const f = await loadZhFont(
          `${home}${away}${kdate}${ktime}${aitake}模型胜平局客胜概率万次蒙特卡洛模拟更新于预测仅供娱乐改一剩余比分自己算出线世界杯小组赛最可能扫码0123456789%·：、，。- `
        );
        if (f) mfonts = [{ name: "NotoSansSC", data: f, weight: 700 }];
        else locale = "en";
      }
      const ML = (
        {
          zh: { kicker: "世界杯 2026 · 小组赛", hdr: "模型 胜 / 平 / 胜 概率", draw: "平局", sims: "10,000 次蒙特卡洛模拟", updated: `更新于 ${updated} UTC`, cta: "改一改剩余比分，自己算出线 →", disc: "预测仅供娱乐", scoreLbl: "最可能比分", scan: "扫码自己算" },
          en: { kicker: "World Cup 2026 · Group stage", hdr: "Model win / draw / win chance", draw: "Draw", sims: "10,000 Monte Carlo simulations", updated: `Updated ${updated} UTC`, cta: "Flip any remaining result yourself →", disc: "For entertainment only", scoreLbl: "Most likely", scan: "" },
          es: { kicker: "Mundial 2026 · Fase de grupos", hdr: "Prob. del modelo V / E / V", draw: "Empate", sims: "10.000 simulaciones de Montecarlo", updated: `Actualizado ${updated} UTC`, cta: "Cambia tú los resultados restantes →", disc: "Solo para entretenimiento", scoreLbl: "Más probable", scan: "" },
          pt: { kicker: "Copa 2026 · Fase de grupos", hdr: "Prob. do modelo V / E / V", draw: "Empate", sims: "10.000 simulações de Monte Carlo", updated: `Atualizado ${updated} UTC`, cta: "Mude você os resultados restantes →", disc: "Apenas entretenimento", scoreLbl: "Mais provável", scan: "" },
          de: { kicker: "WM 2026 · Gruppenphase", hdr: "Modell S / U / S-Chance", draw: "Remis", sims: "10.000 Monte-Carlo-Simulationen", updated: `Aktualisiert ${updated} UTC`, cta: "Ändere selbst die Restergebnisse →", disc: "Nur zur Unterhaltung", scoreLbl: "Wahrscheinlich", scan: "" },
          fr: { kicker: "Mondial 2026 · Phase de groupes", hdr: "Prob. modèle V / N / V", draw: "Nul", sims: "10 000 simulations Monte-Carlo", updated: `Mis à jour ${updated} UTC`, cta: "Modifie les résultats restants →", disc: "Divertissement uniquement", scoreLbl: "Plus probable", scan: "" },
        } as Record<Locale, { kicker: string; hdr: string; draw: string; sims: string; updated: string; cta: string; disc: string; scoreLbl: string; scan: string }>
      )[locale];
      const scoreParts = parseScoreline(searchParams.get("sl"));
      const scoreLine = scoreParts.length ? `${ML.scoreLbl}  ${scoreParts.join(" · ")}` : "";
      const qr = locale === "zh" && qrFlag !== "0" ? await qrDataUrl(uPath) : null;
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
          <div style={{ display: "flex", width: "100%", justifyContent: "center", textAlign: "center", fontSize: 48, fontWeight: 700, color: "#E8EDF2", lineHeight: 1.1 }}>{name}</div>
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
        padding: 84,
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

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                {team(home, hflag)}
                <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#3a4654" }}>VS</div>
                {team(away, aflag)}
              </div>
              {/* 开球时间：紧贴 VS 下方，拆两行（日期+星期 / 时区+时间） */}
              {kdate ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ display: "flex", fontSize: 30, color: "#C9D2DC" }}>{kdate}</div>
                  {ktime ? (
                    <div style={{ display: "flex", fontSize: 26, color: "#8A97A6" }}>{ktime}</div>
                  ) : null}
                </div>
              ) : (
                <div style={{ display: "flex" }} />
              )}
            </div>

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
              {scoreLine ? (
                <div style={{ display: "flex", fontSize: 27, color: "#C9D2DC" }}>{scoreLine}</div>
              ) : null}
            </div>

            <div style={{ display: "flex", fontSize: 30, color: "#C9D2DC", lineHeight: 1.35 }}>{aitake ? `“${aitake}”` : " "}</div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80, borderRadius: 14, border: "2px solid #1BE27F", backgroundColor: "#0F2018" }}>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#1BE27F" }}>{ML.cta}</div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flexGrow: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 23, color: "#5a6472" }}>
                  <div style={{ display: "flex" }}>{ML.sims}</div>
                  <div style={{ display: "flex" }}>{ML.updated}</div>
                </div>
                <div style={{ display: "flex", fontSize: 22, color: "#5a6472" }}>{`wc2026.cool · ${ML.disc}`}</div>
              </div>
              {qr ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} width={124} height={124} style={{ borderRadius: 10 }} />
                  <div style={{ display: "flex", fontSize: 20, color: "#8A97A6" }}>{ML.scan}</div>
                </div>
              ) : null}
            </div>
          </div>
        ),
        { width: 1080, height: 1440, fonts: mfonts.length ? mfonts : undefined }
      );
    }
  }

  // 赛后「比分战报」卡（mode=report）：终场比分 + 该比分赛前排第几/概率（不在 Top-5 = 冷门）+
  // 赛前 Top-5 分布（实际高亮）+ 该结果赛前概率。每场都能出，触发频率远高于摆动卡，主打分享。
  // 数值由 getMatchReport 经 reportOgPath 传入；用户可控文本过严格雷词闸 fail-closed；队旗仅 flagcdn。
  if (searchParams.get("mode") === "report") {
    const cleanR = (s: string | null, max: number) => {
      const v = (s ?? "").replace(/\s+/g, " ").slice(0, max).trim();
      return v &&
        findBannedTermsStrict(v, "en").length === 0 &&
        findBannedTermsStrict(v, "zh").length === 0
        ? v
        : "";
    };
    const intIn = (s: string | null, max: number) => {
      const v = parseInt(s ?? "", 10);
      return Number.isFinite(v) ? Math.min(max, Math.max(0, v)) : 0;
    };
    const flagOkR = (s: string | null) =>
      s && /^https:\/\/flagcdn\.com\//i.test(s) ? s.replace("/w80/", "/w160/") : null;
    const home = cleanR(searchParams.get("h"), 40);
    const away = cleanR(searchParams.get("a"), 40);
    const hs = intIn(searchParams.get("hs"), 30);
    const as = intIn(searchParams.get("as"), 30);
    const rk = intIn(searchParams.get("rk"), 5);
    const sp = intIn(searchParams.get("sp"), 100);
    const op = intIn(searchParams.get("op"), 100);
    const oc = searchParams.get("oc");
    const outcome = oc === "home" || oc === "draw" || oc === "away" ? oc : "draw";
    const hflag = flagOkR(searchParams.get("hf"));
    const aflag = flagOkR(searchParams.get("af"));
    const rcells = (searchParams.get("sl") ?? "")
      .split(",")
      .slice(0, 5)
      .map((s) => {
        const mm = s.match(/^(\d{1,2})-(\d{1,2}):(\d{1,3})$/);
        if (!mm) return null;
        const h = +mm[1];
        const a = +mm[2];
        const p = +mm[3];
        if (h > 20 || a > 20 || p < 1 || p > 100) return null;
        return { h, a, p };
      })
      .filter((x): x is { h: number; a: number; p: number } => x !== null);
    if (home && away) {
      let rfonts: { name: string; data: ArrayBuffer; weight: 700 }[] = [];
      if (locale === "zh") {
        const f = await loadZhFont(
          `${home}${away}世界杯赛后战报前第可能比分冷门都没有它模型给这一结果最更新于次蒙特卡洛模拟预测仅供娱乐扫码自己算改剩余出线看全部0123456789.%·-`
        );
        if (f) rfonts = [{ name: "NotoSansSC", data: f, weight: 700 }];
        else locale = "en";
      }
      const cold = rk === 0;
      const RL = (
        {
          zh: {
            kicker: "世界杯 2026 · 赛后战报",
            hook: cold ? "赛前 Top-5 都没有它 · 冷门" : `赛前第 ${rk} 可能比分 · ${sp}%`,
            outcome: `模型赛前给这一结果 ${op}%`,
            topH: "赛前最可能比分",
            sims: "10,000 次蒙特卡洛模拟",
            updated: `更新于 ${updated} UTC`,
            disc: "预测仅供娱乐",
            cta: "改剩余比分，自己算出线 →",
            scan: "扫码自己算",
          },
          en: {
            kicker: "World Cup 2026 · Full-time",
            hook: cold ? "Not in the pre-match Top 5 · upset" : `Pre-match #${rk} most likely · ${sp}%`,
            outcome: `Model gave this result ${op}% pre-match`,
            topH: "Pre-match most likely scores",
            sims: "10,000 Monte Carlo simulations",
            updated: `Updated ${updated} UTC`,
            disc: "For entertainment only",
            cta: "Flip remaining results yourself →",
            scan: "",
          },
          es: {
            kicker: "Mundial 2026 · Final",
            hook: cold ? "Fuera del Top 5 previo · sorpresa" : `#${rk} más probable previo · ${sp}%`,
            outcome: `El modelo le dio ${op}% antes del partido`,
            topH: "Marcadores más probables previos",
            sims: "10.000 simulaciones de Montecarlo",
            updated: `Actualizado ${updated} UTC`,
            disc: "Solo para entretenimiento",
            cta: "Cambia los resultados restantes →",
            scan: "",
          },
          pt: {
            kicker: "Copa 2026 · Fim de jogo",
            hook: cold ? "Fora do Top 5 prévio · zebra" : `#${rk} mais provável prévio · ${sp}%`,
            outcome: `O modelo deu ${op}% antes do jogo`,
            topH: "Placares mais prováveis prévios",
            sims: "10.000 simulações de Monte Carlo",
            updated: `Atualizado ${updated} UTC`,
            disc: "Apenas entretenimento",
            cta: "Mude os resultados restantes →",
            scan: "",
          },
          de: {
            kicker: "WM 2026 · Schlusspfiff",
            hook: cold ? "Nicht in den Top 5 vorab · Überraschung" : `#${rk} wahrscheinlichst vorab · ${sp}%`,
            outcome: `Modell gab vorab ${op}%`,
            topH: "Wahrscheinlichste Ergebnisse vorab",
            sims: "10.000 Monte-Carlo-Simulationen",
            updated: `Aktualisiert ${updated} UTC`,
            disc: "Nur zur Unterhaltung",
            cta: "Ändere die Restergebnisse →",
            scan: "",
          },
          fr: {
            kicker: "Mondial 2026 · Fin du match",
            hook: cold ? "Hors du Top 5 d'avant-match · surprise" : `#${rk} plus probable avant-match · ${sp}%`,
            outcome: `Le modèle a donné ${op}% avant le match`,
            topH: "Scores les plus probables avant-match",
            sims: "10 000 simulations Monte-Carlo",
            updated: `Mis à jour ${updated} UTC`,
            disc: "Divertissement uniquement",
            cta: "Modifie les résultats restants →",
            scan: "",
          },
        } as Record<Locale, { kicker: string; hook: string; outcome: string; topH: string; sims: string; updated: string; disc: string; cta: string; scan: string }>
      )[locale];
      const hookColor = cold ? "#FF5436" : rk <= 2 ? "#1BE27F" : "#FFB02E";
      const qr = locale === "zh" && qrFlag !== "0" ? await qrDataUrl(uPath) : null;
      const rteam = (nm: string, flag: string | null) => (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: 300 }}>
          {flag ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={flag} width={130} height={87} style={{ borderRadius: 8, objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", width: 130, height: 87, borderRadius: 8, backgroundColor: "#1B232D" }} />
          )}
          <div style={{ display: "flex", width: "100%", justifyContent: "center", textAlign: "center", fontSize: 40, fontWeight: 700, color: "#E8EDF2", lineHeight: 1.1 }}>
            {nm}
          </div>
        </div>
      );
      const rbase: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0A0E13",
        color: "#E8EDF2",
        padding: 72,
        fontFamily: rfonts.length ? "NotoSansSC" : "sans-serif",
      };
      return new ImageResponse(
        (
          <div style={rbase}>
            {/* 顶部 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, backgroundColor: "#1BE27F" }} />
                <div style={{ display: "flex", fontSize: 28, color: "#8A97A6" }}>{RL.kicker}</div>
              </div>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#1BE27F" }}>wc2026.cool</div>
            </div>

            {/* 对阵 + 终场比分 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {rteam(home, hflag)}
              <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 120, fontWeight: 700, lineHeight: 1 }}>
                <div style={{ display: "flex", color: outcome === "home" ? "#1BE27F" : "#E8EDF2" }}>{hs}</div>
                <div style={{ display: "flex", fontSize: 64, color: "#3a4654" }}>-</div>
                <div style={{ display: "flex", color: outcome === "away" ? "#1BE27F" : "#E8EDF2" }}>{as}</div>
              </div>
              {rteam(away, aflag)}
            </div>

            {/* 故事钩子：赛前排第几 / 冷门 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 104, borderRadius: 14, border: `2px solid ${hookColor}`, backgroundColor: "#0F1620" }}>
              <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: hookColor }}>{RL.hook}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", fontSize: 28, color: "#C9D2DC" }}>{RL.outcome}</div>

            {/* 赛前 Top-5（实际比分高亮） */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", fontSize: 26, color: "#8A97A6" }}>{RL.topH}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {rcells.map((c, i) => {
                  const isActual = c.h === hs && c.a === as;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 48, paddingLeft: 14, paddingRight: 14, borderRadius: 8, backgroundColor: isActual ? "#10241B" : "#11161D" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ display: "flex", width: 28, fontSize: 24, color: "#5a6472" }}>{i + 1}</div>
                        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: isActual ? "#1BE27F" : "#E8EDF2" }}>{`${c.h}-${c.a}`}</div>
                        {isActual ? <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, backgroundColor: "#1BE27F" }} /> : null}
                      </div>
                      <div style={{ display: "flex", fontSize: 28, color: isActual ? "#1BE27F" : "#8A97A6" }}>{c.p}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 74, borderRadius: 14, border: "2px solid #1BE27F", backgroundColor: "#0F2018" }}>
              <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#1BE27F" }}>{RL.cta}</div>
            </div>

            {/* 底部 */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexGrow: 1, color: "#5a6472" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 22 }}>
                  <div style={{ display: "flex" }}>{RL.sims}</div>
                  <div style={{ display: "flex" }}>{RL.updated}</div>
                </div>
                <div style={{ display: "flex", fontSize: 21 }}>{`wc2026.cool · ${RL.disc}`}</div>
              </div>
              {qr ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} width={110} height={110} style={{ borderRadius: 10 }} />
                  <div style={{ display: "flex", fontSize: 19, color: "#8A97A6" }}>{RL.scan}</div>
                </div>
              ) : null}
            </div>
          </div>
        ),
        { width: 1080, height: 1440, fonts: rfonts.length ? rfonts : undefined }
      );
    }
  }

  // 最佳第三名 OC 数据图（mode=thirds）：12 组第三名横排 + 前 8 晋级分数线。
  // 数据 = getForecast().thirds（已按 2026 判据 pts→gd→gf 排名）；出线概率关联小组表。
  // 纯数据图、零博彩词——给 Reddit r/worldcup / 国家队 sub 的 OC 素材；6/22-27 末轮峰值需求。
  if (searchParams.get("mode") === "thirds" && data.thirds.length) {
    const thirds = data.thirds;
    const pAdvById = new Map<string, number>(
      data.groups.flatMap((g) => g.table).map((t) => [t.id, t.pAdvance] as const)
    );
    let tfonts: { name: string; data: ArrayBuffer; weight: 700 }[] = [];
    if (locale === "zh") {
      const namesZh = thirds.map((t) => t.zh).join("");
      const f = await loadZhFont(
        `${namesZh}世界杯最佳第三名前晋级强出线分数次蒙特卡洛模拟更新于预测仅供娱乐扫码自己算0123456789.%·`
      );
      if (f) tfonts = [{ name: "NotoSansSC", data: f, weight: 700 }];
      else locale = "en";
    }
    const cut = thirds.find((t) => t.rank === 8) ?? thirds[thirds.length - 1];
    const TL = (
      {
        zh: {
          kicker: "世界杯 2026 · 最佳第三名",
          sub: `前 8 晋级 32 强 · 出线分数线 ${cut.pts} 分`,
          ptsUnit: "分",
          sims: "10,000 次蒙特卡洛模拟",
          updated: `更新于 ${updated} UTC`,
          disc: "预测仅供娱乐",
          scan: "扫码自己算",
        },
        en: {
          kicker: "World Cup 2026 · Best 3rd-placed",
          sub: `Top 8 advance to R32 · cut-off ${cut.pts} pts`,
          ptsUnit: "pts",
          sims: "10,000 Monte Carlo simulations",
          updated: `Updated ${updated} UTC`,
          disc: "For entertainment only",
          scan: "scan to run it",
        },
        es: {
          kicker: "Mundial 2026 · Mejores terceros",
          sub: `Top 8 a 16avos · corte ${cut.pts} pts`,
          ptsUnit: "pts",
          sims: "10.000 simulaciones de Montecarlo",
          updated: `Actualizado ${updated} UTC`,
          disc: "Solo para entretenimiento",
          scan: "",
        },
        pt: {
          kicker: "Copa 2026 · Melhores terceiros",
          sub: `Top 8 às 16avas · corte ${cut.pts} pts`,
          ptsUnit: "pts",
          sims: "10.000 simulações de Monte Carlo",
          updated: `Atualizado ${updated} UTC`,
          disc: "Apenas entretenimento",
          scan: "",
        },
        de: {
          kicker: "WM 2026 · Beste Dritte",
          sub: `Top 8 ins Sechzehntelfinale · Grenze ${cut.pts} Pkt`,
          ptsUnit: "Pkt",
          sims: "10.000 Monte-Carlo-Simulationen",
          updated: `Aktualisiert ${updated} UTC`,
          disc: "Nur zur Unterhaltung",
          scan: "",
        },
        fr: {
          kicker: "Mondial 2026 · Meilleurs troisièmes",
          sub: `Top 8 en 16es · barre ${cut.pts} pts`,
          ptsUnit: "pts",
          sims: "10 000 simulations Monte-Carlo",
          updated: `Mis à jour ${updated} UTC`,
          disc: "Divertissement uniquement",
          scan: "",
        },
      } as Record<Locale, { kicker: string; sub: string; ptsUnit: string; sims: string; updated: string; disc: string; scan: string }>
    )[locale];
    const qr = locale === "zh" && qrFlag !== "0" ? await qrDataUrl(uPath ?? "/forecast/best-thirds") : null;
    const tbase: React.CSSProperties = {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      backgroundColor: "#0A0E13",
      color: "#E8EDF2",
      padding: 64,
      fontFamily: tfonts.length ? "NotoSansSC" : "sans-serif",
    };
    return new ImageResponse(
      (
        <div style={tbase}>
          {/* 顶部：kicker + 品牌 + 答案副标 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, backgroundColor: "#1BE27F" }} />
                <div style={{ display: "flex", fontSize: 28, color: "#8A97A6" }}>{TL.kicker}</div>
              </div>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#1BE27F" }}>wc2026.cool</div>
            </div>
            <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: "#E8EDF2" }}>{TL.sub}</div>
          </div>

          {/* 12 组第三名横排 */}
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", marginTop: 8 }}>
            {thirds.map((t) => {
              const pa = pAdvById.get(t.id);
              const top8 = t.rank <= 8;
              const nm = locale === "zh" ? t.zh : teamName(t.name, locale);
              return (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: 74,
                    opacity: top8 ? 1 : 0.45,
                    borderBottom:
                      t.rank === 8 ? "3px dashed rgba(27,226,127,0.7)" : "1px solid #161C24",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <div style={{ display: "flex", width: 40, justifyContent: "flex-end", fontSize: 30, fontWeight: 700, color: top8 ? "#1BE27F" : "#8A97A6" }}>
                      {t.rank}
                    </div>
                    {t.flag ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.flag.replace("/w80/", "/w160/")} width={54} height={36} style={{ borderRadius: 5, objectFit: "cover" }} />
                    ) : (
                      <div style={{ display: "flex", width: 54, height: 36, borderRadius: 5, backgroundColor: "#1B232D" }} />
                    )}
                    <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#E8EDF2" }}>{nm}</div>
                    <div style={{ display: "flex", fontSize: 22, color: "#5a6472" }}>{t.letter}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ display: "flex", fontSize: 24, color: "#8A97A6" }}>
                      {`${t.pts}${TL.ptsUnit} GD${t.gd >= 0 ? "+" : ""}${t.gd}`}
                    </div>
                    {data.simOk && typeof pa === "number" ? (
                      <div style={{ display: "flex", width: 100, justifyContent: "flex-end", fontSize: 30, fontWeight: 700, color: "#1BE27F" }}>
                        {Math.round(pa * 100)}%
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 底部：模拟/更新 + 免责 + 二维码 */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginTop: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, color: "#5a6472" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: 560, fontSize: 23 }}>
                <div style={{ display: "flex" }}>{TL.sims}</div>
                <div style={{ display: "flex" }}>{TL.updated}</div>
              </div>
              <div style={{ display: "flex", fontSize: 21 }}>{`wc2026.cool · ${TL.disc}`}</div>
            </div>
            {qr ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} width={120} height={120} style={{ borderRadius: 10 }} />
                <div style={{ display: "flex", fontSize: 20, color: "#8A97A6" }}>{TL.scan}</div>
              </div>
            ) : null}
          </div>
        </div>
      ),
      { width: 1080, height: 1440, fonts: tfonts.length ? tfonts : undefined }
    );
  }

  // 文案
  let fonts: { name: string; data: ArrayBuffer; weight: 700 }[] = [];
  const zhText = hit
    ? `${hit.team.zh}组第名当前出线概率夺冠万次蒙特卡洛模拟更新于0123456789ABCDEFGHIJKL.%· `
    : "";
  // 署名标签（任务 C「我的主队」分享图）：用户经 slug 间接可控 → 过雷词闸 + 截断 fail-closed。
  const tagRaw = (searchParams.get("tag") ?? "").replace(/\s+/g, " ").slice(0, 24).trim();
  const tag =
    tagRaw &&
    findBannedTermsStrict(tagRaw, "en").length === 0 &&
    findBannedTermsStrict(tagRaw, "zh").length === 0
      ? tagRaw
      : "";
  if (locale === "zh") {
    const f = await loadZhFont(
      zhText + tag + "我的队还有戏吗？世界杯出线计算器免费无需注册次蒙特卡洛模拟扫码自己算主队"
    );
    if (f) fonts = [{ name: "NotoSansSC", data: f, weight: 700 }];
    else locale = "en"; // 字体取不到就出英文卡
  }
  // 二维码（任务 D）：team/brand 卡 zh 时角落小 QR；locale 已在上方字体回退后定型。
  const qr = locale === "zh" && qrFlag !== "0" ? await qrDataUrl(uPath) : null;
  const scanLabel = "扫码自己算";

  const L = (
    {
      zh: {
        advance: "出线概率",
        champion: "夺冠",
        group: (x: string, r: number) => `${x} 组 · 当前第 ${r}`,
        sims: "10,000 次蒙特卡洛模拟",
        updated: `更新于 ${updated} UTC`,
        hook: "我的队还有戏吗？",
        sub: "2026 世界杯出线计算器 · 免费 · 无需注册",
      },
      en: {
        advance: "Chance to advance",
        champion: "Title chance",
        group: (x: string, r: number) => `Group ${x} · currently ${r}${["st", "nd", "rd"][r - 1] ?? "th"}`,
        sims: "10,000 Monte Carlo simulations",
        updated: `Updated ${updated} UTC`,
        hook: "Can your team still advance?",
        sub: "World Cup 2026 scenario calculator · free · no sign-up",
      },
      es: {
        advance: "Probabilidad de avanzar",
        champion: "Título",
        group: (x: string, r: number) => `Grupo ${x} · actualmente ${r}.º`,
        sims: "10.000 simulaciones de Montecarlo",
        updated: `Actualizado ${updated} UTC`,
        hook: "¿Tu equipo aún tiene opciones?",
        sub: "Calculadora de escenarios del Mundial 2026 · gratis · sin registro",
      },
      pt: {
        advance: "Chance de avançar",
        champion: "Título",
        group: (x: string, r: number) => `Grupo ${x} · atualmente ${r}º`,
        sims: "10.000 simulações de Monte Carlo",
        updated: `Atualizado ${updated} UTC`,
        hook: "Sua seleção ainda tem chance?",
        sub: "Calculadora de cenários da Copa 2026 · grátis · sem cadastro",
      },
      de: {
        advance: "Weiterkommen-Chance",
        champion: "Titelchance",
        group: (x: string, r: number) => `Gruppe ${x} · aktuell Platz ${r}`,
        sims: "10.000 Monte-Carlo-Simulationen",
        updated: `Aktualisiert ${updated} UTC`,
        hook: "Hat dein Team noch eine Chance?",
        sub: "WM-2026-Szenario-Rechner · kostenlos · ohne Anmeldung",
      },
      fr: {
        advance: "Chance de qualification",
        champion: "Titre",
        group: (x: string, r: number) => `Groupe ${x} · actuellement ${r}e`,
        sims: "10 000 simulations Monte-Carlo",
        updated: `Mis à jour ${updated} UTC`,
        hook: "Ton équipe a-t-elle encore une chance ?",
        sub: "Calculateur de scénarios du Mondial 2026 · gratuit · sans inscription",
      },
    } as Record<Locale, { advance: string; champion: string; group: (x: string, r: number) => string; sims: string; updated: string; hook: string; sub: string }>
  )[locale];

  const base: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    backgroundColor: "#0A0E13",
    color: "#E8EDF2",
    padding: 84,
    fontFamily: fonts.length ? "NotoSansSC" : "sans-serif",
  };

  if (!hit) {
    // 品牌兜底卡（无 team 参数或未匹配）—— 3:4 竖版
    return new ImageResponse(
      (
        <div style={base}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#1BE27F" }}>⚽ wc2026.cool</div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, gap: 28 }}>
            <div style={{ display: "flex", fontSize: 88, fontWeight: 700, color: "#E8EDF2", lineHeight: 1.15 }}>{L.hook}</div>
            <div style={{ display: "flex", fontSize: 42, color: "#8A97A6", lineHeight: 1.3 }}>{L.sub}</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 26, color: "#5a6472" }}>{L.sims}</div>
            {qr ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} width={150} height={150} style={{ borderRadius: 10 }} />
                <div style={{ display: "flex", fontSize: 22, color: "#8A97A6" }}>{scanLabel}</div>
              </div>
            ) : null}
          </div>
        </div>
      ),
      { width: 1080, height: 1440, fonts: fonts.length ? fonts : undefined }
    );
  }

  const t = hit.team;
  const name = locale === "zh" ? t.zh : teamName(t.name, locale);
  const adv = pct(t.pAdvance);
  const champ = pct(t.pChampion);
  const advColor = (t.pAdvance > 1 ? t.pAdvance : t.pAdvance * 100) >= 50 ? "#1BE27F" : "#FFB02E";

  return new ImageResponse(
    (
      <div style={base}>
        {/* 顶部：队旗 + 队名/组别/主队标 ｜ 品牌（长队名换行不挤压品牌） */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28, flex: 1, minWidth: 0 }}>
            {t.flag ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.flag.replace("/w80/", "/w160/")} width={150} height={100} style={{ borderRadius: 10, objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", fontSize: 96 }}>⚽</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: "#E8EDF2", lineHeight: 1.05 }}>{name}</div>
              <div style={{ display: "flex", fontSize: 30, color: "#8A97A6" }}>
                {L.group(hit.letter, hit.rank)}
              </div>
              {tag ? (
                <div style={{ display: "flex", fontSize: 28, color: "#1BE27F", marginTop: 4 }}>⭐ {tag}</div>
              ) : null}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#1BE27F", flexShrink: 0 }}>wc2026.cool</div>
        </div>

        {/* 中部：出线概率大数字 + 夺冠 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, gap: 4 }}>
          <div style={{ display: "flex", fontSize: 42, color: "#8A97A6" }}>{L.advance}</div>
          <div style={{ display: "flex", fontSize: 250, fontWeight: 700, lineHeight: 1, color: advColor }}>{adv}%</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 28 }}>
            <div style={{ display: "flex", fontSize: 34, color: "#8A97A6" }}>{L.champion}</div>
            <div style={{ display: "flex", fontSize: 66, fontWeight: 700, color: "#E8EDF2" }}>{champ}%</div>
          </div>
        </div>

        {/* 底部：模拟次数/更新时间 ｜ 二维码 */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 26, color: "#5a6472" }}>
            <div style={{ display: "flex" }}>{L.sims}</div>
            <div style={{ display: "flex" }}>{L.updated}</div>
          </div>
          {qr ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} width={150} height={150} style={{ borderRadius: 10 }} />
              <div style={{ display: "flex", fontSize: 22, color: "#8A97A6" }}>{scanLabel}</div>
            </div>
          ) : null}
        </div>
      </div>
    ),
    { width: 1080, height: 1440, fonts: fonts.length ? fonts : undefined }
  );
}
