import { mm } from "@/lib/format";
import { profileChipSide, profileFinish, profileId, profileTexture } from "@/lib/types";

export type ShareCardMeta = {
  heading?: string;
  title: string;
  color: string;
  colorName: string;
  bars: { length: number; count: number }[];
  totalBars: number;
  note?: string;
};

const CARD = "#1b211e";
const INK = "#f1eee6";
const MUTED = "#9aa59d";
const STEEL = "#9bb0a6";
const LINE = "rgba(241,238,230,0.12)";
const PANEL = "#161c19";

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function fileFromUrl(url: string, name: string): Promise<File> {
  const blob = await fetch(url).then((r) => r.blob());
  const type = blob.type || "image/png";
  const ext = type.includes("jpeg") || type.includes("jpg") ? "jpg" : "png";
  const filename = name.endsWith(".png") || name.endsWith(".jpg") ? name : `${name}.${ext}`;
  return new File([blob], filename, { type });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = url;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawColorChip(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, hex: string, texImg?: HTMLImageElement | null) {
  const gloss = profileFinish(hex) === "gloss";
  const matte = profileFinish(hex) === "matte";
  const r = Math.max(2, size * 0.14);
  ctx.save();
  ctx.fillStyle = profileChipSide(hex);
  roundRect(ctx, x + size * 0.1, y + size * 0.12, size, size, r);
  ctx.fill();
  roundRect(ctx, x, y, size, size, r);
  ctx.clip();
  if (texImg) ctx.drawImage(texImg, x, y, size, size);
  else { ctx.fillStyle = hex; ctx.fillRect(x, y, size, size); }
  if (matte) {
    ctx.fillStyle = texImg ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.18)";
    ctx.fillRect(x, y, size, size);
  }
  if (gloss) {
    const graphite = profileId(hex) === "graphite-gloss";
    if (graphite) {
      const env = ctx.createLinearGradient(x + size * 0.18, y, x + size * 0.08, y + size);
      env.addColorStop(0, "rgba(215,227,240,0.3)");
      env.addColorStop(0.22, "rgba(255,255,255,0.08)");
      env.addColorStop(0.48, "rgba(255,255,255,0)");
      env.addColorStop(1, "rgba(5,6,8,0.34)");
      ctx.globalCompositeOperation = "soft-light";
      ctx.fillStyle = env;
      ctx.fillRect(x, y, size, size);
      const spec = ctx.createRadialGradient(x + size * 0.24, y + size * 0.08, size * 0.02, x + size * 0.24, y + size * 0.08, size * 0.7);
      spec.addColorStop(0, "rgba(255,255,255,0.48)");
      spec.addColorStop(0.14, "rgba(238,244,255,0.18)");
      spec.addColorStop(0.38, "rgba(255,255,255,0.04)");
      spec.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = spec;
      ctx.fillRect(x, y, size, size);
      const strip = ctx.createLinearGradient(x + size * 0.05, y, x + size * 0.95, y + size * 0.62);
      strip.addColorStop(0.28, "rgba(255,255,255,0)");
      strip.addColorStop(0.44, "rgba(255,255,255,0.06)");
      strip.addColorStop(0.5, "rgba(255,255,255,0.28)");
      strip.addColorStop(0.56, "rgba(255,255,255,0.06)");
      strip.addColorStop(0.7, "rgba(255,255,255,0)");
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = strip;
      ctx.fillRect(x, y, size, size);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    } else {
      const g = ctx.createLinearGradient(x, y, x + size, y + size);
      g.addColorStop(0, "rgba(255,255,255,0.42)");
      g.addColorStop(0.22, "rgba(255,255,255,0)");
      g.addColorStop(0.48, "rgba(255,255,255,0.14)");
      g.addColorStop(1, "rgba(0,0,0,0.1)");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, size, size);
    }
  }
  ctx.restore();
}

async function loadTexture(hex: string): Promise<HTMLImageElement | null> {
  const src = profileTexture(hex);
  if (!src) return null;
  try { return await loadImage(src); } catch { return null; }
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, limit = 8): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  const push = (value: string) => { if (lines.length < limit) lines.push(value); };
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) { line = test; continue; }
    if (line) push(line);
    if (ctx.measureText(word).width <= maxWidth) { line = word; continue; }
    let chunk = "";
    for (const ch of word) {
      const next = chunk + ch;
      if (ctx.measureText(next).width > maxWidth && chunk) { push(chunk); chunk = ch; } else chunk = next;
    }
    line = chunk;
  }
  if (line) push(line);
  return lines;
}

