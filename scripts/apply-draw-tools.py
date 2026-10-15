#!/usr/bin/env python3
from pathlib import Path

ROOT = Path("scripts/draw-hex")
manifest = (ROOT / "MANIFEST.txt").read_text().strip().splitlines()
map_dest = {
    "types": Path("src/lib/types.ts"),
    "render": Path("src/lib/draw-render.ts"),
    "editor": Path("src/components/drawing-editor.tsx"),
}
for line in manifest:
    label, parts = line.split(":", 1)
    hx = "".join((ROOT / p).read_text().strip() for p in parts.split(","))
    dest = map_dest[label]
    dest.write_bytes(bytes.fromhex(hx))
    print(dest, dest.stat().st_size)
