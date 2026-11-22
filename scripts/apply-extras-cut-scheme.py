#!/usr/bin/env python3
"""Extras palette birch stripes; cutting share includes scheme drawing; in-app style."""
from pathlib import Path

p = Path("src/components/extras-view.tsx")
s = p.read_text()
old_chip = """function PaletteChip({ hex }: { hex: string }) {
  const texture = profileTexture(hex);
  const gloss = profileFinish(hex) === "gloss";
  const matte = profileFinish(hex) === "matte";
  return <span className="inline-block h-9 w-10 rounded-md border border-border" style={{ background: texture ? `url(${texture}) center/cover` : hex, boxShadow: `3px 4px 0 ${profileChipSide(hex)}`, filter: gloss ? "saturate(1.1)" : matte ? "contrast(0.92)" : undefined }} />;
}"""
new_chip = """function PaletteChip({ hex }: { hex: string }) {
  const texture = profileTexture(hex);
  const gloss = profileFinish(hex) === "gloss";
  const matte = profileFinish(hex) === "matte";
  const birch = profileId(hex) === "white-birch";
  return (
    <span className="relative inline-block h-9 w-10 overflow-hidden rounded-md border border-border" style={{ background: birch ? "#f4f2ec" : texture ? `url(${texture}) center/cover` : hex, boxShadow: `3px 4px 0 ${profileChipSide(hex)}`, filter: gloss && !birch ? "saturate(1.1)" : matte && !birch ? "contrast(0.92)" : undefined }} aria-hidden>
      {birch ? (
        <svg viewBox="0 0 32 32" className="absolute inset-0 size-full">
          <rect width="32" height="32" fill="#f4f2ec" />
          <path d="M0 14 Q16 2 32 16 L32 21 Q16 7 0 19 Z" fill="#a3a3a3" opacity="0.5" />
          <path d="M0 22 Q16 10 32 24 L32 29 Q16 15 0 27 Z" fill="#8e8e8e" opacity="0.55" />
          <path d="M2 16 Q16 5 30 17" fill="none" stroke="#6e6e6e" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
          <path d="M2 24 Q16 13 30 25" fill="none" stroke="#6e6e6e" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
        </svg>
      ) : null}
    </span>
  );
}"""
if old_chip not in s:
    if 'profileId(hex) === "white-birch"' in s and "PaletteChip" in s:
        print("PaletteChip already")
    else:
        raise SystemExit("PaletteChip missing")
else:
    s = s.replace(old_chip, new_chip, 1)
    p.write_text(s)
    print("extras PaletteChip ok")

p = Path("src/lib/share-image.ts")
s = p.read_text()
old_sig = "export async function renderCuttingPlanShot(title: string, bars: StockBar[]): Promise<File | null> {"
new_sig = "export async function renderCuttingPlanShot(title: string, bars: StockBar[], schemeUrl?: string | null): Promise<File | null> {"
if old_sig in s:
    s = s.replace(old_sig, new_sig, 1)
elif "schemeUrl" in s:
    print("sig already")
else:
    raise SystemExit("renderCuttingPlanShot sig missing")

marker = """  let H = outerPad + 72;
  for (const bar of bars) {
    const listH = Math.max(1, bar.cuts.length) * 28;
    H += cardPad * 2 + 28 + 12 + barH + 16 + listH + gap;
  }
  H = Math.min(Math.max(H + outerPad, 400), 14000);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "top";
  ctx.fillStyle = INK2;
  ctx.font = "600 34px Unbounded, Manrope, system-ui, sans-serif";
  ctx.fillText("Раскрой", outerPad, outerPad);
  ctx.fillStyle = MUTED2;
  ctx.font = "600 22px Manrope, system-ui, sans-serif";
  ctx.fillText(title, outerPad, outerPad + 40);

  let y = outerPad + 72;
"""
if marker not in s:
    if "schemeImg" in s:
        print("scheme block already")
    else:
        raise SystemExit("cutting height/header marker missing")
else:
    replacement = """  let schemeImg: HTMLImageElement | null = null;
  if (schemeUrl) {
    try { schemeImg = await loadImage(schemeUrl); } catch { schemeImg = null; }
  }
  const schemeBoxH = schemeImg ? Math.min(420, Math.round((W - outerPad * 2) * (schemeImg.naturalHeight / Math.max(1, schemeImg.naturalWidth)))) : 0;

  let H = outerPad + 72 + (schemeImg ? 36 + schemeBoxH + 24 : 0);
  for (const bar of bars) {
    const listH = Math.max(1, bar.cuts.length) * 28;
    H += cardPad * 2 + 28 + 12 + barH + 16 + listH + gap;
  }
  H = Math.min(Math.max(H + outerPad, 400), 16000);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "top";
  ctx.fillStyle = INK2;
  ctx.font = "600 34px Unbounded, Manrope, system-ui, sans-serif";
  ctx.fillText("Раскрой", outerPad, outerPad);
  ctx.fillStyle = MUTED2;
  ctx.font = "600 22px Manrope, system-ui, sans-serif";
  ctx.fillText(title, outerPad, outerPad + 40);

  let y = outerPad + 72;
  if (schemeImg) {
    const cardX = outerPad;
    const cardW = W - outerPad * 2;
    const imgH = schemeBoxH;
    const cardH = 16 + 22 + 12 + imgH + 16;
    ctx.fillStyle = CARD_BG;
    roundRect(ctx, cardX, y, cardW, cardH, 16);
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    roundRect(ctx, cardX, y, cardW, cardH, 16);
    ctx.stroke();
    ctx.fillStyle = INK2;
    ctx.font = "600 18px Manrope, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Схема · чертёж", cardX + cardPad, y + 16);
    const ix = cardX + cardPad;
    const iy = y + 16 + 22 + 8;
    const maxW = cardW - cardPad * 2;
    const scale = Math.min(maxW / schemeImg.naturalWidth, imgH / schemeImg.naturalHeight);
    const dw = schemeImg.naturalWidth * scale;
    const dh = schemeImg.naturalHeight * scale;
    const dx = ix + (maxW - dw) / 2;
    const dy = iy + (imgH - dh) / 2;
    ctx.fillStyle = INNER;
    roundRect(ctx, ix, iy, maxW, imgH, 10);
    ctx.fill();
    ctx.drawImage(schemeImg, dx, dy, dw, dh);
    y += cardH + gap;
  }
"""
    s = s.replace(marker, replacement, 1)
    print("cutting+scheme render ok")
p.write_text(s)

p = Path("src/components/plan-view.tsx")
s = p.read_text()
if "renderCuttingPlanShot(m.title, cutBars, url)" not in s:
    s = s.replace("const cutFile = await renderCuttingPlanShot(m.title, cutBars);", "const cutFile = await renderCuttingPlanShot(m.title, cutBars, url);", 1)
    print("plan url arg ok")
else:
    print("plan url already")
if 'item.kind === "scheme" || item.kind === "cutting"' not in s:
    s = s.replace(
        'if (item.kind === "scheme") {\n          files.push(named);\n          shareOnly.push(named);\n        }',
        'if (item.kind === "scheme" || item.kind === "cutting") {\n          files.push(named);\n          shareOnly.push(named);\n        }',
        1,
    )
    print("share filter ok")
else:
    print("share already")
p.write_text(s)
print("ALL DONE")
