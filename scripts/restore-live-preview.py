#!/usr/bin/env python3
from pathlib import Path

src = Path("src/components/openings-view.tsx").read_text()
old = '''        {(() => {
          const photoId = saved?.previewPhotoId || project?.schemes?.[key]?.[0];
          if (photoId) return <SchemePreview photoId={photoId} label={title} />;
          if (saved && saved.objects.length) {
            const shot = thickness === 0 ? { ...saved, objects: saved.objects.filter((o) => !(o.type === "dim" && o.offset === -50)) } : saved;
            return <DrawingShot drawing={shot} />;
          }
          if (empty || (saved && !saved.objects.length)) return <SlopeProfile thickness={thickness} label={title} blank />;
          return <SlopeProfile thickness={thickness} label={title} />;
        })()}'''
new = '''        {saved && saved.objects.length ? <SavedScheme drawing={thickness === 0 ? { ...saved, objects: saved.objects.filter((o) => !(o.type === "dim" && o.offset === -50)) } : saved} /> : empty || (saved && !saved.objects.length) ? <SlopeProfile thickness={thickness} label={title} blank /> : <SlopeProfile thickness={thickness} label={title} />}'''
if old in src:
    Path("src/components/openings-view.tsx").write_text(src.replace(old, new))
    print("applied live preview")
elif new in src:
    print("already live")
else:
    raise SystemExit("pattern not found")
