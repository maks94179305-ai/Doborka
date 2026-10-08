import type { DashStyle, DrawObject, Drawing } from "./types";

export type Pt = { x: number; y: number };
const DASH: Record<DashStyle, number[]> = { solid: [], dash: [12, 8], dot: [2, 6] };
export function dist(a: Pt, b: Pt) { return Math.hypot(a.x - b.x, a.y - b.y); }
export type DimGeom = { len: number; nx: number; ny: number; ax: number; ay: number; bx: number; by: number; mx: number; my: number };
export function dimGeom(obj: Extract<DrawObject, { type: "dim" }>): DimGeom {
  const dx = obj.x2 - obj.x1; const dy = obj.y2 - obj.y1; const len = Math.hypot(dx, dy);
  const nx = len ? -dy / len : 0; const ny = len ? dx / len : 1; const o = obj.offset;
  const ax = obj.x1 + nx * o; const ay = obj.y1 + ny * o; const bx = obj.x2 + nx * o; const by = obj.y2 + ny * o;
  return { len, nx, ny, ax, ay, bx, by, mx: (ax + bx) / 2, my: (ay + by) / 2 };
}
export function dimText(obj: Extract<DrawObject, { type: "dim" }>): string {
  const raw = obj.label?.trim();
  if (raw) return raw.replace(/\s*мм\s*/gi, "").trim();
  return String(Math.round(dimGeom(obj).len));
}
export function dimInputValue(obj: Extract<DrawObject, { type: "dim" }>): string { return dimText(obj); }
export function dimAngle(obj: { x1: number; y1: number; x2: number; y2: number }): number {
  let ang = Math.atan2(obj.y2 - obj.y1, obj.x2 - obj.x1);
  if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
  return ang;
}
export const SHEET_BG = "#161c19";
export function sheetColor() {
  return document.documentElement.dataset.theme === "light" ? "#f4f1ea" : SHEET_BG;
}
export function strokeColor(color: string) {
  if (document.documentElement.dataset.theme !== "light") return color;
  return color.toLowerCase() === "#eceae4" || color.toLowerCase() === "#f3f1ec" ? "#1b211e" : color;
}
export function labelColor() {
  return document.documentElement.dataset.theme === "light" ? "#1b211e" : "#ffffff";
}
export const DIM_FONT = 26;
export const SCALE_MIN = 0.06;
export const SCALE_MAX = 16;
export const SCALE_DEFAULT = 4;
export function objectsBounds(objects: DrawObject[]) {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity, any = false;
  const add = (x: number, y: number) => { any = true; x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); };
  for (const o of objects) {
    if (o.type === "line" || o.type === "dim") { add(o.x1, o.y1); add(o.x2, o.y2); if (o.type === "dim") { const g = dimGeom(o); add(g.ax, g.ay); add(g.bx, g.by); const label = dimLabelWorld(o, 1); add(label.x, label.y); } }
    else if (o.type === "rect") { add(o.x, o.y); add(o.x + o.w, o.y + o.h); }
    else add(o.x, o.y);
  }
  return any ? { x1, y1, x2, y2 } : null;
}
export function fitView(objects: DrawObject[], width: number, height: number, pad = 72) {
  const b = objectsBounds(objects);
  if (!b || width < 40 || height < 40) return { x: 72, y: 72, scale: SCALE_DEFAULT };
  const bw = Math.max(b.x2 - b.x1, 24); const bh = Math.max(b.y2 - b.y1, 24);
  const scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.min((width - pad * 2) / bw, (height - pad * 2) / bh)));
  return { scale, x: width / 2 - ((b.x1 + b.x2) / 2) * scale, y: height / 2 - ((b.y1 + b.y2) / 2) * scale };
}
export function dimLabelWorld(obj: Extract<DrawObject, { type: "dim" }>, scale: number): Pt & { angle: number } {
  const g = dimGeom(obj); const s = 1 / Math.max(scale, 0.05);
  return { x: g.mx + g.nx * (20 * s), y: g.my + g.ny * (20 * s), angle: dimAngle(obj) };
}
export function parseMm(raw: string): number | null {
  const n = Number(raw.replace(/\s*мм\s*/gi, "").replace(",", ".").trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}
export function resizeFromStart<T extends { x1: number; y1: number; x2: number; y2: number }>(obj: T, length: number): T {
  const dx = obj.x2 - obj.x1; const dy = obj.y2 - obj.y1; const cur = Math.hypot(dx, dy) || 1; const k = length / cur;
  return { ...obj, x2: obj.x1 + dx * k, y2: obj.y1 + dy * k };
}
export function signedPerp(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x; const dy = b.y - a.y; const len = Math.hypot(dx, dy) || 1;
  return ((p.x - a.x) * -dy + (p.y - a.y) * dx) / len;
}
export function keepMinOffset(offset: number, min = 3): number { return Math.abs(offset) >= min ? offset : (offset < 0 ? -1 : 1) * min; }
export function quantizeOffset(offset: number, step = 0.25): number { return Math.round(offset / step) * step; }
export function verticesOf(obj: DrawObject): Pt[] {
  if (obj.type === "line" || obj.type === "dim") return [{ x: obj.x1, y: obj.y1 }, { x: obj.x2, y: obj.y2 }];
  if (obj.type === "rect") return [{ x: obj.x, y: obj.y }, { x: obj.x + obj.w, y: obj.y }, { x: obj.x + obj.w, y: obj.y + obj.h }, { x: obj.x, y: obj.y + obj.h }];
  return [{ x: obj.x, y: obj.y }];
}
export function segmentsOf(obj: DrawObject) {
  if (obj.type === "line") return [{ a: { x: obj.x1, y: obj.y1 }, b: { x: obj.x2, y: obj.y2 } }];
  if (obj.type === "rect") { const p = verticesOf(obj); return [{ a: p[0], b: p[1] }, { a: p[1], b: p[2] }, { a: p[2], b: p[3] }, { a: p[3], b: p[0] }]; }
  return [];
}
export function allVertices(objects: DrawObject[]) { return objects.flatMap(verticesOf); }
export function allSegments(objects: DrawObject[]) { return objects.flatMap(segmentsOf); }
function nearestPt(p: Pt, pts: Pt[], tol: number): Pt | null {
  let best: Pt | null = null; let bestD = tol;
  for (const q of pts) { const d = dist(p, q); if (d < bestD) { bestD = d; best = q; } }
  return best;
}
function distToSeg(p: Pt, a: Pt, b: Pt): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return dist(p, a);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
}
export function nearestSegment(p: Pt, objects: DrawObject[], tol: number) {
  let best: { a: Pt; b: Pt } | null = null; let bestD = tol;
  for (const s of allSegments(objects)) { const d = distToSeg(p, s.a, s.b); if (d < bestD) { bestD = d; best = s; } }
  return best;
}
export function closestOnSeg(p: Pt, a: Pt, b: Pt): Pt {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return a;
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
}
export function snapToDrawing(p: Pt, objects: DrawObject[], extra: Pt[] | undefined, tol: number): Pt {
  const verts = extra ? [...allVertices(objects), ...extra] : allVertices(objects);
  const vert = nearestPt(p, verts, tol);
  if (vert) return vert;
  const seg = nearestSegment(p, objects, tol);
  if (seg) return closestOnSeg(p, seg.a, seg.b);
  return p;
}
export function pickDimStart(p: Pt, objects: DrawObject[], tol: number) {
  const vert = nearestPt(p, allVertices(objects), tol);
  const seg = nearestSegment(p, objects, tol);
  if (seg) {
    const dSeg = distToSeg(p, seg.a, seg.b);
    const dVert = vert ? dist(p, vert) : Infinity;
    if (dSeg <= dVert + 1) return { start: seg.a, end: seg.b, locked: true };
  }
  return { start: vert ?? p, end: vert ?? p, locked: false };
}
export function snapDimEnd(start: Pt, pointer: Pt, objects: DrawObject[], tol: number) {
  const verts = allVertices(objects).filter((q) => dist(q, start) > 2);
  const nearVert = nearestPt(pointer, verts, tol);
  if (nearVert) return { end: nearVert, offset: keepMinOffset(signedPerp(pointer, start, nearVert)) };
  let best: { end: Pt; score: number } | null = null;
  for (const s of allSegments(objects)) {
    const atA = dist(start, s.a) <= tol; const atB = dist(start, s.b) <= tol;
    if (!atA && !atB) continue;
    const end = atA ? s.b : s.a;
    const len = dist(s.a, s.b) || 1;
    const t = ((pointer.x - s.a.x) * (s.b.x - s.a.x) + (pointer.y - s.a.y) * (s.b.y - s.a.y)) / (len * len);
    if (t < -0.25 || t > 1.25) continue;
    const score = Math.abs(signedPerp(pointer, s.a, s.b));
    if (!best || score < best.score) best = { end, score };
  }
  if (best) return { end: best.end, offset: keepMinOffset(signedPerp(pointer, start, best.end)) };
  return { end: pointer, offset: keepMinOffset(signedPerp(pointer, start, pointer)) };
}
export function endpoints(obj: DrawObject): Pt[] {
  if (obj.type === "line" || obj.type === "dim") {
    const pts: Pt[] = [{ x: obj.x1, y: obj.y1 }, { x: obj.x2, y: obj.y2 }, { x: (obj.x1 + obj.x2) / 2, y: (obj.y1 + obj.y2) / 2 }];
    if (obj.type === "dim") { const g = dimGeom(obj); pts.push({ x: g.ax, y: g.ay }, { x: g.bx, y: g.by }, { x: g.mx, y: g.my }); }
    return pts;
  }
  if (obj.type === "rect") return [{ x: obj.x, y: obj.y }, { x: obj.x + obj.w, y: obj.y }, { x: obj.x, y: obj.y + obj.h }, { x: obj.x + obj.w, y: obj.y + obj.h }, { x: obj.x + obj.w / 2, y: obj.y }, { x: obj.x + obj.w / 2, y: obj.y + obj.h }, { x: obj.x, y: obj.y + obj.h / 2 }, { x: obj.x + obj.w, y: obj.y + obj.h / 2 }];
  return [{ x: obj.x, y: obj.y }];
}
export function distPointSeg(p: Pt, a: Pt, b: Pt): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return dist(p, a);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
}
export function hitDimPart(obj: Extract<DrawObject, { type: "dim" }>, p: Pt, _tol: number, scale: number): "label" | "body" | null {
  const px = 1 / Math.max(scale, 0.05); const g = dimGeom(obj); const lab = dimLabelWorld(obj, scale);
  const dLabel = dist(p, lab); const dBody = distPointSeg(p, { x: g.ax, y: g.ay }, { x: g.bx, y: g.by });
  if (dLabel <= 16 * px && dLabel <= dBody + 2 * px) return "label";
  if (dBody <= 7 * px) return "body";
  if (dLabel <= 16 * px) return "label";
  return null;
}
export function hitScore(obj: DrawObject, p: Pt, scale: number): number | null {
  const px = 1 / Math.max(scale, 0.05);
  if (obj.type === "line") { const d = distPointSeg(p, { x: obj.x1, y: obj.y1 }, { x: obj.x2, y: obj.y2 }); return d <= 24 * px ? d : null; }
  if (obj.type === "dim") {
    const g = dimGeom(obj); const lab = dimLabelWorld(obj, scale); const dLabel = dist(p, lab); const dBody = distPointSeg(p, { x: g.ax, y: g.ay }, { x: g.bx, y: g.by });
    let best = Infinity; if (dLabel <= 16 * px) best = Math.min(best, dLabel); if (dBody <= 7 * px) best = Math.min(best, dBody); return best === Infinity ? null : best;
  }
  if (obj.type === "rect") {
    const tol = 8 * px;
    const inside = p.x >= obj.x - tol && p.x <= obj.x + obj.w + tol && p.y >= obj.y - tol && p.y <= obj.y + obj.h + tol;
    const deep = p.x > obj.x + tol && p.x < obj.x + obj.w - tol && p.y > obj.y + tol && p.y < obj.y + obj.h - tol;
    return inside && !deep ? 0 : null;
  }
  if (obj.type === "angle") return null;
  const d = dist(p, { x: obj.x, y: obj.y });
  return d < 16 * px ? d : null;
}
export function strokeDash(ctx: CanvasRenderingContext2D, dash: DashStyle, scale: number) { ctx.setLineDash(DASH[dash].map((n) => n / Math.max(scale, 0.2))); }
function strokeDimMarks(ctx: CanvasRenderingContext2D, obj: Extract<DrawObject, { type: "dim" }>, g: DimGeom, tick: number) {
  ctx.beginPath();
  ctx.moveTo(obj.x1, obj.y1); ctx.lineTo(g.ax + g.nx * tick, g.ay + g.ny * tick);
  ctx.moveTo(obj.x2, obj.y2); ctx.lineTo(g.bx + g.nx * tick, g.by + g.ny * tick);
  ctx.moveTo(g.ax, g.ay); ctx.lineTo(g.bx, g.by);
  ctx.moveTo(g.ax - g.nx * tick, g.ay - g.ny * tick); ctx.lineTo(g.ax + g.nx * tick, g.ay + g.ny * tick);
  ctx.moveTo(g.bx - g.nx * tick, g.by - g.ny * tick); ctx.lineTo(g.bx + g.nx * tick, g.by + g.ny * tick);
  ctx.stroke();
}
export function paintDim(ctx: CanvasRenderingContext2D, obj: Extract<DrawObject, { type: "dim" }>, scale: number, hi = false, hideLabel = false) {
  const g = dimGeom(obj); const s = 1 / scale; const tick = 12 * s;
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; strokeDash(ctx, "dash", scale);
  ctx.strokeStyle = strokeColor(obj.color); ctx.fillStyle = strokeColor(obj.color); ctx.lineWidth = (hi ? Math.max((obj.width ?? 1) + 0.6, 1.6) : (obj.width ?? 1)) / scale;
  if (hi) { ctx.shadowColor = obj.color; ctx.shadowBlur = 8; }
  strokeDimMarks(ctx, obj, g, tick); ctx.setLineDash([]);
  if (hideLabel) { ctx.restore(); return; }
  const pose = dimLabelWorld(obj, scale);
  ctx.translate(pose.x, pose.y); ctx.rotate(pose.angle); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = labelColor();
  ctx.font = `600 ${DIM_FONT * s}px IBM Plex Mono, monospace`;
  ctx.fillText(dimText(obj), 0, 0); ctx.restore();
}


