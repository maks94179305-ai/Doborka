import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Num } from "@/components/num-field";
import { PhotoStrip } from "@/components/photo-strip";
import { SchemeDrawDialog } from "@/components/scheme-draw-dialog";
import { mm } from "@/lib/format";
import { deletePhoto, savePhoto } from "@/lib/photos";
import { renderDrawingToBlob } from "@/lib/draw-render";
import { schemeIdsOf, profileColorOf } from "@/lib/pieces";
import { useProject, useWorkspace } from "@/lib/store";
import { EXTRA_PRESETS, extraPreset, profileColorName, type Drawing, type ExtraItem, type ExtraKind } from "@/lib/types";
import { uid } from "@/lib/utils";

function schemeKey(extraId: string) { return `extra:${extraId}`; }

export function ExtrasView() {
  const project = useProject();
  const addExtra = useWorkspace((s) => s.addExtra);
  const updateExtra = useWorkspace((s) => s.updateExtra);
  const removeExtra = useWorkspace((s) => s.removeExtra);
  const [open, setOpen] = useState(false);
  if (!project) return null;
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="kicker">Добор</p>
            <h1 className="flex flex-col leading-[1.15]"><span>Другие</span><span>элементы</span></h1>
          </div>
          <Button className="shrink-0" onClick={() => setOpen(true)}><Plus /> Элемент</Button>
        </div>
        <p className="text-sm text-muted-foreground">Углы, отливы, наличники и свои позиции — попадут в тот же раскрой хлыстов.</p>
      </header>
      {project.extras.length === 0 ? (
        <div className="panel-dash px-5 py-12 text-center">
          <p className="font-display text-lg">Пока нет элементов</p>
          <p className="mt-1 text-sm text-muted-foreground">Можно добавить сложный внешний или внутренний угол.</p>
          <Button className="mt-4" variant="secondary" onClick={() => setOpen(true)}><Plus /> Добавить</Button>
        </div>
      ) : (
        <ul className="grid gap-3">{project.extras.map((e) => <li key={e.id}><ExtraCard extra={e} onChange={(patch) => updateExtra(e.id, patch)} onRemove={() => removeExtra(e.id)} /></li>)}</ul>
      )}
      {open ? (
        <section className="panel space-y-2 p-4">
          <div className="flex items-center justify-between"><h2 className="font-medium">Добавить элемент</h2><Button type="button" onClick={() => setOpen(false)}>Закрыть</Button></div>
          {EXTRA_PRESETS.map((p) => (
            <button key={p.kind} type="button" className="w-full rounded-xl border border-border bg-background/50 px-3 py-3 text-left hover:bg-accent" onClick={() => { const kind = p.kind as ExtraKind; addExtra({ kind, name: extraPreset(kind).name, length: p.defaultLength || 1000, qty: 1 }); setOpen(false); }}>
              <span className="block font-medium">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.hint}</span>
            </button>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function ExtraCard({ extra, onChange, onRemove }: { extra: ExtraItem; onChange: (patch: Partial<ExtraItem>) => void; onRemove: () => void }) {
  const project = useProject();
  const patch = useWorkspace((s) => s.patchProject);
  const setSchemeIds = useWorkspace((s) => s.setSchemeIds);
  const key = schemeKey(extra.id);
  const schemeIds = project ? schemeIdsOf(project, key) : [];
  const [drawOpen, setDrawOpen] = useState(false);
  const [draft, setDraft] = useState<Drawing | null>(null);
  const savedDrawing = project?.drawings.find((d) => d.id === project.schemeDrawings?.[key]);
  const hasDrawing = !!savedDrawing && savedDrawing.objects.length > 0 && !!savedDrawing.previewPhotoId && schemeIds.includes(savedDrawing.previewPhotoId);
  function openBlank() { setDraft({ id: uid("dr"), name: `Схема · ${extra.name}`, objects: [], updatedAt: Date.now() }); setDrawOpen(true); }
  function editDrawing() {
    if (!savedDrawing) { openBlank(); return; }
    setDraft({ ...savedDrawing, objects: savedDrawing.objects.map((o) => ({ ...o })), view: savedDrawing.view ? { ...savedDrawing.view } : undefined });
    setDrawOpen(true);
  }
  function openExisting(photoId: string) {
    const drawings = project?.drawings ?? [];
    const linked = drawings.find((d) => d.previewPhotoId === photoId);
    const source = linked ?? savedDrawing;
    setDraft(source ? { ...source, objects: source.objects.map((o) => ({ ...o })), view: source.view ? { ...source.view } : undefined } : { id: uid("dr"), name: `Схема · ${extra.name}`, objects: [], updatedAt: Date.now() });
    setDrawOpen(true);
  }
  async function persistDraw(next: Drawing) {
    if (next.objects.length === 0) return;
    const blob = await renderDrawingToBlob(next);
    if (!blob) return;
    const photoId = uid("ph");
    await savePhoto(photoId, blob);
    const prevId = project?.schemeDrawings?.[key];
    const prevPhoto = project?.drawings.find((d) => d.id === prevId)?.previewPhotoId;
    if (prevPhoto) void deletePhoto(prevPhoto);
    patch((p) => {
      let ids = [...(p.schemes?.[key] ?? [])];
      if (prevPhoto) ids = ids.filter((id) => id !== prevPhoto);
      ids.push(photoId);
      const drawings = p.drawings.filter((d) => d.id !== prevId && d.id !== next.id);
      drawings.push({ ...next, previewPhotoId: photoId });
      return { ...p, drawings, schemeDrawings: { ...(p.schemeDrawings ?? {}), [key]: next.id }, schemes: { ...(p.schemes ?? {}), [key]: ids } };
    });
  }
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-2">
        <div><p className="font-medium">{extra.name}</p><p className="tabular text-sm text-muted-foreground">{mm(extra.length)} · {extra.qty} шт</p></div>
        <Button size="icon-sm" variant="ghost" onClick={onRemove} aria-label="Удалить"><Trash2 /></Button>
      </div>
      <label className="mt-3 grid gap-1.5"><Label>Название</Label><Input value={extra.name} onChange={(ev) => onChange({ name: ev.target.value })} /></label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Num label="Длина" value={extra.length} onChange={(n) => onChange({ length: n })} />
        <Num label="Кол-во" value={extra.qty} suffix="шт" min={1} onChange={(n) => onChange({ qty: n })} />
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-steel">Чертёж</p>
        <PhotoStrip ids={schemeIds} onChange={(ids) => setSchemeIds(key, ids)} variant="scheme" extraActions={<Button type="button" variant="outline" className="h-11" onClick={hasDrawing ? editDrawing : openBlank}><Pencil /> {hasDrawing ? "Редактировать" : "Начертить"}</Button>} shareCard={project ? { heading: "Схема", title: extra.name, color: profileColorOf(project, key), colorName: profileColorName(profileColorOf(project, key)), bars: [], totalBars: 0 } : undefined} onEdit={openExisting} />
      </div>
      {draft ? <SchemeDrawDialog open={drawOpen} title={extra.name} drawing={draft} onOpenChange={setDrawOpen} onDone={(d) => { void persistDraw(d); }} /> : null}
    </article>
  );
}
