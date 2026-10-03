import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, MousePointer2, PenLine, Redo2, Ruler, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dimInputValue, dimLabelWorld, dist, fitView, hitDimPart, hitScore, keepMinOffset, paintDim, paintObject, parseMm, pickDimStart, resizeFromStart, SCALE_DEFAULT, SHEET_BG, signedPerp, snapDimEnd, snapToDrawing, strokeDash, type Pt } from "@/lib/draw-render";
import { DRAW_COLORS, type DrawObject, type Drawing } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

type Tool = "select" | "line" | "dim";

export function DrawingEditor({ drawing, onChange, compact = false }: { drawing: Drawing; onChange: (d: Drawing) => void; compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("line");
  const [color, setColor] = useState(DRAW_COLORS[0]);
  const [selected, setSelected] = useState<string[]>([]);
  const [view, setView] = useState(() => drawing.view ?? { x: 72, y: 72, scale: SCALE_DEFAULT });
  const [draft, setDraft] = useState<{ start: Pt; end: Pt; offset?: number; locked?: boolean } | null>(null);
  const [length, setLength] = useState("");
  const [labelBox, setLabelBox] = useState<{ id: string; x: number; y: number; value: string } | null>(null);
  const history = useRef<DrawObject[][]>([drawing.objects]);
  const histIndex = useRef(0);
  const objects = drawing.objects;
  const viewRef = useRef(view);
  viewRef.current = view;
  const objectsRef = useRef(objects);
  objectsRef.current = objects;
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const colorRef = useRef(color);
  colorRef.current = color;
  const manualRef = useRef<string | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const panRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const downRef = useRef<{ x: number; y: number; empty: boolean } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; scale: number; ox: number; oy: number; vx: number; vy: number } | null>(null);
  const holdRef = useRef<number | null>(null);
  const lengthRef = useRef<HTMLInputElement>(null);
  const offsetDrag = useRef<string | null>(null);
  function clearHold() { if (holdRef.current) window.clearTimeout(holdRef.current); holdRef.current = null; }
  const lineColor = DRAW_COLORS[0];
  const dimColor = DRAW_COLORS[4];
  function activeColor(forTool: Tool = toolRef.current) {
    return manualRef.current ?? (forTool === "dim" ? dimColor : lineColor);
  }

  const commit = useCallback((next: DrawObject[]) => {
    history.current = [...history.current.slice(0, histIndex.current + 1), next].slice(-40);
    histIndex.current = history.current.length - 1;
    onChange({ ...drawing, objects: next, view: viewRef.current, updatedAt: Date.now() });
  }, [drawing, onChange]);

  function undo() {
    if (histIndex.current <= 0) return;
    histIndex.current -= 1;
    onChange({ ...drawing, objects: history.current[histIndex.current], view: viewRef.current, updatedAt: Date.now() });
  }
  function redo() {
    if (histIndex.current >= history.current.length - 1) return;
    histIndex.current += 1;
    onChange({ ...drawing, objects: history.current[histIndex.current], view: viewRef.current, updatedAt: Date.now() });
  }
  function delSelected() {
    if (!selected.length) return;
    commit(objects.filter((o) => !selected.includes(o.id)));
    setSelected([]);
  }

  const toWorld = (cx: number, cy: number): Pt => {
    const v = viewRef.current;
    return { x: (cx - v.x) / v.scale, y: (cy - v.y) / v.scale };
  };
  const local = (e: React.PointerEvent) => {
    const r = canvasRef.current?.getBoundingClientRect();
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const v = viewRef.current;
    ctx.fillStyle = SHEET_BG;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.scale(v.scale, v.scale);
    for (const obj of objectsRef.current) paintObject(ctx, obj, v.scale, selected.includes(obj.id));
    const preview = draftRef.current;
    if (preview && preview.pan) {
      /* sheet is moving */
    } else if (preview && toolRef.current === "dim") {
      paintDim(ctx, { id: "tmp", type: "dim", x1: preview.start.x, y1: preview.start.y, x2: preview.end.x, y2: preview.end.y, offset: preview.offset ?? 40, color: activeColor("dim"), width: 2, dash: "dash" }, v.scale);
    } else if (preview) {
      ctx.strokeStyle = activeColor("line");
      ctx.lineWidth = 2.8 / v.scale;
      strokeDash(ctx, "solid", v.scale);
      ctx.beginPath();
      ctx.moveTo(preview.start.x, preview.start.y);
      ctx.lineTo(preview.end.x, preview.end.y);
      ctx.stroke();
    }
    ctx.restore();
  }, [selected]);

  useEffect(() => { redraw(); }, [redraw, objects, view, draft, color]);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      const v = viewRef.current;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const scale = Math.min(8, Math.max(0.25, v.scale * factor));
      const wx = (cx - v.x) / v.scale;
      const wy = (cy - v.y) / v.scale;
      setView({ scale, x: cx - wx * scale, y: cy - wy * scale });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => redraw());
    ro.observe(el);
    return () => ro.disconnect();
  }, [redraw]);

  function hit(p: Pt) {
    let best: DrawObject | null = null;
    let score = Infinity;
    for (const o of objectsRef.current) {
      const s = hitScore(o, p, viewRef.current.scale);
      if (s != null && s < score) { score = s; best = o; }
    }
    return best;
  }

  function onDown(e: React.PointerEvent) {
    if (e.button !== 2) e.preventDefault();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2) {
      clearHold();
      setDraft(null);
      const pts = [...pointers.current.values()];
      const r = canvasRef.current?.getBoundingClientRect();
      pinchRef.current = { dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1, scale: viewRef.current.scale, ox: (pts[0].x + pts[1].x) / 2 - (r?.left ?? 0), oy: (pts[0].y + pts[1].y) / 2 - (r?.top ?? 0), vx: viewRef.current.x, vy: viewRef.current.y };
      return;
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = local(e);
    const world = toWorld(p.x, p.y);
    clearHold();
    holdRef.current = window.setTimeout(() => { setSelected(objectsRef.current.map((o) => o.id)); setTool("select"); setDraft(null); }, 560);
    if (e.button === 2) {
      if (!hit(world)) panRef.current = { x: e.clientX, y: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y };
      return;
    }
    if (e.button === 1 || toolRef.current === "select" && e.shiftKey) return;
    downRef.current = { x: e.clientX, y: e.clientY, empty: !hit(world) };
    if (toolRef.current === "select") {
      const found = hit(world);
      setSelected(found ? [found.id] : []);
      if (found?.type === "line") setLength(String(Math.round(dist({ x: found.x1, y: found.y1 }, { x: found.x2, y: found.y2 }))));
      if (found?.type === "dim") {
        const part = hitDimPart(found, world, 22 / viewRef.current.scale, viewRef.current.scale);
        if (part === "label") {
          const pose = dimLabelWorld(found, viewRef.current.scale);
          const v = viewRef.current;
          setLabelBox({ id: found.id, x: v.x + pose.x * v.scale, y: v.y + pose.y * v.scale, value: dimInputValue(found) });
        } else {
          offsetDrag.current = found.id;
          setLabelBox(null);
        }
      } else setLabelBox(null);
      return;
    }
    const tol = 22 / viewRef.current.scale;
    if (toolRef.current === "dim") {
      const picked = pickDimStart(world, objectsRef.current, tol);
      setDraft(picked);
      return;
    }
    const start = snapToDrawing(world, objectsRef.current, undefined, tol);
    setDraft({ start, end: start });
  }
  function onMove(e: React.PointerEvent) {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2 && pinchRef.current) {
      clearHold();
      const pts = [...pointers.current.values()];
      const distNow = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const r = canvasRef.current?.getBoundingClientRect();
      const cx = (pts[0].x + pts[1].x) / 2 - (r?.left ?? 0);
      const cy = (pts[0].y + pts[1].y) / 2 - (r?.top ?? 0);
      const pinch = pinchRef.current;
      const scale = Math.min(16, Math.max(0.06, pinch.scale * (distNow / pinch.dist)));
      const wx = (pinch.ox - pinch.vx) / pinch.scale;
      const wy = (pinch.oy - pinch.vy) / pinch.scale;
      setView({ scale, x: cx - wx * scale, y: cy - wy * scale });
      return;
    }
    if (downRef.current && Math.hypot(e.clientX - downRef.current.x, e.clientY - downRef.current.y) > 8) clearHold();
    if (offsetDrag.current) {
      const world = toWorld(local(e).x, local(e).y);
      const id = offsetDrag.current;
      const obj = objectsRef.current.find((o) => o.id === id && o.type === "dim");
      if (obj && obj.type === "dim") {
        const offset = keepMinOffset(signedPerp(world, { x: obj.x1, y: obj.y1 }, { x: obj.x2, y: obj.y2 }));
        onChange({ ...drawing, objects: objectsRef.current.map((o) => o.id === id && o.type === "dim" ? { ...o, offset } : o), view: viewRef.current, updatedAt: Date.now() });
      }
      return;
    }
    if (panRef.current) {
      setView({ ...viewRef.current, x: panRef.current.vx + (e.clientX - panRef.current.x), y: panRef.current.vy + (e.clientY - panRef.current.y) });
      return;
    }
    if (!draftRef.current) return;
    const world = toWorld(local(e).x, local(e).y);
    const tol = 22 / viewRef.current.scale;
    if (toolRef.current === "dim") {
      const snapped = draftRef.current.locked ? snapDimEnd(draftRef.current.start, world, objectsRef.current, tol) : { end: snapToDrawing(world, objectsRef.current, [draftRef.current.start], tol), offset: keepMinOffset(signedPerp(world, draftRef.current.start, world)) };
      setDraft({ ...draftRef.current, end: snapped.end, offset: snapped.offset });
      return;
    }
    const end = snapToDrawing(world, objectsRef.current, [draftRef.current.start], tol);
    const ortho = Math.abs(end.x - draftRef.current.start.x) > Math.abs(end.y - draftRef.current.start.y) ? { x: end.x, y: draftRef.current.start.y } : { x: draftRef.current.start.x, y: end.y };
    setDraft({ ...draftRef.current, end: ortho });
  }
  function onUp(e?: React.PointerEvent) {
    clearHold();
    if (e) pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (offsetDrag.current) { const id = offsetDrag.current; offsetDrag.current = null; commit(objectsRef.current); setSelected([id]); return; }
    if (panRef.current) { panRef.current = null; return; }
    const tap = downRef.current;
    downRef.current = null;
    const d = draftRef.current;
    setDraft(null);
    const moved = e && tap ? Math.hypot(e.clientX - tap.x, e.clientY - tap.y) : d ? dist(d.start, d.end) : 0;
    if (toolRef.current === "line" && tap?.empty && moved < 8) {
      setTool("select");
      setColor(activeColor("select"));
      return;
    }
    if (!d || dist(d.start, d.end) < 2) return;
    if (toolRef.current === "dim") {
      commit([...objectsRef.current, { id: uid("dr"), type: "dim", x1: d.start.x, y1: d.start.y, x2: d.end.x, y2: d.end.y, offset: d.offset ?? 40, color: activeColor("dim"), width: 2, dash: "dash" }]);
      return;
    }
    const line = { id: uid("dr"), type: "line" as const, x1: d.start.x, y1: d.start.y, x2: d.end.x, y2: d.end.y, color: activeColor("line"), width: 3, dash: "solid" as const };
    commit([...objectsRef.current, line]);
    setSelected([line.id]);
    setLength(String(Math.round(dist(d.start, d.end))));
    setTool("select");
    window.setTimeout(() => lengthRef.current?.focus(), 40);
  }

  function applyLength() {
    const id = selected[0];
    const obj = objects.find((o) => o.id === id);
    if (!obj) return;
    if (obj.type === "line") {
      const n = parseMm(length);
      if (n == null) return;
      commit(objects.map((o) => o.id === id && o.type === "line" ? resizeFromStart(o, n) : o));
    }
    if (obj.type === "dim") {
      const n = parseMm(length);
      commit(objects.map((o) => {
        if (o.id === id && o.type === "dim") return { ...o, label: length.trim() || undefined };
        if (n != null && o.type === "line" && Math.round(o.x1) === Math.round(obj.x1) && Math.round(o.y1) === Math.round(obj.y1) && Math.round(o.x2) === Math.round(obj.x2) && Math.round(o.y2) === Math.round(obj.y2)) return resizeFromStart(o, n);
        return o;
      }));
    }
  }

  const tools = useMemo(() => [
    { id: "select" as const, icon: MousePointer2, label: "Выбор" },
    { id: "line" as const, icon: PenLine, label: "Линия" },
    { id: "dim" as const, icon: Ruler, label: "Размер" },
  ], []);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2", compact && "min-h-[24rem]")}>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-border/80 bg-card/80 p-1">
          {tools.map((t) => (
            <button key={t.id} type="button" aria-label={t.label} aria-pressed={tool === t.id} onClick={() => { manualRef.current = null; setTool(t.id); setColor(t.id === "dim" ? dimColor : lineColor); }} className={cn("flex h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-medium", tool === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              <t.icon className="size-4" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <Button size="icon-sm" variant="secondary" onClick={undo} aria-label="Отменить"><Undo2 /></Button>
        <Button size="icon-sm" variant="secondary" onClick={redo} aria-label="Повторить"><Redo2 /></Button>
        <Button size="icon-sm" variant="secondary" onClick={delSelected} aria-label="Удалить" disabled={!selected.length}><Trash2 /></Button>
        <Button size="icon-sm" variant="secondary" aria-label="Вписать" onClick={() => { const el = wrapRef.current; if (el) setView(fitView(objects, el.clientWidth, el.clientHeight)); }}><Maximize2 /></Button>
        <div className="flex items-center gap-2">
          {DRAW_COLORS.map((c) => (
            <button key={c} type="button" aria-label={`Цвет ${c}`} className="size-7 rounded-full" style={{ background: c, boxShadow: color === c ? `0 0 0 2px #141816, 0 0 0 4px ${c}` : "0 0 0 2px transparent" }} onClick={() => { manualRef.current = c; setColor(c); setTool("line"); }} />
          ))}
        </div>
        {selected.length === 1 && objects.find((o) => o.id === selected[0])?.type === "line" ? (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Длина
            <input ref={lengthRef} value={length} inputMode="numeric" onChange={(e) => setLength(e.target.value)} onBlur={applyLength} onKeyDown={(e) => { if (e.key === "Enter") applyLength(); }} className="h-9 w-24 rounded-lg border border-border bg-background px-2 tabular text-sm text-foreground" />
          </label>
        ) : null}
      </div>
      <div ref={wrapRef} className="relative min-h-[22rem] flex-1 overflow-hidden rounded-xl border border-border">
        <canvas ref={canvasRef} className="absolute inset-0 touch-none" style={{ touchAction: "none" }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={(e) => { clearHold(); pointers.current.delete(e.pointerId); pinchRef.current = null; panRef.current = null; offsetDrag.current = null; downRef.current = null; setDraft(null); }} onContextMenu={(e) => e.preventDefault()} />
        {labelBox ? (
          <input
            autoFocus
            inputMode="numeric"
            value={labelBox.value}
            onChange={(e) => setLabelBox({ ...labelBox, value: e.target.value })}
            onBlur={() => { const box = labelBox; setLabelBox(null); commit(objectsRef.current.map((o) => o.id === box.id && o.type === "dim" ? { ...o, label: box.value.trim() || undefined } : o)); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); }}
            className="absolute z-20 h-9 w-20 -translate-x-1/2 -translate-y-1/2 rounded-md border border-primary bg-background px-2 text-center text-sm text-foreground shadow-float"
            style={{ left: labelBox.x, top: labelBox.y }}
          />
        ) : null}
      </div>
    </div>
  );
}