export function angleJoint(obj: Extract<DrawObject, { type: "angle" }>, objects: DrawObject[]) {
  const a = objects.find((o) => o.id === obj.a && o.type === "line");
  const b = objects.find((o) => o.id === obj.b && o.type === "line");
  if (!a || a.type !== "line" || !b || b.type !== "line") return null;
  const pts = [{ x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 }];
  const qts = [{ x: b.x1, y: b.y1 }, { x: b.x2, y: b.y2 }];
  let best = { d: Infinity, p: pts[0], q: qts[0] };
  for (const p of pts) for (const q of qts) {
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < best.d) best = { d, p, q };
  }
  return { x: (best.p.x + best.q.x) / 2, y: (best.p.y + best.q.y) / 2 };
}
export function paintAngle(ctx: CanvasRenderingContext2D, obj: Extract<DrawObject, { type: "angle" }>, objects: DrawObject[], scale: number) {
  const a = objects.find((o) => o.id === obj.a && o.type === "line");
  const b = objects.find((o) => o.id === obj.b && o.type === "line");
  if (!a || a.type !== "line" || !b || b.type !== "line") return;
  const pts = [{ x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 }];
  const qts = [{ x: b.x1, y: b.y1 }, { x: b.x2, y: b.y2 }];
  let best = { d: Infinity, p: pts[0], q: qts[0] };
  for (const p of pts) for (const q of qts) {
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < best.d) best = { d, p, q };
  }
  const joint = { x: (best.p.x + best.q.x) / 2, y: (best.p.y + best.q.y) / 2 };
  const va = best.p.x === a.x1 && best.p.y === a.y1 ? { x: a.x2 - a.x1, y: a.y2 - a.y1 } : { x: a.x1 - a.x2, y: a.y1 - a.y2 };
  const vb = best.q.x === b.x1 && best.q.y === b.y1 ? { x: b.x2 - b.x1, y: b.y2 - b.y1 } : { x: b.x1 - b.x2, y: b.y1 - b.y2 };
  const la = Math.hypot(va.x, va.y) || 1;
  const lb = Math.hypot(vb.x, vb.y) || 1;
  let a0 = Math.atan2(va.y, va.x);
  let a1 = Math.atan2(vb.y, vb.x);
  let sweep = a1 - a0;
  while (sweep <= -Math.PI) sweep += Math.PI * 2;
  while (sweep > Math.PI) sweep -= Math.PI * 2;
  sweep = sweep > 0 ? sweep - Math.PI * 2 : sweep + Math.PI * 2;
  const deg = Math.round(Math.abs(sweep) * 180 / Math.PI);
  const r = Math.max(12, obj.radius ?? 22);
  const labelAt = Math.max(r + 16, obj.label ?? r + 28);
  ctx.save();
  ctx.strokeStyle = strokeColor(obj.color);
  ctx.fillStyle = strokeColor(obj.color);
  ctx.lineWidth = 1.4 / scale;
  ctx.beginPath();
  ctx.arc(joint.x, joint.y, r, a0, a0 + sweep, sweep < 0);
  ctx.stroke();
  const arrow = 5 / scale;
  for (const ang of [a0, a0 + sweep]) {
    const px = joint.x + Math.cos(ang) * r;
    const py = joint.y + Math.sin(ang) * r;
    const dir = ang === a0 ? (sweep < 0 ? -1 : 1) : (sweep < 0 ? 1 : -1);
    const tx = -Math.sin(ang) * dir;
    const ty = Math.cos(ang) * dir;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - tx * arrow + Math.cos(ang) * arrow * 0.6, py - ty * arrow + Math.sin(ang) * arrow * 0.6);
    ctx.lineTo(px - tx * arrow - Math.cos(ang) * arrow * 0.6, py - ty * arrow - Math.sin(ang) * arrow * 0.6);
    ctx.closePath();
    ctx.fill();
  }
  const mid = a0 + sweep / 2;
  const ax = joint.x + Math.cos(mid) * r;
  const ay = joint.y + Math.sin(mid) * r;
  const lx = joint.x + Math.cos(mid) * labelAt;
  const ly = joint.y + Math.sin(mid) * labelAt;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(lx, ly);
  ctx.lineTo(lx + 16 / scale, ly);
  ctx.stroke();
  ctx.fillStyle = labelColor();
  ctx.font = `600 ${16 / scale}px IBM Plex Mono, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`${deg}°`, lx + 18 / scale, ly);
  ctx.restore();
}
export function paintObject(ctx: CanvasRenderingContext2D, obj: DrawObject, scale: number, hi: boolean, hideLabel = false) {
  ctx.save();
  if (obj.type === "line" || obj.type === "rect") {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const drawShape = () => { ctx.beginPath(); if (obj.type === "line") { ctx.moveTo(obj.x1, obj.y1); ctx.lineTo(obj.x2, obj.y2); } else ctx.rect(obj.x, obj.y, obj.w, obj.h); ctx.stroke(); };
    if (hi) { ctx.shadowColor = strokeColor(obj.color); ctx.shadowBlur = 8; ctx.strokeStyle = strokeColor(obj.color); ctx.lineWidth = Math.max(obj.width + 1.2, 3.4) / scale; drawShape(); }
    else { ctx.strokeStyle = strokeColor(obj.color); ctx.lineWidth = Math.max(obj.width, 2.8) / scale; strokeDash(ctx, obj.dash, scale); drawShape(); }
  } else if (obj.type === "dim") paintDim(ctx, obj, scale, hi, hideLabel);
  else { ctx.fillStyle = obj.color; ctx.font = `${obj.size / scale}px Manrope, sans-serif`; ctx.fillText(obj.text, obj.x, obj.y); }
  ctx.restore();
}
export function renderDrawingToBlob(drawing: Drawing, size?: { w: number; h: number }): Promise<Blob | null> {
  if (drawing.objects.length === 0) return Promise.resolve(null);
  const w = size?.w ?? 960; const h = size?.h ?? 640;
  const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d"); if (!ctx) return Promise.resolve(null);
  const v = fitView(drawing.objects, w, h, 48);
  ctx.fillStyle = sheetColor(); ctx.fillRect(0, 0, w, h); ctx.save(); ctx.translate(v.x, v.y); ctx.scale(v.scale, v.scale);
  for (const obj of drawing.objects) { if (obj.type === "angle") paintAngle(ctx, obj, drawing.objects, v.scale); else paintObject(ctx, obj, v.scale, false); }
  ctx.restore();
  return new Promise((resolve) => { canvas.toBlob((blob) => resolve(blob), "image/png"); });
}
