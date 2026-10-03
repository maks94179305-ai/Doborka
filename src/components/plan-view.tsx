import { useId, useMemo, useState } from "react";
import { Download, Pencil, Printer, Trash2 } from "lucide-react";
import { BarScheme } from "@/components/bar-scheme";
import { SchemeDrawDialog } from "@/components/scheme-draw-dialog";
import { PhotoStrip } from "@/components/photo-strip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mergePlans, plansByMaterial, type MaterialPlan } from "@/lib/cutting";
import { renderDrawingToBlob } from "@/lib/draw-render";
import { meters, mm, pct } from "@/lib/format";
import { deletePhoto, savePhoto } from "@/lib/photos";
import { collectPieces, profileColorOf, schemeIdsOf } from "@/lib/pieces";
import { buildReportHtml, downloadText } from "@/lib/report";
import { useProject, useWorkspace } from "@/lib/store";
import { PROFILE_COLORS, profileCanonicalHex, profileChipSide, profileColorName, profileFinish, profileId, profileSwatchBg, profileTexture, type Drawing } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

export function PlanView() {
  const project = useProject();
  const setSchemeIds = useWorkspace((s) => s.setSchemeIds);
  const setProfileColor = useWorkspace((s) => s.setProfileColor);
  const setProfileNote = useWorkspace((s) => s.setProfileNote);
  const pieces = useMemo(() => (project ? collectPieces(project) : []), [project]);
  const materials = useMemo(() => {
    if (!project) return [];
    return plansByMaterial(pieces, project.settings.stockLengths, project.settings.kerf, project.settings.minRemainder, project.settings.strategy);
  }, [project, pieces]);
  const plan = useMemo(() => mergePlans(materials.map((m) => m.plan)), [materials]);
  if (!project) return null;
  const tooLong = plan.unplaced;
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="min-w-0">
          <p className="kicker">Раскрой</p>
          <h1>Хлысты и схема</h1>
          <p className="mt-1 text-sm text-muted-foreground">Каждый профиль — отдельная позиция заказа. Угол не режется из откоса.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => downloadText(`doborka-${project.name}.html`, buildReportHtml(project, plan, materials), "text/html;charset=utf-8")}><Download /> Отчёт для ПК</Button>
          <Button variant="outline" className="no-print" onClick={() => window.print()}><Printer /> Печать</Button>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Заказать" value={meters(plan.totalMm)} />
        <Stat label="В дело" value={meters(plan.usedMm)} />
        <Stat label="Отход" value={pct(plan.wastePercent)} tone={plan.wastePercent < 8 ? "ok" : "waste"} />
        <Stat label="Хлыстов" value={String(plan.bars.length)} />
      </section>
      <section className="space-y-3">
        <div>
          <h2 className="font-display text-base">Состав заказа</h2>
          <p className="mt-1 text-sm text-muted-foreground">Позиции по типу профиля. Цвет и схема — в карточке.</p>
        </div>
        {materials.length === 0 ? (
          <div className="panel-dash px-5 py-10 text-center text-sm text-muted-foreground">Добавьте проёмы — появится заказ по элементам.</div>
        ) : (
          <ul className="grid gap-8">
            {materials.map((m, i) => (
              <li key={m.key} className="grid gap-3">
                {i > 0 ? <div className="cut-rule" role="separator" aria-hidden /> : null}
                <OrderLine material={m} schemeIds={schemeIdsOf(project, m.key)} color={profileColorOf(project, m.key)} note={project.profileNotes?.[m.key] ?? ""} onSchemeChange={(ids) => setSchemeIds(m.key, ids)} onColorChange={(hex) => setProfileColor(m.key, hex)} onNoteChange={(note) => setProfileNote(m.key, note)} />
                {m.plan.bars.length > 0 ? (
                  <div className="grid min-w-0 gap-3">
                    <h2 className="font-display text-base">Раскрой · {m.title}</h2>
                    {m.plan.bars.map((b) => {
                      const global = plan.pieceToBar[b.cuts[0]?.pieceId] ?? b.index;
                      return <BarScheme key={b.id} bar={{ ...b, index: global }} />;
                    })}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      {tooLong.length > 0 ? (
        <section className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="font-medium">Не помещаются в выбранные хлысты</p>
          <ul className="mt-2 space-y-1">{tooLong.map((p) => <li key={p.id}>{p.label} — {mm(p.length)}</li>)}</ul>
        </section>
      ) : null}
    </div>
  );
}

function OrderLine({ material, schemeIds, color, note, onSchemeChange, onColorChange, onNoteChange }: { material: MaterialPlan; schemeIds: string[]; color: string; note: string; onSchemeChange: (ids: string[]) => void; onColorChange: (hex: string) => void; onNoteChange: (note: string) => void }) {
  const project = useProject();
  const patch = useWorkspace((s) => s.patchProject);
  const { plan, pieces, title } = material;
  const [drawOpen, setDrawOpen] = useState(false);
  const [draft, setDraft] = useState<Drawing | null>(null);
  const colorName = profileColorName(color);
  const savedDrawing = project?.drawings.find((d) => d.id === project.schemeDrawings?.[material.key]);
  const hasDrawing = !!savedDrawing && savedDrawing.objects.length > 0 && !!savedDrawing.previewPhotoId && schemeIds.includes(savedDrawing.previewPhotoId);
  function removeLine() {
    const extraIds = new Set(pieces.map((p) => p.extraId).filter((id): id is string => !!id));
    const openingIds = new Set(pieces.map((p) => p.openingId).filter((id): id is string => !!id));
    const key = material.key;
    const drawingId = project?.schemeDrawings?.[key];
    const drawing = project?.drawings.find((d) => d.id === drawingId);
    const photoIds = new Set(schemeIds);
    if (drawing?.previewPhotoId) photoIds.add(drawing.previewPhotoId);
    for (const id of photoIds) void deletePhoto(id);
    setDrawOpen(false);
    patch((p) => {
      const schemes = { ...(p.schemes ?? {}) };
      const schemeDrawings = { ...(p.schemeDrawings ?? {}) };
      const profileColors = { ...(p.profileColors ?? {}) };
      const profileNotes = { ...(p.profileNotes ?? {}) };
      delete schemes[key]; delete schemeDrawings[key]; delete profileColors[key]; delete profileNotes[key];
      return { ...p, openings: openingIds.size ? p.openings.filter((o) => !openingIds.has(o.id)) : p.openings, extras: extraIds.size ? p.extras.filter((e) => !extraIds.has(e.id)) : p.extras, drawings: drawingId ? p.drawings.filter((d) => d.id !== drawingId) : p.drawings, schemes, schemeDrawings, profileColors, profileNotes };
    });
  }
  function openBlank() { setDraft({ id: uid("dr"), name: `Схема · ${title}`, objects: [], updatedAt: Date.now() }); setDrawOpen(true); }
  function editDrawing() {
    if (!savedDrawing) { openBlank(); return; }
    setDraft({ ...savedDrawing, objects: savedDrawing.objects.map((o) => ({ ...o })), view: savedDrawing.view ? { ...savedDrawing.view } : undefined });
    setDrawOpen(true);
  }
  function openExisting(photoId: string) {
    const drawings = project?.drawings ?? [];
    const linked = drawings.find((d) => d.previewPhotoId === photoId);
    const currentId = project?.schemeDrawings?.[material.key];
    const current = drawings.find((d) => d.id === currentId);
    const source = linked ?? current;
    setDraft(source ? { ...source, objects: source.objects.map((o) => ({ ...o })), view: source.view ? { ...source.view } : undefined } : { id: uid("dr"), name: `Схема · ${title}`, objects: [], updatedAt: Date.now() });
    setDrawOpen(true);
  }
  async function persistDraw(next: Drawing) {
    if (next.objects.length === 0) return;
    const blob = await renderDrawingToBlob(next);
    if (!blob) return;
    const photoId = uid("ph");
    await savePhoto(photoId, blob);
    const prevId = project?.schemeDrawings?.[material.key];
    const prevPhoto = project?.drawings.find((d) => d.id === prevId)?.previewPhotoId;
    if (prevPhoto) void deletePhoto(prevPhoto);
    patch((p) => {
      let ids = [...(p.schemes?.[material.key] ?? [])];
      if (prevPhoto) ids = ids.filter((id) => id !== prevPhoto);
      ids.push(photoId);
      const drawings = p.drawings.filter((d) => d.id !== prevId && d.id !== next.id);
      drawings.push({ ...next, previewPhotoId: photoId });
      return { ...p, drawings, schemeDrawings: { ...(p.schemeDrawings ?? {}), [material.key]: next.id }, schemes: { ...(p.schemes ?? {}), [material.key]: ids } };
    });
  }
  return (
    <article className="panel min-w-0 overflow-hidden p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-base font-medium">{title}</h3>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground"><ColorChip hex={color} size="sm" /> Цвет {colorName} · {pieces.length} шт · {meters(plan.totalMm)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone="steel">{plan.bars.length} хлыст.</Badge>
          <Button type="button" size="icon-sm" variant="ghost" onClick={removeLine} aria-label="Удалить позицию"><Trash2 /></Button>
        </div>
      </header>
      {plan.barCounts.length > 0 ? <ul className="mt-3 flex flex-wrap gap-2">{plan.barCounts.map((c) => <li key={c.length}><Badge className="whitespace-nowrap">{mm(c.length)} × {c.count}</Badge></li>)}</ul> : null}
      <div className="mt-4"><p className="mb-2 text-xs uppercase tracking-[0.14em] text-steel">Цвет профиля</p><ProfileColorPicker value={color} onChange={onColorChange} /></div>
      <label className="mt-4 block"><span className="mb-1 block text-xs uppercase tracking-[0.14em] text-steel">Комментарий</span><textarea value={note} onChange={(e) => onNoteChange(e.target.value)} rows={2} maxLength={400} placeholder="Заметка к этой позиции" className="w-full resize-y rounded-xl border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-steel" /></label>
      {plan.remainderMm > 0 ? <p className="mt-3 text-sm text-muted-foreground">Пригодный остаток: {mm(plan.remainderMm)}</p> : null}
      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-steel">Схема профиля</p>
        <PhotoStrip ids={schemeIds} onChange={onSchemeChange} variant="scheme" extraActions={<Button type="button" variant="outline" className="h-11" onClick={hasDrawing ? editDrawing : openBlank}><Pencil /> {hasDrawing ? "Редактировать" : "Начертить"}</Button>} previewAside={<BarOrderPanel title={title} color={color} colorName={colorName} note={note} barCounts={plan.barCounts} totalBars={plan.bars.length} />} shareCard={{ heading: "Схема", title, color, colorName, note, bars: plan.barCounts, totalBars: plan.bars.length }} onEdit={openExisting} />
      </div>
      {draft ? <SchemeDrawDialog open={drawOpen} title={title} drawing={draft} onOpenChange={setDrawOpen} onDone={(d) => { void persistDraw(d); }} /> : null}
    </article>
  );
}

function ColorChip({ hex, size = "md" }: { hex: string; size?: "sm" | "md" }) {
  const uid = useId().replace(/:/g, "");
  const matte = profileFinish(hex) === "matte";
  const gloss = profileFinish(hex) === "gloss";
  const graphiteGloss = profileId(hex) === "graphite-gloss";
  const texture = profileTexture(hex);
  const sm = size === "sm";
  const gid = `chip-${uid}`;
  const px = sm ? 20 : 32;
  return (
    <span className={cn("relative inline-block shrink-0", sm ? "h-5 w-[1.4rem]" : "h-9 w-10")} aria-hidden>
      <svg viewBox="0 0 32 32" width={px} height={px} className="block overflow-visible" style={{ filter: sm ? `drop-shadow(2px 2px 0 ${profileChipSide(hex)})` : `drop-shadow(3px 4px 0 ${profileChipSide(hex)}) drop-shadow(5px 7px 8px rgba(0,0,0,0.35))` }}>
        <defs>
          <pattern id={`${gid}-grain`} width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill={hex} /><rect width="1" height="1" fill="#000" opacity="0.12" /><rect x="2" y="1" width="1" height="1" fill="#fff" opacity="0.05" /></pattern>
          {texture ? <pattern id={`${gid}-tex`} width="32" height="32" patternUnits="userSpaceOnUse"><image href={texture} width="32" height="32" preserveAspectRatio="xMinYMid slice" /></pattern> : null}
          {gloss && graphiteGloss ? (<><linearGradient id={`${gid}-env`} x1="0.18" y1="0" x2="0.08" y2="1"><stop offset="0%" stopColor="#d7e3f0" stopOpacity="0.3" /><stop offset="22%" stopColor="#ffffff" stopOpacity="0.08" /><stop offset="48%" stopColor="#ffffff" stopOpacity="0" /><stop offset="100%" stopColor="#050608" stopOpacity="0.34" /></linearGradient><radialGradient id={`${gid}-spec`} cx="0.24" cy="0.08" r="0.7"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.48" /><stop offset="12%" stopColor="#eef4ff" stopOpacity="0.18" /><stop offset="32%" stopColor="#ffffff" stopOpacity="0.04" /><stop offset="55%" stopColor="#ffffff" stopOpacity="0" /></radialGradient><linearGradient id={`${gid}-strip`} x1="0.05" y1="0" x2="0.95" y2="0.62"><stop offset="28%" stopColor="#ffffff" stopOpacity="0" /><stop offset="44%" stopColor="#ffffff" stopOpacity="0.06" /><stop offset="50%" stopColor="#ffffff" stopOpacity="0.32" /><stop offset="56%" stopColor="#ffffff" stopOpacity="0.06" /><stop offset="70%" stopColor="#ffffff" stopOpacity="0" /></linearGradient></>) : gloss ? (<linearGradient id={`${gid}-gloss`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0.42" /><stop offset="22%" stopColor="#fff" stopOpacity="0" /><stop offset="48%" stopColor="#fff" stopOpacity="0.14" /><stop offset="100%" stopColor="#000" stopOpacity="0.1" /></linearGradient>) : null}
        </defs>
        <rect width="32" height="32" rx="4" fill={texture ? `url(#${gid}-tex)` : matte ? `url(#${gid}-grain)` : hex} />
        {gloss && graphiteGloss ? (<><rect width="32" height="32" rx="4" fill={`url(#${gid}-env)`} style={{ mixBlendMode: "soft-light" }} /><rect width="32" height="32" rx="4" fill={`url(#${gid}-spec)`} style={{ mixBlendMode: "screen" }} /><rect width="32" height="32" rx="4" fill={`url(#${gid}-strip)`} style={{ mixBlendMode: "screen" }} opacity="0.85" /></>) : gloss ? <rect width="32" height="32" rx="4" fill={`url(#${gid}-gloss)`} /> : null}
        {matte ? <rect width="32" height="32" rx="4" fill="#000" opacity={texture ? 0.06 : 0.18} /> : null}
      </svg>
    </span>
  );
}

function ProfileColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROFILE_COLORS.map((c) => {
        const on = profileCanonicalHex(c.hex).toLowerCase() === profileCanonicalHex(value).toLowerCase();
        return (
          <button key={c.id} type="button" title={c.name} aria-label={c.name} aria-pressed={on} onClick={() => onChange(c.hex)} className={cn("flex w-[5.6rem] flex-col items-center gap-1 rounded-xl px-1 py-1.5", on ? "bg-accent ring-2 ring-steel" : "hover:bg-accent/60")}>
            <ColorChip hex={c.hex} />
            <span className="text-center text-[11px] leading-tight text-foreground">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function BarOrderPanel({ title, color, colorName, note, barCounts, totalBars }: { title: string; color: string; colorName: string; note: string; barCounts: { length: number; count: number }[]; totalBars: number }) {
  return (
    <aside className="min-w-0 rounded-xl border border-border bg-background/50 p-3 md:w-auto">
      <div className="flex items-center gap-2"><ColorChip hex={color} size="sm" /><div className="min-w-0"><p className="truncate font-medium">{title}</p><p className="text-xs text-muted-foreground">Цвет {colorName}</p></div></div>
      {note.trim() ? <p className="mt-3 text-sm text-foreground/90">{note.trim()}</p> : null}
      <p className="mt-4 text-xs uppercase tracking-[0.14em] text-steel">Хлысты</p>
      {barCounts.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Нет хлыстов в заказе.</p> : (
        <ul className="mt-2 space-y-2">{barCounts.map((c) => <li key={c.length} className="flex items-center justify-between gap-2 text-sm"><span className="flex min-w-0 items-center gap-2"><i className="size-2.5 shrink-0 rounded-full border border-border" style={{ background: profileSwatchBg(color) }} aria-hidden /><span className="tabular">{mm(c.length)}</span></span><span className="tabular shrink-0 text-muted-foreground">× {c.count}</span></li>)}</ul>
      )}
      <p className="mt-3 text-sm text-muted-foreground">Всего {totalBars} хлыст.</p>
    </aside>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "waste" }) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-xl tabular ${tone === "ok" ? "text-ok" : tone === "waste" ? "text-waste" : ""}`}>{value}</p>
    </div>
  );
}
