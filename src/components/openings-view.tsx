import { useEffect, useMemo, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Num } from "@/components/num-field";
import { SchemeDrawDialog } from "@/components/scheme-draw-dialog";
import { WindowDiagram } from "@/components/window-diagram";
import { dimLabelWorld, renderDrawingToBlob } from "@/lib/draw-render";
import { getPhoto, savePhoto } from "@/lib/photos";
import { uid } from "@/lib/utils";
import type { Drawing } from "@/lib/types";
import { mm } from "@/lib/format";
import { slopeLength } from "@/lib/pieces";
import { useProject, useWorkspace } from "@/lib/store";
import { SIDE_KEYS, SIDE_SHORT, type Opening, type SideKey, type SlopeSize } from "@/lib/types";

function OpeningEditor({ opening, fallback, onChange, onRemove }: { opening: Opening; fallback: number; onChange: (patch: Partial<Opening>) => void; onRemove: () => void }) {
  return (
    <div className="grid gap-4">
      <WindowDiagram opening={opening} fallbackAllowance={fallback} className="mr-auto mt-3 block h-44 w-[92%] max-w-full" onWidth={(n) => onChange({ width: n })} onHeight={(n) => onChange({ height: n })} onBottom={(n) => onChange({ bottomLength: n })} />
      <details open className="w-full rounded-xl border border-steel/50 bg-card px-3 py-2">
        <summary className="cursor-pointer text-base font-medium text-foreground">Запасы</summary>
        <div className="mt-2 grid gap-2">
          <Num label="Запас на откос" value={opening.allowance ?? fallback} onChange={(n) => onChange({ allowance: n })} />
          {opening.sides.bottom ? <Num label="Запас на отлив" value={opening.dripAllowance ?? fallback} onChange={(n) => onChange({ dripAllowance: n })} /> : null}
        </div>
      </details>
      <div>
        <details open className="mb-2 w-full rounded-xl border border-steel/50 bg-card px-3 py-2">
          <summary className="cursor-pointer text-base font-medium text-foreground">Толщина облицовки фасада</summary>
          <div className={"mb-2 grid gap-2 " + (opening.sides.bottom ? "grid-cols-4" : "grid-cols-3")}>
            <Num label="Слева" value={opening.facade?.left ?? 18} onChange={(n) => onChange({ facade: { ...opening.facade, left: n } })} />
            <Num label="Справа" value={opening.facade?.right ?? 18} onChange={(n) => onChange({ facade: { ...opening.facade, right: n } })} />
            <Num label="Сверху" value={opening.facade?.top ?? 18} onChange={(n) => onChange({ facade: { ...opening.facade, top: n } })} />
            {opening.sides.bottom ? <Num label="Отлив" value={opening.facade?.bottom ?? 18} onChange={(n) => onChange({ facade: { ...opening.facade, bottom: n } })} /> : null}
          </div>
        </details>
        <div className="grid w-full grid-cols-2 items-stretch gap-2 sm:grid-cols-4">
          {opening.sides.left ? <SlopeColumn label="Слева" title="Левый" thickness={opening.facade?.left ?? 18} schemeKey={`slope:${opening.facade?.left ?? 18}`} onThickness={(n) => onChange({ facade: { ...opening.facade, left: n } })} /> : null}
          {opening.sides.right ? <SlopeColumn label="Справа" title="Правый" thickness={opening.facade?.right ?? 18} schemeKey={`slope:${opening.facade?.right ?? 18}`} onThickness={(n) => onChange({ facade: { ...opening.facade, right: n } })} /> : null}
          {opening.sides.top ? <SlopeColumn label="Сверху" title="Верхний" thickness={opening.facade?.top ?? 18} schemeKey={`slope:${opening.facade?.top ?? 18}`} onThickness={(n) => onChange({ facade: { ...opening.facade, top: n } })} /> : null}
          {opening.sides.bottom ? <SlopeColumn label="Отлив" title="Отлив" thickness={opening.facade?.bottom ?? 18} schemeKey={`slope:bottom:${opening.facade?.bottom ?? 18}`} empty onThickness={(n) => onChange({ facade: { ...opening.facade, bottom: n } })} /> : null}
        </div>
      </div>
      <div>
        <Label className="mb-2 block">Стороны</Label>
        <div className="grid grid-cols-2 gap-2">
          {SIDE_KEYS.map((side) => {
            const on = opening.sides[side];
            const len = slopeLength(opening, side, fallback);
            return (
              <button key={side} type="button" onClick={() => onChange({ sides: { ...opening.sides, [side]: !on } })} className={`flex h-12 items-center justify-between rounded-lg border px-3 text-sm ${on ? "border-steel/50 bg-accent text-foreground" : "border-border text-muted-foreground"}`}>
<span>{SIDE_SHORT[side]}</span>
              </button>
            );
          })}
        </div>
      </div>
      <Button variant="destructive" onClick={onRemove}><Trash2 /> Удалить проём</Button>
    </div>
  );
}


