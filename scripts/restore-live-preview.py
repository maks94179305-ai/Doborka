#!/usr/bin/env python3
"""Cards show DrawingShot (bitmap snapshot look); thickness changes still update numbers/lines."""
from pathlib import Path

path = Path("src/components/openings-view.tsx")
src = path.read_text()

# 1) Preview in SlopeColumn -> always DrawingShot (snapshot look, data-driven)
old_preview = '''        {saved && saved.objects.length ? <SavedScheme drawing={thickness === 0 ? { ...saved, objects: saved.objects.filter((o) => !(o.type === "dim" && o.offset === -50)) } : saved} /> : empty || (saved && !saved.objects.length) ? <SlopeProfile thickness={thickness} label={title} blank /> : <SlopeProfile thickness={thickness} label={title} />}'''

new_preview = '''        {(() => {
          if (empty || (saved && !saved.objects.length)) return <DrawingShot drawing={blank} />;
          if (saved && saved.objects.length) {
            const shot = thickness === 0 ? { ...saved, objects: saved.objects.filter((o) => !(o.type === "dim" && o.offset === -50)) } : saved;
            return <DrawingShot drawing={shot} />;
          }
          return <DrawingShot drawing={generated} />;
        })()}'''

if old_preview in src:
    src = src.replace(old_preview, new_preview)
    print("preview -> DrawingShot (snapshot style, data-driven)")
elif "return <DrawingShot drawing={generated}" in src:
    print("preview already DrawingShot")
else:
    # try after previous snapshot block
    old2 = '''        {(() => {
          const photoId = saved?.previewPhotoId || project?.schemes?.[key]?.[0];
          if (photoId) return <SchemePreview photoId={photoId} label={title} />;
          if (saved && saved.objects.length) {
            const shot = thickness === 0 ? { ...saved, objects: saved.objects.filter((o) => !(o.type === "dim" && o.offset === -50)) } : saved;
            return <DrawingShot drawing={shot} />;
          }
          if (empty || (saved && !saved.objects.length)) return <SlopeProfile thickness={thickness} label={title} blank />;
          return <SlopeProfile thickness={thickness} label={title} />;
        })()}'''
    if old2 in src:
        src = src.replace(old2, new_preview)
        print("preview -> DrawingShot from photo/snapshot block")
    else:
        raise SystemExit("preview pattern not found")

# 2) Stabilize DrawingShot so it re-renders when objects/thickness change, not on every parent render identity
old_shot = '''function DrawingShot({ drawing }: { drawing: Drawing }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let alive = true;
    void renderDrawingToBlob(drawing, { w: 640, h: 420 }).then((blob) => {
      if (!blob || !alive) return;
      const next = URL.createObjectURL(blob);
      setUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return next; });
    });
    return () => { alive = false; setUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return ""; }); };
  }, [drawing]);
  return <figure className="mx-auto w-full rounded-xl border border-border bg-[#141816] p-1.5">{url ? <img src={url} alt="" className="mx-auto block h-auto w-full object-contain" /> : <svg viewBox="8 17 126 85" className="mx-auto mt-1 block h-auto w-full" />}</figure>;
}'''

new_shot = '''function DrawingShot({ drawing }: { drawing: Drawing }) {
  const [url, setUrl] = useState("");
  const sig = useMemo(() => JSON.stringify(drawing.objects) + "|" + String(drawing.updatedAt ?? ""), [drawing.objects, drawing.updatedAt]);
  useEffect(() => {
    let alive = true;
    void renderDrawingToBlob(drawing, { w: 640, h: 420 }).then((blob) => {
      if (!blob || !alive) return;
      const next = URL.createObjectURL(blob);
      setUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return next; });
    });
    return () => { alive = false; setUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return ""; }); };
  }, [sig, drawing]);
  return <figure className="mx-auto w-full rounded-xl border border-border bg-[#141816] p-1.5">{url ? <img src={url} alt="" className="mx-auto block h-auto max-h-40 w-full object-contain" /> : <svg viewBox="8 17 126 85" className="mx-auto mt-1 block h-auto w-full" />}</figure>;
}'''

if old_shot in src:
    src = src.replace(old_shot, new_shot)
    print("DrawingShot stabilized + max-h")
elif "const sig = useMemo" in src and "DrawingShot" in src:
    print("DrawingShot already stabilized")
else:
    print("DrawingShot pattern not exact — checking useMemo import")

# Ensure useMemo is imported (already used in file for OpeningsView)
if "useMemo" not in src.split("from \"react\"")[0]:
    src = src.replace(
        'import { useEffect, useMemo, useState } from "react";',
        'import { useEffect, useMemo, useState } from "react";',
    )

path.write_text(src)
print("ok")
