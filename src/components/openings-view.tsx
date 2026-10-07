import { useMemo, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Num } from "@/components/num-field";
import { WindowDiagram } from "@/components/window-diagram";
import { mm } from "@/lib/format";
import { slopeLength } from "@/lib/pieces";
import { useProject, useWorkspace } from "@/lib/store";
import { SIDE_KEYS, SIDE_SHORT, type Opening, type SideKey, type SlopeSize } from "@/lib/types";

function OpeningEditor({ opening, fallback, onChange, onRemove }: { opening: Opening; fallback: number; onChange: (patch: Partial<Opening>) => void; onRemove: () => void }) {
  return (
    <div className="grid gap-4">
      <WindowDiagram opening={opening} fallbackAllowance={fallback} className="mx-auto h-64 w-full max-w-sm" onWidth={(n) => onChange({ width: n })} onHeight={(n) => onChange({ height: n })} />
      <Num label="Запас на элемент" value={opening.allowance ?? fallback} onChange={(n) => onChange({ allowance: n })} />
      <div>
        <Label className="mb-2 block">Толщина облицовки фасада</Label>
        <div className="grid grid-cols-3 gap-2">
          <Num label="Слева" value={opening.facade?.left ?? 18} onChange={(n) => onChange({ facade: { left: n, right: opening.facade?.right ?? 18, top: opening.facade?.top ?? 18 } })} />
          <Num label="Справа" value={opening.facade?.right ?? 18} onChange={(n) => onChange({ facade: { left: opening.facade?.left ?? 18, right: n, top: opening.facade?.top ?? 18 } })} />
          <Num label="Сверху" value={opening.facade?.top ?? 18} onChange={(n) => onChange({ facade: { left: opening.facade?.left ?? 18, right: opening.facade?.right ?? 18, top: n } })} />
        </div>
        <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-3 gap-2">
          <SlopeProfile thickness={opening.facade?.left ?? 18} label="Левый" />
          <SlopeProfile thickness={opening.facade?.right ?? 18} label="Правый" />
          <SlopeProfile thickness={opening.facade?.top ?? 18} label="Верхний" />
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

function SlopeProfile({ thickness, label }: { thickness: number; label: string }) {
  const rise = Math.max(1, thickness);
  const x0 = 36, y0 = 28;
  const yb = y0 + 50;
  const xTail = x0 + 40;
  const yHook = yb - 1;
  const xShelf = xTail - 20;
  const yTop = yHook - rise;
  const xTop = xShelf + 50;
  const minX = x0 - 28, minY = yTop - 24, maxX = xTop + 16, maxY = yb + 24;
  const line = `M${x0} ${y0} V${yb} H${xTail} V${yHook} H${xShelf} V${yTop} H${xTop}`;
  return (
    <figure className="mx-auto w-full rounded-xl border border-border bg-[#141816] p-1.5">
      <figcaption className="text-center text-[10px] uppercase tracking-[0.12em] text-steel">{label}</figcaption>
      <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} preserveAspectRatio="xMidYMid meet" className="mx-auto mt-1 block h-auto w-full" aria-label={`${label}, толщина ${thickness}`}>
        <path d={line} fill="none" stroke="#f3f1ec" strokeWidth="1.6" />
        <Dim x1={x0} y1={y0} x2={x0} y2={yb} dx={-15} dy={0} text="50" />
        <Dim x1={x0} y1={yb} x2={xTail} y2={yb} dx={0} dy={15} text="40" />
        <Dim x1={xShelf} y1={yHook} x2={xTail} y2={yHook} dx={0} dy={-15} text="20" />
        <Dim x1={xShelf} y1={yTop} x2={xShelf} y2={yHook} dx={-15} dy={0} text={String(thickness)} />
        <Dim x1={xShelf} y1={yTop} x2={xTop} y2={yTop} dx={0} dy={-15} text="50" />
      </svg>
    </figure>
  );
}
function Dim({ x1, y1, x2, y2, dx, dy, text }: { x1: number; y1: number; x2: number; y2: number; dx: number; dy: number; text: string }) {
  return (
    <g fill="none" stroke="#c46a45" strokeWidth="1" strokeDasharray="3 2">
      <path d={`M${x1} ${y1} L${x1 + dx} ${y1 + dy} M${x2} ${y2} L${x2 + dx} ${y2 + dy} M${x1 + dx} ${y1 + dy} L${x2 + dx} ${y2 + dy}`} />
      <text x={(x1 + x2) / 2 + dx} y={(y1 + y2) / 2 + dy - 4} fill="#f3f1ec" stroke="none" fontSize="8" textAnchor="middle" fontFamily="IBM Plex Mono, monospace">{text}</text>
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
                  <input value={o.name} onChange={(e) => updateOpening(o.id, { name: e.target.value })} className="min-w-0 bg-transparent font-display text-2xl font-medium tracking-tight outline-none" aria-label="Название окна" />
                  <div className="flex gap-1">
                    <Button size="icon-sm" variant="ghost" onClick={() => duplicateOpening(o.id)} aria-label="Копия"><Copy /></Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => removeOpening(o.id)} aria-label="Удалить"><Trash2 /></Button>
                  </div>
                </div>
                <div className="mt-4">
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
