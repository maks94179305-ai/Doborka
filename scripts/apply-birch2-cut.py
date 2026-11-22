#!/usr/bin/env python3
"""Second birch stripe; cutting PNG matches in-app BarScheme cards."""
from pathlib import Path

p = Path("src/components/plan-view.tsx")
s = p.read_text()
old_birch = """        {profileId(hex) === "white-birch" ? (
          <>
            <path d="M0 20 Q16 8 32 22 L32 28 Q16 14 0 26 Z" fill="#9b9b9b" opacity="0.55" />
            <path d="M2 22 Q16 11 30 23" fill="none" stroke="#7a7a7a" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
          </>
        ) : null}"""
new_birch = """        {profileId(hex) === "white-birch" ? (
          <>
            <path d="M0 14 Q16 2 32 16 L32 21 Q16 7 0 19 Z" fill="#a3a3a3" opacity="0.5" />
            <path d="M0 22 Q16 10 32 24 L32 29 Q16 15 0 27 Z" fill="#8e8e8e" opacity="0.55" />
            <path d="M2 16 Q16 5 30 17" fill="none" stroke="#6e6e6e" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
            <path d="M2 24 Q16 13 30 25" fill="none" stroke="#6e6e6e" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
          </>
        ) : null}"""
if old_birch in s:
    s = s.replace(old_birch, new_birch, 1)
    print("ColorChip double stripe ok")
elif "M0 14 Q16 2 32 16" in s:
    print("ColorChip double already")
else:
    raise SystemExit("ColorChip birch block missing")
p.write_text(s)

p = Path("src/lib/share-image.ts")
s = p.read_text()
old_si = """  if (profileId(hex) === "white-birch") {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.62);
    ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.25, x + size, y + size * 0.68);
    ctx.lineTo(x + size, y + size * 0.88);
    ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.45, x, y + size * 0.82);
    ctx.closePath();
    ctx.fillStyle = "rgba(155,155,155,0.55)";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.06, y + size * 0.68);
    ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.35, x + size * 0.94, y + size * 0.72);
    ctx.strokeStyle = "rgba(122,122,122,0.75)";
    ctx.lineWidth = Math.max(1, size * 0.04);
    ctx.lineCap = "round";
    ctx.stroke();
  }"""
new_si = """  if (profileId(hex) === "white-birch") {
    const bands = [
      { y0: 0.42, y1: 0.58, fill: "rgba(163,163,163,0.5)" },
      { y0: 0.66, y1: 0.88, fill: "rgba(142,142,142,0.55)" },
    ];
    for (const b of bands) {
      ctx.beginPath();
      ctx.moveTo(x, y + size * b.y0);
      ctx.quadraticCurveTo(x + size * 0.5, y + size * (b.y0 - 0.28), x + size, y + size * (b.y0 + 0.06));
      ctx.lineTo(x + size, y + size * b.y1);
      ctx.quadraticCurveTo(x + size * 0.5, y + size * (b.y1 - 0.32), x, y + size * (b.y1 - 0.06));
      ctx.closePath();
      ctx.fillStyle = b.fill;
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(110,110,110,0.7)";
    ctx.lineWidth = Math.max(1, size * 0.03);
    ctx.lineCap = "round";
    for (const cy of [0.48, 0.74]) {
      ctx.beginPath();
      ctx.moveTo(x + size * 0.06, y + size * cy);
      ctx.quadraticCurveTo(x + size * 0.5, y + size * (cy - 0.28), x + size * 0.94, y + size * (cy + 0.04));
      ctx.stroke();
    }
  }"""
if old_si in s:
    s = s.replace(old_si, new_si, 1)
    print("share-image birch double ok")
elif "const bands =" in s:
    print("share-image birch already")
else:
    raise SystemExit("share-image birch block missing")

start = s.find("export async function renderCuttingPlanShot")
end = s.find("\nexport async function shareOrSave", start)
if start < 0 or end < 0:
    raise SystemExit("cutting fn bounds missing")