export async function composeWindowShot(imageUrl: string, meta?: ShareCardMeta): Promise<File> {
  const img = await loadImage(imageUrl);
  if (!meta) return fileFromUrl(imageUrl, "doborka-foto.png");
  const W = 1280;
  const pad = 36;
  const gap = 28;
  const panelW = 360;
  const titleH = 84;
  const innerW = W - pad * 2;
  const imageBoxW = innerW - gap - panelW;
  const imgRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
  let imageBoxH = Math.round(imageBoxW / imgRatio);
  imageBoxH = Math.min(720, Math.max(480, imageBoxH));
  const measure = document.createElement("canvas").getContext("2d");
  const note = (meta.note ?? "").trim();
  const panelInner = panelW - 44;
  let noteLines: string[] = [];
  if (measure && note) {
    measure.font = "500 22px Manrope, system-ui, sans-serif";
    noteLines = wrapLines(measure, note, panelInner);
  }
  const nameLines = meta.title.trim().split(/\s+/).filter(Boolean);
  const barsBlock = meta.bars.length === 0 ? 36 : meta.bars.length * 40;
  const noteBlock = noteLines.length ? 28 + noteLines.length * 28 + 8 : 0;
  const contentH = 20 + nameLines.length * 32 + 16 + 44 + 24 + 18 + 36 + barsBlock + noteBlock + 96;
  imageBoxH = Math.max(imageBoxH, contentH);
  const H = pad + titleH + imageBoxH + pad;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return fileFromUrl(imageUrl, "doborka-shema.png");
  ctx.fillStyle = CARD;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = INK;
  ctx.font = "600 42px Unbounded, Manrope, system-ui, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(meta.heading ?? "Схема", pad, pad + 8);
  const sentAt = new Date();
  const dateLine = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(sentAt);
  const timeLine = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(sentAt);
  ctx.fillStyle = MUTED;
  ctx.font = "600 22px Manrope, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(dateLine, W - pad, pad + 6);
  ctx.fillStyle = INK;
  ctx.font = "700 26px Manrope, system-ui, sans-serif";
  ctx.fillText(timeLine, W - pad, pad + 34);
  ctx.textAlign = "left";
  const ix = pad;
  const iy = pad + titleH;
  const scale = Math.min(imageBoxW / img.naturalWidth, imageBoxH / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, ix + (imageBoxW - dw) / 2, iy + (imageBoxH - dh) / 2, dw, dh);
  const px = pad + imageBoxW + gap;
  const py = iy;
  roundRect(ctx, px, py, panelW, imageBoxH, 16);
  ctx.fillStyle = PANEL;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.stroke();
  const inset = px + 22;
  ctx.fillStyle = INK;
  ctx.font = "600 26px Manrope, system-ui, sans-serif";
  let y = py + 20;
  for (const line of nameLines) { ctx.fillText(line, inset, y); y += 32; }
  y += 16;
  const chip = 44;
  const texImg = await loadTexture(meta.color);
  drawColorChip(ctx, inset, y, chip, meta.color, texImg);
  const colorX = inset + chip + 16;
  ctx.fillStyle = INK;
  ctx.font = "600 22px Manrope, system-ui, sans-serif";
  ctx.fillText("Цвет", colorX, y);
  ctx.font = "700 24px Manrope, system-ui, sans-serif";
  ctx.fillText(meta.colorName, colorX, y + 28);
  y += chip + 24;
  ctx.fillStyle = STEEL;
  ctx.font = "700 18px Manrope, system-ui, sans-serif";
  ctx.fillText("ХЛЫСТЫ", inset, y);
  y += 36;
  if (meta.bars.length === 0) {
    ctx.fillStyle = MUTED;
    ctx.font = "500 22px Manrope, system-ui, sans-serif";
    ctx.fillText("Нет хлыстов в заказе.", inset, y);
  } else {
    for (const b of meta.bars) {
      drawColorChip(ctx, inset, y + 4, 16, meta.color, texImg);
      ctx.fillStyle = INK;
      ctx.font = "600 24px Manrope, ui-sans-serif, sans-serif";
      ctx.fillText(mm(b.length), inset + 28, y);
      ctx.fillStyle = INK;
      ctx.font = "700 32px Manrope, ui-sans-serif, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`× ${b.count}`, px + panelW - 22, y);
      ctx.textAlign = "left";
      y += 44;
    }
  }
  if (noteLines.length) {
    y += 8;
    ctx.fillStyle = STEEL;
    ctx.font = "700 18px Manrope, system-ui, sans-serif";
    ctx.fillText("КОММЕНТАРИЙ", inset, y);
    y += 28;
    ctx.fillStyle = INK;
    ctx.font = "500 22px Manrope, system-ui, sans-serif";
    for (const line of noteLines) { ctx.fillText(line, inset, y); y += 28; }
  }
  ctx.fillStyle = MUTED;
  ctx.font = "600 20px Manrope, system-ui, sans-serif";
  ctx.fillText(`${dateLine}, ${timeLine}`, inset, py + imageBoxH - 74);
  ctx.fillStyle = INK;
  ctx.font = "700 28px Manrope, system-ui, sans-serif";
  ctx.fillText(`Всего ${meta.totalBars} хлыст.`, inset, py + imageBoxH - 42);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png");
  });
  return new File([blob], `doborka-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.png`, { type: "image/png" });
}

export async function shareOrSave(file: File, title: string, text?: string): Promise<"shared" | "saved" | "cancelled"> {
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title, text });
      return "shared";
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return "cancelled";
  }
  downloadFile(file);
  return "saved";
}
