#!/usr/bin/env python3
"""Fix: thickness updates all slope previews; cards stay DrawingShot snapshots."""
from pathlib import Path

path = Path("src/components/openings-view.tsx")
src = path.read_text()

# --- 1) Preview always reflects current thickness (generated or thickness-synced saved) ---
old_preview = '''        {(() => {
          if (empty || (saved && !saved.objects.length)) return <DrawingShot drawing={blank} />;
          if (saved && saved.objects.length) {
            const shot = thickness === 0 ? { ...saved, objects: saved.objects.filter((o) => !(o.type === "dim" && o.offset === -50)) } : saved;
            return <DrawingShot drawing={shot} />;
          }
          return <DrawingShot drawing={generated} />;
        })()}'''

new_preview = '''        {(() => {
          if (empty || (saved && !saved.objects.length && thickness === 0)) return <DrawingShot drawing={blank} />;
          // Always drive card geometry from current thickness so left/right/top/bottom all update
          if (thickness === 0) {
            if (saved && saved.objects.length) {
              return <DrawingShot drawing={{ ...saved, objects: saved.objects.filter((o) => !(o.type === "dim" && o.offset === -50)) }} />;
            }
            return <DrawingShot drawing={blank} />;
          }
          return <DrawingShot drawing={generated} />;
        })()}'''

if old_preview in src:
    src = src.replace(old_preview, new_preview)
    print("preview: always generated from thickness")
elif "Always drive card geometry from current thickness" in src:
    print("preview already thickness-driven")
else:
    print("WARN: preview pattern not found")

# --- 2) Expand facade thickness update keys for left/right/top (not only bottom) ---
old_loop = '''                    patchProject((p) => {
                      let drawings = p.drawings;
                      for (const side of sides) {
                        const prev = o.facade?.[side] ?? 18;
                        const next = side === "bottom" ? Math.max(0, patch.facade?.[side] ?? prev) : Math.max(1, patch.facade?.[side] ?? prev);
                        const key = side === "bottom" ? `slope:bottom:${o.id}` : `slope:${o.id}:${side}`;
                        const drawingId = p.schemeDrawings?.[key];
                        if (!drawingId || prev === next || next === 0) continue;
                        const rise = next;'''

new_loop = '''                    patchProject((p) => {
                      let drawings = p.drawings;
                      let schemeDrawings = { ...(p.schemeDrawings ?? {}) };
                      for (const side of sides) {
                        const prev = o.facade?.[side] ?? 18;
                        const next = side === "bottom" ? Math.max(0, patch.facade?.[side] ?? prev) : Math.max(1, patch.facade?.[side] ?? prev);
                        if (prev === next) continue;
                        const keys = side === "bottom"
                          ? [`slope:bottom:${o.id}`, `slope:bottom:${prev}`, `slope:bottom:${next}`]
                          : [`slope:${o.id}:${side}`, `slope:${prev}`, `slope:${next}`];
                        const rise = Math.max(1, next);'''

if old_loop in src:
    src = src.replace(old_loop, new_loop)
    print("update loop expanded keys")
elif "let schemeDrawings = { ...(p.schemeDrawings ?? {}) }" in src:
    print("update loop already expanded")
else:
    print("WARN: update loop start not found")

# Replace the drawingId single-key update with multi-key
old_apply = '''                        drawings = drawings.map((d) => d.id === drawingId ? { ...d, updatedAt: Date.now(), objects } : d);
                      }
                      return { ...p, drawings, openings: p.openings.map((item) => item.id === o.id ? { ...item, facade: { left: Math.max(1, patch.facade?.left ?? 18), right: Math.max(1, patch.facade?.right ?? 18), top: Math.max(1, patch.facade?.top ?? 18), bottom: Math.max(0, patch.facade?.bottom ?? 18) } } : item) };
                    });'''

new_apply = '''                        for (const key of keys) {
                          const drawingId = schemeDrawings[key];
                          if (drawingId) {
                            drawings = drawings.map((d) => d.id === drawingId ? { ...d, updatedAt: Date.now(), objects } : d);
                          }
                        }
                        // Keep per-opening key linked for next edits
                        const primary = side === "bottom" ? `slope:bottom:${o.id}` : `slope:${o.id}:${side}`;
                        const anyId = keys.map((k) => schemeDrawings[k]).find(Boolean);
                        if (anyId) schemeDrawings[primary] = anyId;
                      }
                      return { ...p, drawings, schemeDrawings, openings: p.openings.map((item) => item.id === o.id ? { ...item, facade: { left: Math.max(1, patch.facade?.left ?? 18), right: Math.max(1, patch.facade?.right ?? 18), top: Math.max(1, patch.facade?.top ?? 18), bottom: Math.max(0, patch.facade?.bottom ?? 18) } } : item) };
                    });'''

if old_apply in src:
    src = src.replace(old_apply, new_apply)
    print("apply multi-key update")
elif "for (const key of keys)" in src:
    print("apply already multi-key")
else:
    print("WARN: apply block not found")

path.write_text(src)
print("openings ok")
