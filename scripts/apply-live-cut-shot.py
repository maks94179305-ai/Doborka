#!/usr/bin/env python3
"""Capture live BarScheme DOM for messenger cutting screenshots."""
from pathlib import Path
import json

pkg = Path("package.json")
data = json.loads(pkg.read_text())
deps = data.setdefault("dependencies", {})
if "html-to-image" not in deps:
    deps["html-to-image"] = "^1.11.11"
    pkg.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print("package.json html-to-image ok")
else:
    print("html-to-image already")

p = Path("src/lib/share-image.ts")
s = p.read_text()
if "export async function captureElementToFile" not in s:
    insert = '''
/** Screenshot a live DOM node (same pixels as on screen). */
export async function captureElementToFile(el: HTMLElement, name = "doborka-cut.png"): Promise<File | null> {
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
}

'''
    idx = s.find("export async function renderCuttingPlanShot")
    if idx < 0:
        raise SystemExit("renderCuttingPlanShot missing")
    s = s[:idx] + insert + s[idx:]
    p.write_text(s)
    print("captureElementToFile ok")
else:
    print("capture already")

p = Path("src/components/plan-view.tsx")
s = p.read_text()
s = s.replace(
    'import { composeWindowShot, renderCuttingPlanShot } from "@/lib/share-image";',
    'import { captureElementToFile, composeWindowShot, renderCuttingPlanShot } from "@/lib/share-image";',
    1,
)
old_div = '''                {m.plan.bars.length > 0 ? (
                  <div className="grid min-w-0 gap-3">
                    <h2 className="font-display text-base">Раскрой · {m.title}</h2>'''
new_div = '''                {m.plan.bars.length > 0 ? (
                  <div className="grid min-w-0 gap-3" data-cut-capture={m.key}>
                    <h2 className="font-display text-base">Раскрой · {m.title}</h2>'''
if old_div in s:
    s = s.replace(old_div, new_div, 1)
    print("data-cut-capture ok")
elif "data-cut-capture=" in s:
    print("data-cut-capture already")
else:
    raise SystemExit("cutting div missing")

old_cut = '''          if (m.plan.bars.length > 0) {
            const cutBars = m.plan.bars.map((b) => {
              const global = plan.pieceToBar[b.cuts[0]?.pieceId] ?? b.index;
              return { ...b, index: global };
            });
            const cutFile = await renderCuttingPlanShot(m.title, cutBars, url);
            if (cutFile) sent.push({ file: cutFile, title: m.title, kind: "cutting", bars: cutBars, colorName: profileColorName(color) });
          }'''
new_cut = '''          if (m.plan.bars.length > 0) {
            const cutBars = m.plan.bars.map((b) => {
              const global = plan.pieceToBar[b.cuts[0]?.pieceId] ?? b.index;
              return { ...b, index: global };
            });
            let cutFile: File | null = null;
            const cutEl = document.querySelector(`[data-cut-capture="${CSS.escape(m.key)}"]`) as HTMLElement | null;
            if (cutEl) {
              cutEl.scrollIntoView({ block: "nearest", behavior: "instant" as ScrollBehavior });
              await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
              cutFile = await captureElementToFile(cutEl, `doborka-raskroy-${Date.now()}.png`);
            }
            if (!cutFile) cutFile = await renderCuttingPlanShot(m.title, cutBars, url);
            if (cutFile) sent.push({ file: cutFile, title: m.title, kind: "cutting", bars: cutBars, colorName: profileColorName(color) });
          }'''
if old_cut in s:
    s = s.replace(old_cut, new_cut, 1)
    print("DOM capture in prepareShare ok")
elif "captureElementToFile" in s:
    print("prepareShare capture already")
else:
    raise SystemExit("cutFile block missing")

if 'item.kind === "scheme" || item.kind === "cutting"' not in s:
    s = s.replace(
        'if (item.kind === "scheme") {\n          files.push(named);\n          shareOnly.push(named);\n        }',
        'if (item.kind === "scheme" || item.kind === "cutting") {\n          files.push(named);\n          shareOnly.push(named);\n        }',
        1,
    )
    print("share filter cutting ok")

p.write_text(s)
print("ALL DONE")
