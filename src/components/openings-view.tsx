import { useMemo, useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Num } from "@/components/num-field";
import { PhotoStrip } from "@/components/photo-strip";
import { SchemeDrawDialog } from "@/components/scheme-draw-dialog";
import { WindowDiagram } from "@/components/window-diagram";
import { mm } from "@/lib/format";
import { slopeLength } from "@/lib/pieces";
import { useProject, useWorkspace } from "@/lib/store";
import { SIDE_KEYS, SIDE_SHORT, type Opening, type SideKey, type SlopeSize } from "@/lib/types";

function OpeningEditor({ opening, fallback, onChange, onRemove, onOpenProfile }: { opening: Opening; fallback: number; onChange: (patch: Partial<Opening>) => void; onRemove: () => void; onOpenProfile: (label: string, thickness: number) => void }) {
  return (
    <div className="grid gap-4">
      <label className="grid gap-1.5">
        <Label>Название</Label>
        <Input value={opening.name} onChange={(e) => onChange({ name: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Num label="Ширина проёма" value={opening.width} onChange={(n) => onChange({ width: n })} />
        <Num label="Высота проёма" value={opening.height} onChange={(n) => onChange({ height: n })} />
        <Num label="Количество" value={opening.qty} suffix="шт" min={1} onChange={(n) => onChange({ qty: n })} />
        <Num label="Запас на элемент" value={opening.allowance ?? fallback} onChange={(n) => onChange({ allowance: n })} />
      </div>
      <div>
        <Label className="mb-2 block">Толщина облицовки фасада</Label>
        <div className="grid grid-cols-3 gap-2">
          <Num label="Слева" value={opening.facade?.left ?? 18} onChange={(n) => onChange({ facade: { left: n, right: opening.facade?.right ?? 18, top: opening.facade?.top ?? 18 } })} />
          <Num label="Справа" value={opening.facade?.right ?? 18} onChange={(n) => onChange({ facade: { left: opening.facade?.left ?? 18, right: n, top: opening.facade?.top ?? 18 } })} />
          <Num label="Сверху" value={opening.facade?.top ?? 18} onChange={(n) => onChange({ facade: { left: opening.facade?.left ?? 18, right: opening.facade?.right ?? 18, top: n } })} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <SlopeProfile thickness={opening.facade?.left ?? 18} label="Левый" onOpen={() => onOpenProfile("Левый", opening.facade?.left ?? 18)} />
          <SlopeProfile thickness={opening.facade?.right ?? 18} label="Правый" onOpen={() => onOpenProfile("Правый", opening.facade?.right ?? 18)} />
          <SlopeProfile thickness={opening.facade?.top ?? 18} label="Верхний" onOpen={() => onOpenProfile("Верхний", opening.facade?.top ?? 18)} />
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
                <span className="tabular text-xs">{on ? mm(len) : "нет"}</span>
              </button>
            );
          })}
        </div>
      </div>
      <WindowDiagram opening={opening} fallbackAllowance={fallback} className="mx-auto h-52 w-full max-w-sm" />
      <div>
        <Label className="mb-2 block">Фото проёма</Label>
        <PhotoStrip ids={opening.photoIds} onChange={(photoIds) => onChange({ photoIds })} />
      </div>
      <label className="grid gap-1.5">
        <Label>Заметка</Label>
        <Input value={opening.note} onChange={(e) => onChange({ note: e.target.value })} />
      </label>
      <Button variant="destructive" onClick={onRemove}><Trash2 /> Удалить проём</Button>
    </div>
  );
}

