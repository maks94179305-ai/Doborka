#!/usr/bin/env python3
from pathlib import Path

def rep(path, old, new, label):
    p = Path(path)
    s = p.read_text()
    if old not in s:
        if new[:40] in s:
            print(label, "already")
            return
        raise SystemExit(f"FAIL {label}: pattern missing")
    p.write_text(s.replace(old, new, 1))
    print(label, "ok")

rep("src/lib/types.ts",
"""export type DrawObject =
  | { id: string; type: "line"; x1: number; y1: number; x2: number; y2: number; color: string; width: number; dash: DashStyle }
  | { id: string; type: "rect"; x: number; y: number; w: number; h: number; color: string; width: number; dash: DashStyle }
  | { id: string; type: "dim"; x1: number; y1: number; x2: number; y2: number; offset: number; color: string; width?: number; dash?: DashStyle; label?: string }
  | { id: string; type: "text"; x: number; y: number; text: string; size: number; color: string }
  | { id: string; type: "angle"; a: string; b: string; color: string; radius?: number; label?: number };""",
"""export type DrawObject =
  | { id: string; type: "line"; x1: number; y1: number; x2: number; y2: number; color: string; width: number; dash: DashStyle }
  | { id: string; type: "rect"; x: number; y: number; w: number; h: number; color: string; width: number; dash: DashStyle }
  | { id: string; type: "dim"; x1: number; y1: number; x2: number; y2: number; offset: number; color: string; width?: number; dash?: DashStyle; label?: string }
  | { id: string; type: "text"; x: number; y: number; text: string; size: number; color: string }
  | { id: string; type: "angle"; a: string; b: string; color: string; radius?: number; label?: number }
  | { id: string; type: "path"; points: { x: number; y: number }[]; color: string; width: number }
  | { id: string; type: "arrow"; x1: number; y1: number; x2: number; y2: number; color: string; width: number; dash: DashStyle; label?: string };""",
"types")

rep("src/lib/draw-render.ts",
"""export function verticesOf(obj: DrawObject): Pt[] {
  if (obj.type === "line" || obj.type === "dim") return [{ x: obj.x1, y: obj.y1 }, { x: obj.x2, y: obj.y2 }];
  if (obj.type === "rect") return [{ x: obj.x, y: obj.y }, { x: obj.x + obj.w, y: obj.y }, { x: obj.x + obj.w, y: obj.y + obj.h }, { x: obj.x, y: obj.y + obj.h }];
  return [{ x: obj.x, y: obj.y }];
}""",
"""export function verticesOf(obj: DrawObject): Pt[] {
  if (obj.type === "line" || obj.type === "dim" || obj.type === "arrow") return [{ x: obj.x1, y: obj.y1 }, { x: obj.x2, y: obj.y2 }];
  if (obj.type === "rect") return [{ x: obj.x, y: obj.y }, { x: obj.x + obj.w, y: obj.y }, { x: obj.x + obj.w, y: obj.y + obj.h }, { x: obj.x, y: obj.y + obj.h }];
  if (obj.type === "path") return obj.points.slice();
  if (obj.type === "text") return [{ x: obj.x, y: obj.y }];
  return [];
}""",
"vertices")

rep("src/lib/draw-render.ts",
"""export function segmentsOf(obj: DrawObject) {
  if (obj.type === "line") return [{ a: { x: obj.x1, y: obj.y1 }, b: { x: obj.x2, y: obj.y2 } }];
  if (obj.type === "rect") { const p = verticesOf(obj); return [{ a: p[0], b: p[1] }, { a: p[1], b: p[2] }, { a: p[2], b: p[3] }, { a: p[3], b: p[0] }]; }
  return [];
}""",
"""export function segmentsOf(obj: DrawObject) {
  if (obj.type === "line" || obj.type === "arrow" || obj.type === "dim") return [{ a: { x: obj.x1, y: obj.y1 }, b: { x: obj.x2, y: obj.y2 } }];
  if (obj.type === "path" && obj.points.length > 1) {
    const segs = [];
    for (let i = 1; i < obj.points.length; i++) segs.push({ a: obj.points[i - 1], b: obj.points[i] });
    return segs;
  }
  if (obj.type === "rect") { const p = verticesOf(obj); return [{ a: p[0], b: p[1] }, { a: p[1], b: p[2] }, { a: p[2], b: p[3] }, { a: p[3], b: p[0] }]; }
  return [];
}""",
"segments")

