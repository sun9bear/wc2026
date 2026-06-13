// 剪贴板复制（客户端组件用）：clipboard API 优先，微信内置浏览器等场景 execCommand 降级。
// 从 CalculatorFocus 抽出共用（任务 3 emoji 战绩格 / 任务 5 擂台邀请文案）。
export function copyText(text: string): boolean {
  try {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 走降级 */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