function SlopeColumn({ label, title, thickness, onThickness, schemeKey, empty = false }: { label: string; title: string; thickness: number; onThickness: (n: number) => void; schemeKey: string; empty?: boolean }) {
  const project = useProject();
  const patch = useWorkspace((s) => s.patchProject);
  const [open, setOpen] = useState(false);
  const key = schemeKey;
  const saved = project?.drawings.find((d) => d.id === project.schemeDrawings?.[key]);
  const rise = Math.max(1, thickness);
  const generated = { id: uid("dr"), name: `Откос · ${thickness} мм`, updatedAt: Date.now(), objects: [
    { id: uid("ln"), type: "line" as const, x1: 0, y1: 0, x2: 0, y2: 50, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: uid("ln"), type: "line" as const, x1: 0, y1: 50, x2: 40, y2: 50, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: uid("ln"), type: "line" as const, x1: 40, y1: 50, x2: 40, y2: 49, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: uid("ln"), type: "line" as const, x1: 40, y1: 49, x2: 20, y2: 49, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: uid("ln"), type: "line" as const, x1: 20, y1: 49, x2: 20, y2: 49 - rise, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: uid("ln"), type: "line" as const, x1: 20, y1: 49 - rise, x2: 70, y2: 49 - rise, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: uid("dm"), type: "dim" as const, x1: 0, y1: 0, x2: 0, y2: 50, offset: 15, color: "#c46a45", width: 1, label: "50" },
    { id: uid("dm"), type: "dim" as const, x1: 0, y1: 50, x2: 40, y2: 50, offset: 15, color: "#c46a45", width: 1, label: "40" },
    { id: uid("dm"), type: "dim" as const, x1: 20, y1: 49, x2: 40, y2: 49, offset: -15, color: "#c46a45", width: 1, label: "20" },
    { id: uid("dm"), type: "dim" as const, x1: 20, y1: 49 - rise, x2: 20, y2: 49, offset: -50, color: "#c46a45", width: 1, label: String(thickness) },
    { id: uid("dm"), type: "dim" as const, x1: 20, y1: 49 - rise, x2: 70, y2: 49 - rise, offset: -15, color: "#c46a45", width: 1, label: "50" },
  ] };
  const blank = { id: uid("dr"), name: "Отлив", objects: [], updatedAt: Date.now() };
  const draft = saved ?? (empty ? blank : generated);
  async function done(next: Drawing) {
    const photoId = next.objects.length ? uid("ph") : "";
    if (photoId) {
      const blob = await renderDrawingToBlob(next);
      if (blob) await savePhoto(photoId, blob);
    }
    patch((p) => ({ ...p, drawings: [...p.drawings.filter((d) => d.id !== next.id), { ...next, previewPhotoId: photoId || undefined }], schemeDrawings: { ...(p.schemeDrawings ?? {}), [key]: next.id }, schemes: { ...(p.schemes ?? {}), [key]: photoId ? [photoId] : [] } }));
  }
  return (
    <div className="h-full">
      <button type="button" className="mt-1 block h-full w-full" onClick={() => setOpen(true)} aria-label={`Править ${title}`}>
        {saved && saved.objects.length ? <DrawingShot drawing={saved} /> : empty || (saved && !saved.objects.length) ? <SlopeProfile thickness={thickness} label={title} blank /> : <DrawingShot drawing={generated} />}
      </button>
      {open ? <SchemeDrawDialog open={open} title={title} drawing={draft} onOpenChange={setOpen} onDone={(d) => { void done(d); }} /> : null}
    </div>
  );
}



