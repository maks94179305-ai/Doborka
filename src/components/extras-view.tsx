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
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-3 sm:items-center"
          onPointerDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <section
            className="max-h-[min(70vh,32rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-float"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-medium">Добавить элемент</h2>
              <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>Закрыть</Button>
            </div>
            <div className="space-y-2">
              {EXTRA_PRESETS.map((p) => (
                <button
                  key={p.kind}
                  type="button"
                  className="w-full rounded-xl border border-border bg-background/50 px-3 py-3 text-left hover:bg-accent active:bg-accent"
                  onClick={() => {
                    const kind = p.kind as ExtraKind;
                    addExtra({ kind, name: extraPreset(kind).name, length: p.defaultLength || 1000, qty: 1 });
                    setOpen(false);
                  }}
                >
                  <span className="block font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.hint}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
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

function ExtraCard({ extra, onChange, onRemove }: { extra: ExtraItem; onChange: (patch: Partial<ExtraItem>) => void; onRemove: () => void }) {
  const project = useProject();
  const setSchemeIds = useWorkspace((s) => s.setSchemeIds);
  const setProfileColor = useWorkspace((s) => s.setProfileColor);
  const setProfileNote = useWorkspace((s) => s.setProfileNote);
  const key = schemeKey(extra.id);
  const schemeIds = schemeIdsOf(project!, key);
  const color = profileColorOf(project!, key);
  const note = project?.profileNotes?.[key] ?? "";
  const [drawOpen, setDrawOpen] = useState(false);
  const [draft, setDraft] = useState<Drawing | null>(null);
  const drawing = useMemo(() => project?.drawings.find((d) => d.id === project.schemeDrawings?.[key]) ?? null, [project, key]);
  return (
    <article className="panel space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <Input value={extra.name} onChange={(e) => onChange({ name: e.target.value })} aria-label="Название" />
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Длина, мм</Label><Num value={extra.length} min={0} onChange={(n) => onChange({ length: n })} /></div>
            <div><Label>Кол-во</Label><Num value={extra.qty} min={1} onChange={(n) => onChange({ qty: n })} /></div>
          </div>
        </div>
        <Button size="icon-sm" variant="secondary" onClick={onRemove} aria-label="Удалить"><Trash2 /></Button>
      </div>
      <PhotoStrip ids={schemeIds} onChange={(ids) => setSchemeIds(key, ids)} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => { setDraft(drawing ?? { id: uid("dr"), name: extra.name, objects: [], updatedAt: Date.now() }); setDrawOpen(true); }}><Pencil /> Чертёж</Button>
      </div>
      {project ? <ExtraOrder extra={extra} project={project} /> : null}
      {drawOpen && draft ? <SchemeDrawDialog open={drawOpen} title={extra.name} drawing={draft} onOpenChange={setDrawOpen} onDone={(d) => { void (async () => {
        const blob = await renderDrawingToBlob(d, { w: 720, h: 480 });
        let photoId = d.previewPhotoId;
        if (blob) { photoId = photoId || uid("ph"); await savePhoto(photoId, new File([blob], "scheme.png", { type: "image/png" })); }
        useWorkspace.getState().patchProject((p) => {
          const drawings = p.drawings.some((x) => x.id === d.id) ? p.drawings.map((x) => x.id === d.id ? { ...d, previewPhotoId: photoId } : x) : [...p.drawings, { ...d, previewPhotoId: photoId }];
          return { ...p, drawings, schemeDrawings: { ...p.schemeDrawings, [key]: d.id }, schemes: { ...p.schemes, [key]: photoId ? [photoId] : schemeIds } };
        });
        setDrawOpen(false);
      })(); }} /> : null}
    </article>
  );
}
