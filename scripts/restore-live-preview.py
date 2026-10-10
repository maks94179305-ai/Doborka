#!/usr/bin/env python3
from pathlib import Path

path = Path("src/components/openings-view.tsx")
src = path.read_text()

# Stabilize generated drawing (no new uids every render)
old_gen = '''  const rise = Math.max(1, thickness);
  const generated = { id: uid("dr"), name: `Откос · ${thickness} мм`, updatedAt: Date.now(), objects: [
    { id: uid("ln"), type: "line" as const, x1: 0, y1: 0, x2: 0, y2: 50, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: uid("ln"), type: "line" as const, x1: 0, y1: 50, x2: 40, y2: 50, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: uid("ln"), type: "line" as const, x1: 40, y1: 50, x2: 40, y2: 49, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: uid("ln"), type: "line" as const, x1: 40, y1: 49, x2: 20, y2: 49, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: uid("ln"), type: "line" as const, x1: 20, y1: 49, x2: 20, y2: 49 - rise, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: uid("ln"), type: "line" as const, x1: 20, y1: 49 - rise, x2: 70, y2: 49 - rise, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: uid("dm"), type: "dim" as const, x1: 0, y1: 0, x2: 0, y2: 50, offset: 15, color: "#c46a45", width: 1, label: "50" },
    { id: uid("dm"), type: "dim" as const, x1: 0, y1: 50, x2: 40, y2: 50, offset: 15, color: "#c46a45", width: 1, label: "40" },
    { id: uid("dm"), type: "dim" as const, x1: 20, y1: 49, x2: 40, y2: 49, offset: -15, color: "#c46a45", width: 1, label: "20" },
    { id: uid("dm"), type: "dim" as const, x1: 20, y1: 49 - rise, x2: 20, y2: 49, offset: -50, color: "#c46a45", width: 1, label: String(thickness) },
    { id: uid("dm"), type: "dim" as const, x1: 20, y1: 49 - rise, x2: 70, y2: 49 - rise, offset: -15, color: "#c46a45", width: 1, label: "50" },
  ] };'''

new_gen = '''  const rise = Math.max(1, thickness);
  const generated = useMemo(() => ({ id: `gen-${key}-${thickness}`, name: `Откос · ${thickness} мм`, updatedAt: thickness, objects: [
    { id: "ln1", type: "line" as const, x1: 0, y1: 0, x2: 0, y2: 50, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: "ln2", type: "line" as const, x1: 0, y1: 50, x2: 40, y2: 50, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: "ln3", type: "line" as const, x1: 40, y1: 50, x2: 40, y2: 49, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: "ln4", type: "line" as const, x1: 40, y1: 49, x2: 20, y2: 49, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: "ln5", type: "line" as const, x1: 20, y1: 49, x2: 20, y2: 49 - rise, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: "ln6", type: "line" as const, x1: 20, y1: 49 - rise, x2: 70, y2: 49 - rise, color: "#f3f1ec", width: 2, dash: "solid" as const },
    { id: "dm1", type: "dim" as const, x1: 0, y1: 0, x2: 0, y2: 50, offset: 15, color: "#c46a45", width: 1, label: "50" },
    { id: "dm2", type: "dim" as const, x1: 0, y1: 50, x2: 40, y2: 50, offset: 15, color: "#c46a45", width: 1, label: "40" },
    { id: "dm3", type: "dim" as const, x1: 20, y1: 49, x2: 40, y2: 49, offset: -15, color: "#c46a45", width: 1, label: "20" },
    { id: "dm4", type: "dim" as const, x1: 20, y1: 49 - rise, x2: 20, y2: 49, offset: -50, color: "#c46a45", width: 1, label: String(thickness) },
    { id: "dm5", type: "dim" as const, x1: 20, y1: 49 - rise, x2: 70, y2: 49 - rise, offset: -15, color: "#c46a45", width: 1, label: "50" },
  ] }), [key, thickness, rise]);'''

if old_gen in src:
    src = src.replace(old_gen, new_gen)
    print("generated stabilized with useMemo")
elif "useMemo(() => ({ id: `gen-${key}-${thickness}`" in src or 'useMemo(() => ({ id: `gen-' in src:
    print("generated already stable")
else:
    print("WARN: generated block not found")

path.write_text(src)
print("ok")
