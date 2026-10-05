import { useMemo, useState } from "react";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Num } from "@/components/num-field";
import { PhotoStrip } from "@/components/photo-strip";
import { SchemeDrawDialog } from "@/components/scheme-draw-dialog";
import { mm } from "@/lib/format";
import { plansByMaterial } from "@/lib/cutting";
import { collectPieces } from "@/lib/pieces";
import { deletePhoto, savePhoto } from "@/lib/photos";
import { renderDrawingToBlob } from "@/lib/draw-render";
import { schemeIdsOf, profileColorOf } from "@/lib/pieces";
import { useProject, useWorkspace } from "@/lib/store";
import { EXTRA_PRESETS, extraPreset, PROFILE_COLORS, profileCanonicalHex, profileChipSide, profileColorName, profileFinish, profileId, profileTexture, type Drawing, type ExtraItem, type ExtraKind } from "@/lib/types";
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
          {project.extras.length > 0 ? <Button className="shrink-0" onClick={() => setOpen(true)}><Plus /> Элемент</Button> : null}
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


function extraShare(extra: ExtraItem, project: NonNullable<ReturnType<typeof useProject>>) {
  const key = schemeKey(extra.id);
  const plan = plansByMaterial(collectPieces(project).filter((piece) => piece.extraId === extra.id), project.settings.stockLengths, project.settings.kerf, project.settings.minRemainder, project.settings.strategy)[0]?.plan;
  const color = profileColorOf(project, key);
  return { heading: "Схема", title: extra.name, color, colorName: profileColorName(color), note: project.profileNotes?.[key] ?? "", bars: plan?.barCounts ?? [], totalBars: plan?.bars.length ?? 0 };
}
function ExtraOrder({ extra, project }: { extra: ExtraItem; project: NonNullable<ReturnType<typeof useProject>> }) {
  const card = extraShare(extra, project);
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="font-medium">{card.title}</p>
      <p className="text-sm text-muted-foreground">{card.colorName} · {card.totalBars} хлыст.</p>
      {card.bars.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Нет хлыстов в заказе.</p> : <ul className="mt-2 space-y-1">{card.bars.map((c) => <li key={c.length} className="flex justify-between text-sm"><span>{mm(c.length)}</span><span>× {c.count}</span></li>)}</ul>}
    </div>
  );
}

function QtyField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);
  function commit(text: string) {
    const n = Number(text.replace(/\D/g, ""));
    onChange(Number.isFinite(n) && n >= 1 ? n : 1);
    setDraft(null);
  }
  return (
    <div className="grid gap-1.5">
      <Label>Кол-во</Label>
      <div className="flex h-11 items-center gap-1">
        <Button type="button" size="icon-sm" variant="secondary" aria-label="Меньше" onClick={() => { setDraft(null); onChange(Math.max(1, value - 1)); }}><Minus /></Button>
        <Input className="h-11 min-w-0 flex-1 text-center tabular" inputMode="numeric" value={shown} onChange={(ev) => setDraft(ev.target.value.replace(/\D/g, ""))} onBlur={() => commit(shown)} onKeyDown={(ev) => { if (ev.key === "Enter") ev.currentTarget.blur(); }} />
        <Button type="button" size="icon-sm" variant="secondary" aria-label="Больше" onClick={() => { setDraft(null); onChange(value + 1); }}><Plus /></Button>
      </div>
    </div>
  );
}

function ElementPalette({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROFILE_COLORS.map((c) => {
        const on = profileCanonicalHex(c.hex).toLowerCase() === profileCanonicalHex(value).toLowerCase();
        return (
          <button key={c.id} type="button" title={c.name} aria-label={c.name} onClick={() => onChange(c.hex)} className={`flex w-[5.6rem] flex-col items-center gap-1 rounded-xl px-1 py-1.5 ${on ? "bg-accent ring-2 ring-steel" : ""}`}>
            <PaletteChip hex={c.hex} />
            <span className="text-center text-[11px] leading-tight">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}
function PaletteChip({ hex }: { hex: string }) {
  const texture = profileTexture(hex);
  const gloss = profileFinish(hex) === "gloss";
  const matte = profileFinish(hex) === "matte";
  return <span className="inline-block h-9 w-10 rounded-md border border-border" style={{ background: texture ? `url(${texture}) center/cover` : hex, boxShadow: `3px 4px 0 ${profileChipSide(hex)}`, filter: gloss ? "saturate(1.1)" : matte ? "contrast(0.92)" : undefined }} />;
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
        <QtyField value={extra.qty} onChange={(n) => onChange({ qty: n })} />
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-steel">Чертёж</p>
        <div className={hasDrawing ? "grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_auto]" : ""}>
          <PhotoStrip ids={schemeIds} onChange={(ids) => setSchemeIds(key, ids)} variant="scheme" extraActions={<Button type="button" variant="outline" className="h-11" onClick={hasDrawing ? editDrawing : openBlank}><Pencil /> {hasDrawing ? "Редактировать" : "Начертить"}</Button>} previewAside={project ? <ExtraOrder extra={extra} project={project} /> : undefined} shareCard={project ? extraShare(extra, project) : undefined} onEdit={openExisting} />
          {hasDrawing && project ? <ElementPalette value={profileColorOf(project, key)} onChange={(hex) => useWorkspace.getState().setProfileColor(key, hex)} /> : null}
        </div>
      </div>
      {draft ? <SchemeDrawDialog open={drawOpen} title={extra.name} drawing={draft} onOpenChange={setDrawOpen} onDone={(d) => { void persistDraw(d); }} /> : null}
    </article>
  );
}