rep("src/lib/draw-render.ts",
"""export function hitScore(obj: DrawObject, p: Pt, scale: number): number | null {
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
}""",
"""export function hitScore(obj: DrawObject, p: Pt, scale: number): number | null {
  const px = 1 / Math.max(scale, 0.05);
  if (obj.type === "line" || obj.type === "arrow") { const d = distPointSeg(p, { x: obj.x1, y: obj.y1 }, { x: obj.x2, y: obj.y2 }); return d <= 24 * px ? d : null; }
  if (obj.type === "path") {
    let best = Infinity;
    for (let i = 1; i < obj.points.length; i++) {
      const d = distPointSeg(p, obj.points[i - 1], obj.points[i]);
      if (d < best) best = d;
    }
    return best <= 24 * px ? best : null;
  }
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
  if (obj.type === "text") { const d = dist(p, { x: obj.x, y: obj.y }); return d < 16 * px ? d : null; }
  return null;
}""",
"hitScore")

rep("src/lib/draw-render.ts",
"""export function paintObject(ctx: CanvasRenderingContext2D, obj: DrawObject, scale: number, hi: boolean, hideLabel = false) {
  ctx.save();
  if (obj.type === "line" || obj.type === "rect") {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const drawShape = () => { ctx.beginPath(); if (obj.type === "line") { ctx.moveTo(obj.x1, obj.y1); ctx.lineTo(obj.x2, obj.y2); } else ctx.rect(obj.x, obj.y, obj.w, obj.h); ctx.stroke(); };
    if (hi) { ctx.shadowColor = strokeColor(obj.color); ctx.shadowBlur = 8; ctx.strokeStyle = strokeColor(obj.color); ctx.lineWidth = Math.max(obj.width + 1.2, 3.4) / scale; drawShape(); }
    else { ctx.strokeStyle = strokeColor(obj.color); ctx.lineWidth = Math.max(obj.width, 2.8) / scale; strokeDash(ctx, obj.dash, scale); drawShape(); }
  } else if (obj.type === "dim") paintDim(ctx, obj, scale, hi, hideLabel);
  else { ctx.fillStyle = obj.color; ctx.font = `${obj.size / scale}px Manrope, sans-serif`; ctx.fillText(obj.text, obj.x, obj.y); }
  ctx.restore();
}""",
"""export function paintObject(ctx: CanvasRenderingContext2D, obj: DrawObject, scale: number, hi: boolean, hideLabel = false) {
  ctx.save();
  if (obj.type === "line" || obj.type === "rect" || obj.type === "arrow" || obj.type === "path") {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const baseW = obj.width;
    const lw = hi ? Math.max(baseW + 1.2, 3.4) / scale : Math.max(baseW, 2.8) / scale;
    ctx.strokeStyle = strokeColor(obj.color);
    ctx.lineWidth = lw;
    if (hi) { ctx.shadowColor = strokeColor(obj.color); ctx.shadowBlur = 8; }
    if (obj.type === "line") {
      strokeDash(ctx, obj.dash, scale);
      ctx.beginPath(); ctx.moveTo(obj.x1, obj.y1); ctx.lineTo(obj.x2, obj.y2); ctx.stroke();
    } else if (obj.type === "rect") {
      strokeDash(ctx, obj.dash, scale);
      ctx.beginPath(); ctx.rect(obj.x, obj.y, obj.w, obj.h); ctx.stroke();
    } else if (obj.type === "path") {
      if (obj.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(obj.points[0].x, obj.points[0].y);
        for (let i = 1; i < obj.points.length; i++) ctx.lineTo(obj.points[i].x, obj.points[i].y);
        ctx.stroke();
      }
    } else if (obj.type === "arrow") {
      strokeDash(ctx, obj.dash, scale);
      const dx = obj.x2 - obj.x1, dy = obj.y2 - obj.y1;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const head = Math.min(14, len * 0.35);
      ctx.beginPath(); ctx.moveTo(obj.x1, obj.y1); ctx.lineTo(obj.x2, obj.y2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(obj.x2, obj.y2);
      ctx.lineTo(obj.x2 - ux * head - uy * head * 0.45, obj.y2 - uy * head + ux * head * 0.45);
      ctx.lineTo(obj.x2 - ux * head + uy * head * 0.45, obj.y2 - uy * head - ux * head * 0.45);
      ctx.closePath();
      ctx.fillStyle = strokeColor(obj.color);
      ctx.fill();
      if (obj.label && !hideLabel) {
        ctx.fillStyle = strokeColor(obj.color);
        ctx.font = `${12 / scale}px Manrope, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(obj.label, obj.x1 + 4 / scale, obj.y1 - 4 / scale);
      }
    }
  } else if (obj.type === "dim") paintDim(ctx, obj, scale, hi, hideLabel);
  else if (obj.type === "text") { ctx.fillStyle = obj.color; ctx.font = `${obj.size / scale}px Manrope, sans-serif`; ctx.fillText(obj.text, obj.x, obj.y); }
  ctx.restore();
}""",
"paintObject")

print("draw-render phase done")