new_fn = r'''export async function renderCuttingPlanShot(title: string, bars: StockBar[]): Promise<File | null> {
  if (!bars.length) return null;
  const W = 1080;
  const outerPad = 28;
  const cardPad = 28;
  const barH = 48;
  const gap = 20;
  const BG = "#121614";
  const CARD_BG = "#1a1f1c";
  const BORDER = "rgba(241,238,230,0.12)";
  const INK2 = "#f1eee6";
  const MUTED2 = "#9aa59d";
  const STEEL2 = "#9bb0a6";
  const WASTE = "#c4a574";
  const INNER = "rgba(18,22,20,0.7)";

  let H = outerPad + 72;
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
  const cardX = outerPad;
  const cardW = W - outerPad * 2;

  for (const bar of bars) {
    const listH = Math.max(1, bar.cuts.length) * 28;
    const cardH = cardPad * 2 + 28 + 12 + barH + 16 + listH;
    if (y + cardH > H - 8) break;

    ctx.fillStyle = CARD_BG;
    roundRect(ctx, cardX, y, cardW, cardH, 16);
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    roundRect(ctx, cardX, y, cardW, cardH, 16);
    ctx.stroke();

    const ix = cardX + cardPad;
    const iw = cardW - cardPad * 2;
    let cy = y + cardPad;

    ctx.textAlign = "left";
    ctx.fillStyle = INK2;
    ctx.font = "600 22px Unbounded, Manrope, system-ui, sans-serif";
    const stockLabel = `Хлыст ${mm(bar.stockLength)}`;
    ctx.fillText(stockLabel, ix, cy);
    const sw = ctx.measureText(stockLabel).width;
    ctx.fillStyle = MUTED2;
    ctx.font = "500 20px Manrope, system-ui, sans-serif";
    ctx.fillText(`№${bar.index}`, ix + sw + 14, cy + 1);
    ctx.textAlign = "right";
    ctx.fillStyle = bar.usableRemainder ? STEEL2 : WASTE;
    ctx.font = "500 18px Manrope, system-ui, sans-serif";
    ctx.fillText(bar.usableRemainder ? `остаток ${mm(bar.leftover)}` : `отход ${mm(bar.leftover)}`, ix + iw, cy + 2);
    ctx.textAlign = "left";
    cy += 40;

    ctx.fillStyle = INNER;
    roundRect(ctx, ix, cy, iw, barH, 10);
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    roundRect(ctx, ix, cy, iw, barH, 10);
    ctx.stroke();

    let x = ix;
    const stock = Math.max(1, bar.stockLength);
    for (const c of bar.cuts) {
      const w = Math.max(1, (c.length / stock) * iw);
      ctx.fillStyle = c.color || STEEL2;
      ctx.fillRect(x, cy, w, barH);
      ctx.fillStyle = "rgba(18,22,20,0.35)";
      ctx.fillRect(x + w - 1, cy, 1, barH);
      if (w > iw * 0.12) {
        ctx.fillStyle = "#f1eee6";
        ctx.font = "600 13px Manrope, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(c.label || "").slice(0, 16), x + w / 2, cy + barH / 2 - 7);
        ctx.textAlign = "left";
      }
      x += w;
    }
    if (bar.leftover > 0) {
      const w = (bar.leftover / stock) * iw;
      ctx.fillStyle = bar.usableRemainder ? "rgba(155,176,166,0.14)" : "rgba(196,165,116,0.16)";
      ctx.fillRect(x, cy, Math.max(1, w), barH);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, cy, Math.max(1, w), barH);
      ctx.clip();
      ctx.strokeStyle = bar.usableRemainder ? "rgba(155,176,166,0.35)" : "rgba(196,165,116,0.4)";
      ctx.lineWidth = 1;
      for (let hx = x - barH; hx < x + w + barH; hx += 8) {
        ctx.beginPath();
        ctx.moveTo(hx, cy + barH);
        ctx.lineTo(hx + barH, cy);
        ctx.stroke();
      }
      ctx.restore();
    }
    cy += barH + 16;

    for (const c of bar.cuts) {
      ctx.fillStyle = c.color || STEEL2;
      ctx.beginPath();
      ctx.arc(ix + 6, cy + 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INK2;
      ctx.font = "500 18px Manrope, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(String(c.label || ""), ix + 20, cy);
      ctx.fillStyle = MUTED2;
      ctx.textAlign = "right";
      ctx.fillText(mm(c.length), ix + iw, cy);
      ctx.textAlign = "left";
      cy += 28;
    }

    y += cardH + gap;
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png");
  });
  return new File([blob], `doborka-raskroy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.png`, { type: "image/png" });
}

'''
s = s[:start] + new_fn + s[end:]
p.write_text(s)
print("renderCuttingPlanShot ok")
print("ALL DONE")
