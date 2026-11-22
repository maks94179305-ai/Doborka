#!/usr/bin/env python3
"""Optimize cutting screenshots for phone readability."""
from pathlib import Path

p = Path("src/lib/share-image.ts")
s = p.read_text()

old_cap = '''export async function captureElementToFile(el: HTMLElement, name = "doborka-cut.png"): Promise<File | null> {
  try {
    const { toPng } = await import("html-to-image");
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--color-background").trim()
      || getComputedStyle(document.body).backgroundColor
      || "#121614";
    const dataUrl = await toPng(el, {
      cacheBust: true,
      pixelRatio: Math.min(3, (window.devicePixelRatio || 1) * 2),
      backgroundColor: bg.startsWith("#") || bg.startsWith("rgb") ? bg : "#121614",
      style: { transform: "none" },
    });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    if (!blob.size) return null;
    return new File([blob], name, { type: "image/png" });
  } catch {
    return null;
  }
}'''

new_cap = '''export async function captureElementToFile(el: HTMLElement, name = "doborka-cut.png"): Promise<File | null> {
  const host = document.createElement("div");
  try {
    const { toPng } = await import("html-to-image");
    const bgRaw = getComputedStyle(document.documentElement).getPropertyValue("--color-background").trim()
      || getComputedStyle(document.body).backgroundColor
      || "#121614";
    const bg = bgRaw.startsWith("#") || bgRaw.startsWith("rgb") ? bgRaw : "#121614";

    const stageW = 720;
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = `position:fixed;left:-12000px;top:0;width:${stageW}px;z-index:-1;pointer-events:none;background:${bg};padding:20px;box-sizing:border-box;`;

    const style = document.createElement("style");
    style.textContent = `
      [data-cut-share-root] {
        width: 100% !important;
        max-width: 100% !important;
        font-size: 18px !important;
        line-height: 1.4 !important;
        color: inherit;
      }
      [data-cut-share-root] h2 {
        font-size: 24px !important;
        font-weight: 600 !important;
        margin: 0 0 14px !important;
        line-height: 1.25 !important;
      }
      [data-cut-share-root] article,
      [data-cut-share-root] .panel {
        padding: 22px !important;
        border-radius: 18px !important;
      }
      [data-cut-share-root] h3 {
        font-size: 20px !important;
        font-weight: 600 !important;
        line-height: 1.3 !important;
      }
      [data-cut-share-root] header p,
      [data-cut-share-root] header .text-xs {
        font-size: 16px !important;
      }
      [data-cut-share-root] .h-12 {
        height: 64px !important;
      }
      [data-cut-share-root] .h-12 span {
        font-size: 15px !important;
        padding-left: 6px !important;
        padding-right: 6px !important;
      }
      [data-cut-share-root] ul.mt-3 {
        margin-top: 16px !important;
      }
      [data-cut-share-root] li,
      [data-cut-share-root] .text-sm {
        font-size: 17px !important;
        line-height: 1.35 !important;
      }
      [data-cut-share-root] .gap-3 {
        gap: 18px !important;
      }
      [data-cut-share-root] .mb-3 {
        margin-bottom: 14px !important;
      }
    `;

    const clone = el.cloneNode(true) as HTMLElement;
    clone.setAttribute("data-cut-share-root", "1");
    clone.style.width = "100%";
    clone.style.maxWidth = "100%";
    clone.style.boxSizing = "border-box";

    host.appendChild(style);
    host.appendChild(clone);
    document.body.appendChild(host);

    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

    const dataUrl = await toPng(clone, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: bg,
      width: stageW - 40,
      style: {
        width: `${stageW - 40}px`,
        maxWidth: `${stageW - 40}px`,
        transform: "none",
      },
    });

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    if (!blob.size) return null;
    return new File([blob], name, { type: "image/png" });
  } catch {
    return null;
  } finally {
    host.remove();
  }
}'''

if old_cap not in s:
    if "data-cut-share-root" in s:
        print("capture already optimized")
    else:
        raise SystemExit("captureElementToFile block missing")
else:
    s = s.replace(old_cap, new_cap, 1)
    print("capture mobile ok")

s = s.replace("  const outerPad = 28;\n  const cardPad = 28;\n  const barH = 48;\n  const gap = 20;",
              "  const outerPad = 32;\n  const cardPad = 32;\n  const barH = 72;\n  const gap = 24;", 1)
s = s.replace('ctx.font = "600 34px Unbounded, Manrope, system-ui, sans-serif";\n  ctx.fillText("Раскрой", outerPad, outerPad);\n  ctx.fillStyle = MUTED2;\n  ctx.font = "600 22px Manrope, system-ui, sans-serif";',
              'ctx.font = "600 40px Unbounded, Manrope, system-ui, sans-serif";\n  ctx.fillText("Раскрой", outerPad, outerPad);\n  ctx.fillStyle = MUTED2;\n  ctx.font = "600 26px Manrope, system-ui, sans-serif";', 1)
s = s.replace('ctx.font = "600 22px Unbounded, Manrope, system-ui, sans-serif";\n    const stockLabel',
              'ctx.font = "600 28px Unbounded, Manrope, system-ui, sans-serif";\n    const stockLabel', 1)
s = s.replace('ctx.font = "500 20px Manrope, system-ui, sans-serif";\n    ctx.fillText(`№${bar.index}`',
              'ctx.font = "500 24px Manrope, system-ui, sans-serif";\n    ctx.fillText(`№${bar.index}`', 1)
s = s.replace('ctx.font = "500 18px Manrope, system-ui, sans-serif";\n    ctx.fillText(bar.usableRemainder',
              'ctx.font = "500 22px Manrope, system-ui, sans-serif";\n    ctx.fillText(bar.usableRemainder', 1)
s = s.replace('ctx.font = "600 13px Manrope, system-ui, sans-serif";',
              'ctx.font = "600 18px Manrope, system-ui, sans-serif";', 1)
s = s.replace('ctx.font = "500 18px Manrope, system-ui, sans-serif";\n      ctx.textAlign = "left";\n      ctx.fillText(String(c.label || ""), ix + 20, cy);',
              'ctx.font = "500 22px Manrope, system-ui, sans-serif";\n      ctx.textAlign = "left";\n      ctx.fillText(String(c.label || ""), ix + 24, cy);', 1)
s = s.replace("ctx.arc(ix + 6, cy + 8, 5, 0, Math.PI * 2);",
              "ctx.arc(ix + 8, cy + 10, 7, 0, Math.PI * 2);", 1)
s = s.replace("cy += 28;", "cy += 34;", 1)
s = s.replace("const listH = Math.max(1, bar.cuts.length) * 28;",
              "const listH = Math.max(1, bar.cuts.length) * 34;", 2)

p.write_text(s)
print("fallback sizes ok")
print("ALL DONE")
