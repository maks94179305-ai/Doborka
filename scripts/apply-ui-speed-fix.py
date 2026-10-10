from pathlib import Path

# --- openings-view ---
src = Path("src/components/openings-view.tsx").read_text()
src = src.replace(
    '<DrawingShot drawing={thickness === 0 ? { ...saved, objects: saved.objects.filter((o) => !(o.type === "dim" && o.offset === -50)) } : saved} />',
    '<SavedScheme drawing={thickness === 0 ? { ...saved, objects: saved.objects.filter((o) => !(o.type === "dim" && o.offset === -50)) } : saved} />',
)
src = src.replace(
    ': <DrawingShot drawing={generated} />',
    ': <SlopeProfile thickness={thickness} label={title} />',
)

old = """    if (photoId) {
      const blob = await renderDrawingToBlob(next);
      if (blob) await savePhoto(photoId, blob);
    }
    const cutKey = key.startsWith(\"slope:bottom:\") ? `slope:bottom:${thickness}` : key;
    patch((p) => {
      const schemeDrawings = { ...(p.schemeDrawings ?? {}), [key]: next.id, [cutKey]: next.id };
      const schemes = { ...(p.schemes ?? {}), [key]: photoId ? [photoId] : [], [cutKey]: photoId ? [photoId] : [] };
      const openingId = key.startsWith(\"slope:bottom:\") ? key.slice(\"slope:bottom:\".length) : \"\";
      const opening = p.openings.find((o) => o.id === openingId);
      const root = opening?.sourceId || openingId;
      const openings = p.openings.map((copy) => {
        if (copy.id === openingId) return copy;"""

new = """    const isBottom = key.startsWith(\"slope:bottom:\");
    const cutKey = isBottom ? `slope:bottom:${thickness}` : key;
    const openingId = isBottom ? key.slice(\"slope:bottom:\".length) : \"\";
    patch((p) => {
      const schemeDrawings = { ...(p.schemeDrawings ?? {}), [key]: next.id, [cutKey]: next.id };
      const schemes = { ...(p.schemes ?? {}), [key]: photoId ? [photoId] : [], [cutKey]: photoId ? [photoId] : [] };
      const opening = p.openings.find((o) => o.id === openingId);
      const root = opening?.sourceId || openingId;
      const openings = p.openings.map((copy) => {
        if (isBottom && copy.id === openingId) {
          const facade = { left: copy.facade?.left ?? 18, right: copy.facade?.right ?? 18, top: copy.facade?.top ?? 18, bottom: 0 };
          return { ...copy, facade };
        }
        if (copy.id === openingId) return copy;"""

if old not in src:
    raise SystemExit("openings done() pattern not found")
src = src.replace(old, new, 1)

marker = "      return { ...p, openings, drawings: [...p.drawings.filter((d) => d.id !== next.id), { ...next, previewPhotoId: photoId || undefined }], schemeDrawings, schemes };\n    });\n  }"
replacement = "      return { ...p, openings, drawings: [...p.drawings.filter((d) => d.id !== next.id), { ...next, previewPhotoId: photoId || undefined }], schemeDrawings, schemes };\n    });\n    if (photoId) {\n      void renderDrawingToBlob(next).then(async (blob) => {\n        if (blob) await savePhoto(photoId, blob);\n      });\n    }\n  }"
if marker not in src:
    raise SystemExit("patch close marker not found")
src = src.replace(marker, replacement, 1)
Path("src/components/openings-view.tsx").write_text(src)
print("openings ok")

# --- plan-view ---
pv = Path("src/components/plan-view.tsx").read_text()
if "setPendingSent(null);\n    setNameOpen(true)" in pv:
    print("plan already patched")
else:
    a = "    setSharing(true);\n    try {\n      const chosen = materials.filter((m) => picked.includes(m.key));"
    b = "    setNameDraft(project.name?.trim() || \"Раскрой\");\n    setPendingSent(null);\n    setNameOpen(true);\n    setSharing(true);\n    try {\n      const chosen = materials.filter((m) => picked.includes(m.key));"
    if a not in pv:
        raise SystemExit("plan prepare start not found")
    pv = pv.replace(a, b, 1)
    c = "      setPendingSent(sent);\n      setNameDraft(project.name?.trim() || \"Раскрой\");\n      setNameOpen(true);"
    d = "      setPendingSent(sent.length ? sent : null);\n      if (!sent.length) setNameOpen(false);"
    if c not in pv:
        raise SystemExit("plan prepare end not found")
    pv = pv.replace(c, d, 1)
    pv = pv.replace("{ w: 900, h: 640 }", "{ w: 720, h: 480 }")
    pv = pv.replace(
        '<Button onClick={() => void confirmShare()} disabled={sharing}><Share2 /> Отправить</Button>',
        '<Button onClick={() => void confirmShare()} disabled={sharing || !pendingSent?.length}><Share2 /> {sharing && !pendingSent ? "Готовим…" : "Отправить"}</Button>',
    )
    pv = pv.replace(
        "  async function confirmShare() {\n    if (!pendingSent?.length) { setNameOpen(false); return; }",
        "  async function confirmShare() {\n    if (sharing && !pendingSent?.length) return;\n    if (!pendingSent?.length) { setNameOpen(false); return; }",
    )
    Path("src/components/plan-view.tsx").write_text(pv)
    print("plan ok")
