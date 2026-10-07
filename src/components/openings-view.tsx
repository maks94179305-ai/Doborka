import { useMemo, useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Num } from "@/components/num-field";
import { PhotoStrip } from "@/components/photo-strip";
import { WindowDiagram } from "@/components/window-diagram";
import { mm } from "@/lib/format";
import { slopeLength } from "@/lib/pieces";
import { useProject, useWorkspace } from "@/lib/store";
import { SIDE_KEYS, SIDE_SHORT, type Opening, type SideKey, type SlopeSize } from "@/lib/types";

function OpeningEditor({ opening, fallback, onChange, onRemove }: { opening: Opening; fallback: number; onChange: (patch: Partial<Opening>) => void; onRemove: () => void }) {
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
        <Label className="mb-2 block">Профили откосов</Label>
        <div className="grid gap-3">
          <SlopeProfile size={opening.slopes.left} label="Левый" onChange={(size) => onChange({ slopes: { ...opening.slopes, left: size }, facade: { ...opening.facade, left: size.rise } })} />
          <SlopeProfile size={opening.slopes.right} label="Правый" onChange={(size) => onChange({ slopes: { ...opening.slopes, right: size }, facade: { ...opening.facade, right: size.rise } })} />
          <SlopeProfile size={opening.slopes.top} label="Верхний" onChange={(size) => onChange({ slopes: { ...opening.slopes, top: size }, facade: { ...opening.facade, top: size.rise } })} />
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

function SlopeProfile({ size, label, onChange }: { size: SlopeSize; label: string; onChange?: (size: SlopeSize) => void }) {
  const leg = Math.max(1, size.leg);
  const bottom = Math.max(1, size.bottom);
  const shelf = Math.max(1, size.shelf);
  const rise = Math.max(1, size.rise);
  const top = Math.max(1, size.top);
  const span = Math.max(leg, bottom + shelf, top + 20);
  const s = 120 / span;
  const x0 = 28;
  const y0 = 24;
  const yb = y0 + leg * s;
  const xTail = x0 + bottom * s;
  const xShelf = xTail - shelf * s;
  const yShelf = yb - 6;
  const yTop = yShelf - rise * s;
  const xTop = xShelf + top * s;
  const d = `M${x0} ${y0} V${yb} H${xTail} V${yShelf} H${xShelf} V${yTop} H${xTop}`;
  function set(key: keyof SlopeSize, value: number) { if (onChange) onChange({ ...size, [key]: value }); }
  return (
    <figure className="rounded-xl border border-border bg-[#141816] p-2">
      <figcaption className="mb-1 text-[10px] uppercase tracking-[0.12em] text-steel">{label}</figcaption>
      <svg viewBox="0 0 220 170" className="h-28 w-full"><path d={d} fill="none" stroke="#f3f1ec" strokeWidth="2.2" /></svg>
      <div className="grid grid-cols-5 gap-1">
        <Mini label="Стойка" value={leg} onChange={onChange ? (n) => set("leg", n) : undefined} />
        <Mini label="Низ" value={bottom} onChange={onChange ? (n) => set("bottom", n) : undefined} />
        <Mini label="Полка" value={shelf} onChange={onChange ? (n) => set("shelf", n) : undefined} />
        <Mini label="Толщина" value={rise} onChange={onChange ? (n) => set("rise", n) : undefined} />
        <Mini label="Верх" value={top} onChange={onChange ? (n) => set("top", n) : undefined} />
      </div>
    </figure>
  );
}
function Mini({ label, value, onChange }: { label: string; value: number; onChange?: (n: number) => void }) {
  return <label className="grid gap-0.5 text-center text-[9px] text-steel">{label}<input inputMode="numeric" value={String(value)} readOnly={!onChange} onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, "")); if (onChange && n >= 1) onChange(n); }} className="h-8 rounded-md border border-border bg-background text-center text-xs text-foreground" /></label>;
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
                <div className="mt-2 grid gap-2">
                  <SlopeProfile size={o.slopes.left} label="Слева" />
                  <SlopeProfile size={o.slopes.right} label="Справа" />
                  <SlopeProfile size={o.slopes.top} label="Сверху" />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {sides.map((s) => <Badge key={s} tone="steel">{SIDE_SHORT[s]} {mm(slopeLength(o, s as SideKey, fallback))}</Badge>)}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {editing ? (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-[#161618] px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
          <div className="mx-auto flex max-w-lg items-center justify-between"><h2 className="font-medium text-[#f3f1ec]">{editing.name}</h2><Button type="button" onClick={() => setEditId(null)}>Закрыть</Button></div>
          <div className="mx-auto mt-4 max-w-lg">
            <OpeningEditor opening={editing} fallback={fallback} onChange={(patch) => updateOpening(editing.id, patch)} onRemove={() => { removeOpening(editing.id); setEditId(null); }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