function DrawingShot({ drawing }: { drawing: Drawing }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let alive = true;
    void renderDrawingToBlob(drawing, { w: 640, h: 420 }).then((blob) => {
      if (!blob || !alive) return;
      const next = URL.createObjectURL(blob);
      setUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return next; });
    });
    return () => { alive = false; };
  }, [drawing]);
  return <figure className="mx-auto w-full rounded-xl border border-border bg-[#141816] p-1.5">{url ? <img src={url} alt="" className="mx-auto block h-auto w-full object-contain" /> : <svg viewBox="8 17 126 85" className="mx-auto mt-1 block h-auto w-full" />}</figure>;
}
function SavedScheme({ drawing }: { drawing: Drawing }) {
  const lines = drawing.objects.filter((o) => o.type === "line");
  const dims = drawing.objects.filter((o) => o.type === "dim");
  const pts = [...lines, ...dims].flatMap((o) => {
    if (o.type !== "dim") return [o.x1, o.y1, o.x2, o.y2];
    const dx = o.x2 - o.x1, dy = o.y2 - o.y1, len = Math.hypot(dx, dy) || 1;
    const ox = (-dy / len) * (o.offset || 15), oy = (dx / len) * (o.offset || 15);
    return [o.x1 + ox, o.y1 + oy, o.x2 + ox, o.y2 + oy];
  });
  if (!pts.length) return null;
  const minX = Math.min(...pts) - 28, minY = Math.min(...pts) - 28, maxX = Math.max(...pts) + 28, maxY = Math.max(...pts) + 28;
  return (
    <figure className="mx-auto w-full rounded-xl border border-border bg-[#141816] p-1.5">
      <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} className="mx-auto block h-auto w-full">
        {lines.map((o) => <line key={o.id} x1={o.x1} y1={o.y1} x2={o.x2} y2={o.y2} stroke="#f3f1ec" strokeWidth="1.6" />)}
        {dims.map((o) => {
          const dx = o.x2 - o.x1, dy = o.y2 - o.y1, len = Math.hypot(dx, dy) || 1;
          const ox = (-dy / len) * (o.offset || 15), oy = (dx / len) * (o.offset || 15);
          const label = dimLabelWorld(o, 1.4);
          return <g key={o.id}><path d={`M${o.x1} ${o.y1} L${o.x1 + ox} ${o.y1 + oy} M${o.x2} ${o.y2} L${o.x2 + ox} ${o.y2 + oy} M${o.x1 + ox} ${o.y1 + oy} L${o.x2 + ox} ${o.y2 + oy}`} fill="none" stroke="#c46a45" strokeWidth="0.6" strokeDasharray="2 2" /><text x={label.x} y={label.y} fill="#f3f1ec" fontSize="9" textAnchor="middle">{o.label || ""}</text></g>;
        })}
      </svg>
    </figure>
  );
}
function SchemePreview({ photoId, label }: { photoId: string; label: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let live = true;
    void getPhoto(photoId).then((blob) => { if (live && blob) setUrl(URL.createObjectURL(blob)); });
    return () => { live = false; };
  }, [photoId]);
  return <figure className="mx-auto w-full rounded-xl border border-border bg-[#141816] p-1.5">{url ? <img src={url} alt={label} className="mx-auto block h-24 w-full object-contain" /> : null}</figure>;
}
function SlopeProfile({ thickness, label, blank = false }: { thickness: number; label: string; blank?: boolean }) {
  const rise = Math.max(1, thickness);
  const x0 = 36, y0 = 28;
  const yb = y0 + 50;
  const xTail = x0 + 40;
  const yHook = yb - 1;
  const xShelf = xTail - 20;
  const yTop = yHook - rise;
  const xTop = xShelf + 50;
  const minX = x0 - 28, minY = yTop - 42, maxX = xTop + 28, maxY = yb + 24;
  const line = `M${x0} ${y0} V${yb} H${xTail} V${yHook} H${xShelf} V${yTop} H${xTop}`;
  return (
    <figure className="mx-auto w-full rounded-xl border border-border bg-[#141816] p-1.5">
      <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} preserveAspectRatio="xMidYMid meet" className="mx-auto mt-1 block h-auto w-full" aria-label={`${label}, толщина ${thickness}`}>
        {blank ? null : <path d={line} fill="none" stroke="#f3f1ec" strokeWidth="1.6" />}
        {blank ? null : <><Dim x1={x0} y1={y0} x2={x0} y2={yb} dx={-15} dy={0} text="50" /><Dim x1={x0} y1={yb} x2={xTail} y2={yb} dx={0} dy={15} text="40" /><Dim x1={xShelf} y1={yHook} x2={xTail} y2={yHook} dx={0} dy={-15} textDy={6} text="20" /><Dim x1={xShelf} y1={yTop} x2={xShelf} y2={yHook} dx={xTop - xShelf} dy={0} textDx={10} textDy={8} text={String(thickness)} /><Dim x1={xShelf} y1={yTop} x2={xTop} y2={yTop} dx={0} dy={-15} text="50" /></>}
      </svg>
    </figure>
  );
}
function Dim({ x1, y1, x2, y2, dx, dy, text, textDx = 0, textDy = 0 }: { x1: number; y1: number; x2: number; y2: number; dx: number; dy: number; text: string; textDx?: number; textDy?: number }) {
  return (
    <g fill="none" stroke="#c46a45" strokeWidth="0.6" strokeDasharray="2 2">
      <path d={`M${x1} ${y1} L${x1 + dx} ${y1 + dy} M${x2} ${y2} L${x2 + dx} ${y2 + dy} M${x1 + dx} ${y1 + dy} L${x2 + dx} ${y2 + dy}`} />
      <text x={(x1 + x2) / 2 + dx + textDx} y={(y1 + y2) / 2 + dy - 4 + textDy} fill="#f3f1ec" stroke="none" fontSize="8" textAnchor="middle" fontFamily="IBM Plex Mono, monospace">{text}</text>
    </g>
  );
}
export function OpeningsView() {
  const project = useProject();
  const addOpening = useWorkspace((s) => s.addOpening);
  const updateOpening = useWorkspace((s) => s.updateOpening);
  const duplicateOpening = useWorkspace((s) => s.duplicateOpening);
  const removeOpening = useWorkspace((s) => s.removeOpening);
  const [editId, setEditId] = useState<string | null>(null);
  const editing = useMemo(() => project?.openings.find((o) => o.id === editId) ?? null, [project, editId]);
  if (!project) return <div className="mx-auto flex w-full max-w-5xl flex-col gap-3"><p className="kicker">Доборка</p><h1>Откосы проёмов:</h1><p className="text-sm text-muted-foreground">Загрузка объекта…</p></div>;
  const fallback = project.settings.defaultAllowance;
  return (
    <div className="mx-auto flex w-full max-w-full flex-col gap-4 overflow-x-hidden">
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><h1>Откосы проёмов:</h1></div>
          {project.openings.length > 0 ? <Button className="shrink-0" onClick={() => addOpening()}><Plus /> Проём</Button> : null}
        </div>
        <p className="text-sm text-muted-foreground">Размеры проёма и запас на каждый откос.</p>
      </header>
      {project.openings.length === 0 ? (
        <div className="panel-dash px-5 py-12 text-center">
          <p className="font-display text-lg">Нет проёмов</p>
          <p className="mt-1 text-sm text-muted-foreground">Добавьте окно — например 1650 × 2050 мм, запас 100 мм.</p>
          <Button className="mt-4" onClick={() => addOpening({ name: "Окно 1", width: 1650, height: 2050 })}>Добавить 1650×2050</Button>
        </div>
      ) : (
        <ul className="grid w-full min-w-0 gap-3">
          {project.openings.map((o) => {
            const sides = SIDE_KEYS.filter((s) => o.sides[s]);
            return (
              <li key={o.id} className="panel w-full min-w-0 overflow-hidden px-3 pb-3 pt-2">
                <div className="flex items-start justify-between gap-2">
                  <input value={o.name} onChange={(e) => updateOpening(o.id, { name: e.target.value })} className="min-w-0 bg-transparent font-display text-2xl font-medium tracking-tight outline-none" aria-label="Название окна" />
                  <div className="flex gap-1">
                    <Button size="icon-sm" variant="ghost" onClick={() => duplicateOpening(o.id)} aria-label="Копия"><Copy /></Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => removeOpening(o.id)} aria-label="Удалить"><Trash2 /></Button>
                  </div>
                </div>
                <div className="mt-1 flex flex-col items-center">
                  <OpeningEditor opening={o} fallback={fallback} onChange={(patch) => updateOpening(o.id, patch)} onRemove={() => removeOpening(o.id)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