function profileDrawing(label: string, thickness: number): Drawing {
  const rise = Math.max(1, thickness);
  const segs = [[0,0,0,50],[0,50,40,50],[40,50,40,49],[40,49,20,49],[20,49,20,49-rise],[20,49-rise,70,49-rise]];
  return {
    id: `slope-${label}-${thickness}`,
    name: `${label} · ${thickness} мм`,
    updatedAt: Date.now(),
    objects: segs.map((s, i) => ({ id: `l${i}`, type: "line" as const, x1: s[0], y1: s[1], x2: s[2], y2: s[3], color: "#f3f1ec", width: 2, dash: "solid" as const })),
  };
}
function SlopeProfile({ thickness, label, onOpen }: { thickness: number; label: string; onOpen?: () => void }) {
  const rise = Math.max(1, thickness);
  const s = 1;
  const x0 = 0, y0 = 0;
  const yb = 50 * s, xTail = 40 * s, yHook = yb - s, xShelf = xTail - 20 * s, yTop = yHook - rise * s, xTop = xShelf + 50 * s;
  const pad = 22;
  const minX = x0 - pad, minY = yTop - pad, maxX = xTop + pad, maxY = yb + pad;
  return (
    <button type="button" className="rounded-xl border border-border bg-[#141816] p-2 text-left" onClick={onOpen}>
      <figcaption className="text-center text-[10px] uppercase tracking-[0.12em] text-steel">{label}</figcaption>
      <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} preserveAspectRatio="xMidYMid meet" className="h-40 w-full" aria-label={`${label}, толщина ${thickness}`}>
        <path d={`M${x0} ${y0} V${yb} H${xTail} V${yHook} H${xShelf} V${yTop} H${xTop}`} fill="none" stroke="#f3f1ec" strokeWidth="1.6" />
        <Dim x1={x0} y1={y0} x2={x0} y2={yb} dx={-8} dy={0} text="50" />
        <Dim x1={x0} y1={yb} x2={xTail} y2={yb} dx={0} dy={8} text="40" />
        <Dim x1={xShelf} y1={yHook} x2={xTail} y2={yHook} dx={0} dy={-6} text="20" />
        <Dim x1={xShelf} y1={yTop} x2={xShelf} y2={yHook} dx={-8} dy={0} text={String(thickness)} />
        <Dim x1={xShelf} y1={yTop} x2={xTop} y2={yTop} dx={0} dy={-7} text="50" />
      </svg>
    </button>
  );
}
function Dim({ x1, y1, x2, y2, dx, dy, text }: { x1: number; y1: number; x2: number; y2: number; dx: number; dy: number; text: string }) {
  return (
    <g fill="none" stroke="#c46a45" strokeWidth="0.6" strokeDasharray="1.5 1">
      <path d={`M${x1} ${y1} L${x1 + dx} ${y1 + dy} M${x2} ${y2} L${x2 + dx} ${y2 + dy} M${x1 + dx} ${y1 + dy} L${x2 + dx} ${y2 + dy}`} />
      <text x={(x1 + x2) / 2 + dx} y={(y1 + y2) / 2 + dy - 1.5} fill="#f3f1ec" stroke="none" fontSize="5" textAnchor="middle" fontFamily="IBM Plex Mono, monospace">{text}</text>
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
  const [draft, setDraft] = useState<Drawing | null>(null);
  const patch = useWorkspace((s) => s.patchProject);
  function openProfile(opening: Opening, label: string) {
    const thickness = label === "Слева" ? opening.facade?.left ?? 18 : label === "Справа" ? opening.facade?.right ?? 18 : opening.facade?.top ?? 18;
    setDraft(profileDrawing(`${opening.name} · ${label}`, thickness));
  }
  const editing = useMemo(() => project?.openings.find((o) => o.id === editId) ?? null, [project, editId]);
  if (!project) return <div className="mx-auto flex w-full max-w-5xl flex-col gap-3"><p className="kicker">Доборка</p><h1>Откосы проёмов:</h1><p className="text-sm text-muted-foreground">Загрузка объекта…</p></div>;
  const fallback = project.settings.defaultAllowance;
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
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
        <ul className="grid gap-3 sm:grid-cols-2">
          {project.openings.map((o) => {
            const sides = SIDE_KEYS.filter((s) => o.sides[s]);
            return (
              <li key={o.id} className="panel p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-medium">{o.name}</h2>
                    <p className="tabular text-sm text-muted-foreground">{o.width}×{o.height} мм · {o.qty} шт</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon-sm" variant="ghost" onClick={() => setEditId(o.id)} aria-label="Править"><Pencil /></Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => duplicateOpening(o.id)} aria-label="Копия"><Copy /></Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => removeOpening(o.id)} aria-label="Удалить"><Trash2 /></Button>
                  </div>
                </div>
                <WindowDiagram opening={o} fallbackAllowance={fallback} className="mt-3 h-48 w-full" />
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <SlopeProfile thickness={o.facade?.left ?? 18} label="Слева" onOpen={() => openProfile(o, "Слева")} />
                  <SlopeProfile thickness={o.facade?.right ?? 18} label="Справа" onOpen={() => openProfile(o, "Справа")} />
                  <SlopeProfile thickness={o.facade?.top ?? 18} label="Сверху" onOpen={() => openProfile(o, "Сверху")} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {sides.map((s) => <Badge key={s} tone="steel">{SIDE_SHORT[s]} {mm(slopeLength(o, s as SideKey, fallback))}</Badge>)}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {draft ? <SchemeDrawDialog open title={draft.name} drawing={draft} onOpenChange={(v) => { if (!v) setDraft(null); }} onDone={(d) => { patch((p) => ({ ...p, drawings: [...p.drawings.filter((x) => x.id !== d.id), d] })); setDraft(null); }} /> : null}
      {editing ? (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-[#161618] px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
          <div className="mx-auto flex max-w-lg items-center justify-between"><h2 className="font-medium text-[#f3f1ec]">{editing.name}</h2><Button type="button" onClick={() => setEditId(null)}>Закрыть</Button></div>
          <div className="mx-auto mt-4 max-w-lg">
            <OpeningEditor opening={editing} fallback={fallback} onChange={(patch) => updateOpening(editing.id, patch)} onRemove={() => { removeOpening(editing.id); setEditId(null); }} onOpenProfile={(label, thickness) => { setDraft(profileDrawing(label, thickness)); }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
