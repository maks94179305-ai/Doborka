from pathlib import Path

# --- openings: photo snapshots in cards instead of live SVG ---
src = Path("src/components/openings-view.tsx").read_text()

old_prev = '''        {saved && saved.objects.length ? <SavedScheme drawing={thickness === 0 ? { ...saved, objects: saved.objects.filter((o) => !(o.type === "dim" && o.offset === -50)) } : saved} /> : empty || (saved && !saved.objects.length) ? <SlopeProfile thickness={thickness} label={title} blank /> : <SlopeProfile thickness={thickness} label={title} />}'''

new_prev = '''        {(() => {
          const photoId = saved?.previewPhotoId || project?.schemes?.[key]?.[0];
          if (photoId) return <SchemePreview photoId={photoId} label={title} />;
          if (saved && saved.objects.length) {
            const shot = thickness === 0 ? { ...saved, objects: saved.objects.filter((o) => !(o.type === "dim" && o.offset === -50)) } : saved;
            return <DrawingShot drawing={shot} />;
          }
          if (empty || (saved && !saved.objects.length)) return <SlopeProfile thickness={thickness} label={title} blank />;
          return <SlopeProfile thickness={thickness} label={title} />;
        })()}'''

if old_prev in src:
    src = src.replace(old_prev, new_prev)
    print("preview -> SchemePreview/DrawingShot")
elif "SchemePreview photoId={photoId}" in src:
    print("preview already snapshot")
else:
    raise SystemExit("preview pattern not found")

if "void renderDrawingToBlob(next).then" in src:
    src = src.replace(
        '''  async function done(next: Drawing) {
    const photoId = next.objects.length ? uid("ph") : "";
    const isBottom = key.startsWith("slope:bottom:");''',
        '''  async function done(next: Drawing) {
    const photoId = next.objects.length ? uid("ph") : "";
    if (photoId) {
      const blob = await renderDrawingToBlob(next);
      if (blob) await savePhoto(photoId, blob);
    }
    const isBottom = key.startsWith("slope:bottom:");''',
    )
    src = src.replace(
        '''    if (photoId) {
      void renderDrawingToBlob(next).then(async (blob) => {
        if (blob) await savePhoto(photoId, blob);
      });
    }
  }''',
        '''  }''',
    )
    print("photo save awaited")

src = src.replace(
    'className="mx-auto block h-24 w-full object-contain"',
    'className="mx-auto block h-auto max-h-40 w-full object-contain"',
)

Path("src/components/openings-view.tsx").write_text(src)
print("openings ok")

# --- archive: select/share only inside open folder ---
av = Path("src/components/archive-view.tsx").read_text()

old_header = '''        <p className="mt-1 text-sm text-muted-foreground">Отметьте карточки и отправьте сразу несколько.</p>
        {entries.length ? <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPicked(entries.map((e) => e.id))}>Выбрать все</Button>
          <Button size="sm" variant="secondary" onClick={() => setPicked([])} disabled={!picked.length}>Снять выбор</Button>
          <Button size="sm" onClick={() => void sharePicked()} disabled={!picked.length || sharing}><Share2 /> {sharing ? "Отправляем…" : `Поделиться выбранными${picked.length ? ` (${picked.length})` : ""}`}</Button>
        </div> : null}'''

new_header = '''        <p className="mt-1 text-sm text-muted-foreground">{openFolder ? "Отметьте карточки в папке и отправьте сразу несколько." : "Откройте папку, чтобы выбрать и поделиться схемами."}</p>
        {openFolder && entries.length ? <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPicked(entries.filter((e) => (e.projectId || e.id) === openFolder).map((e) => e.id))}>Выбрать все</Button>
          <Button size="sm" variant="secondary" onClick={() => setPicked([])} disabled={!picked.length}>Снять выбор</Button>
          <Button size="sm" onClick={() => void sharePicked()} disabled={!picked.length || sharing}><Share2 /> {sharing ? "Отправляем…" : `Поделиться выбранными${picked.length ? ` (${picked.length})` : ""}`}</Button>
        </div> : null}'''

if old_header in av:
    av = av.replace(old_header, new_header)
    print("archive header scoped")
elif "Откройте папку, чтобы выбрать" in av:
    print("archive header already scoped")
else:
    raise SystemExit("archive header not found")

old_back = '''{openFolder ? <div className="flex gap-2"><Button variant="secondary" onClick={() => setOpenFolder(null)}>Назад к папкам</Button><Button variant="secondary" onClick={() => void removeFolder(openFolder)}><Trash2 /> Удалить папку</Button></div> : null}'''
new_back = '''{openFolder ? <div className="flex gap-2"><Button variant="secondary" onClick={() => { setOpenFolder(null); setPicked([]); }}>Назад к папкам</Button><Button variant="secondary" onClick={() => void removeFolder(openFolder)}><Trash2 /> Удалить папку</Button></div> : null}'''
if old_back in av:
    av = av.replace(old_back, new_back)
    print("back clears selection")
elif "setPicked([])" in av and "Назад к папкам" in av:
    print("back already clears")
else:
    raise SystemExit("back button not found")

old_share = '''      const chosen = entries.filter((e) => picked.includes(e.id));'''
new_share = '''      const chosen = entries.filter((e) => picked.includes(e.id) && (!openFolder || (e.projectId || e.id) === openFolder));'''
if old_share in av:
    av = av.replace(old_share, new_share)
    print("sharePicked scoped")
elif "(!openFolder || (e.projectId || e.id) === openFolder)" in av:
    print("sharePicked already scoped")
else:
    raise SystemExit("sharePicked not found")

Path("src/components/archive-view.tsx").write_text(av)
print("archive ok")
