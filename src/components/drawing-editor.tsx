import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, MousePointer2, PenLine, Redo2, Ruler, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dimInputValue, dist, fitView, hitScore, keepMinOffset, paintDim, paintObject, parseMm, pickDimStart, resizeFromStart, SCALE_DEFAULT, SHEET_BG, signedPerp, snapDimEnd, snapToDrawing, strokeDash, type Pt } from "@/lib/draw-render";
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
  const draftRef = useRef(draft);
  draftRef.current = draft;

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
    if (preview && toolRef.current === "dim") {
      paintDim(ctx, { id: "tmp", type: "dim", x1: preview.start.x, y1: preview.start.y, x2: preview.end.x, y2: preview.end.y, offset: preview.offset ?? 40, color: colorRef.current, width: 2, dash: "dash" }, v.scale);
    } else if (preview) {
      ctx.strokeStyle = colorRef.current;
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
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = local(e);
    if (e.button === 1 || e.button === 2 || toolRef.current === "select" && e.shiftKey) return;
    const world = toWorld(p.x, p.y);
    if (toolRef.current === "select") {
      const found = hit(world);
      setSelected(found ? [found.id] : []);
      if (found?.type === "line") setLength(String(Math.round(dist({ x: found.x1, y: found.y1 }, { x: found.x2, y: found.y2 }))));
      if (found?.type === "dim") setLength(dimInputValue(found));
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
  function onUp() {
    const d = draftRef.current;
    setDraft(null);
    if (!d || dist(d.start, d.end) < 2) return;
    if (toolRef.current === "dim") {
      commit([...objectsRef.current, { id: uid("dr"), type: "dim", x1: d.start.x, y1: d.start.y, x2: d.end.x, y2: d.end.y, offset: d.offset ?? 40, color: colorRef.current, width: 2, dash: "dash" }]);
      return;
    }
    commit([...objectsRef.current, { id: uid("dr"), type: "line", x1: d.start.x, y1: d.start.y, x2: d.end.x, y2: d.end.y, color: colorRef.current, width: 3, dash: "solid" }]);
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
      commit(objects.map((o) => o.id === id && o.type === "dim" ? { ...o, label: length.trim() || undefined } : o));
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
            <button key={t.id} type="button" aria-label={t.label} aria-pressed={tool === t.id} onClick={() => setTool(t.id)} className={cn("flex h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-medium", tool === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
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
            <button key={c} type="button" aria-label={`Цвет ${c}`} className="size-7 rounded-full" style={{ background: c, boxShadow: color === c ? `0 0 0 3px #141816, 0 0 0 6px ${c}` : "0 0 0 2px transparent" }} onClick={() => setColor(c)} />
          ))}
        </div>
        {selected.length === 1 ? (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Длина
            <input value={length} onChange={(e) => setLength(e.target.value)} onBlur={applyLength} onKeyDown={(e) => { if (e.key === "Enter") applyLength(); }} className="h-9 w-24 rounded-lg border border-border bg-background px-2 tabular text-sm text-foreground" />
          </label>
        ) : null}
      </div>
      <div ref={wrapRef} className="relative min-h-[22rem] flex-1 overflow-hidden rounded-xl border border-border">
        <canvas ref={canvasRef} className="absolute inset-0 touch-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onContextMenu={(e) => e.preventDefault()} />
      </div>
    </div>
  );
}
