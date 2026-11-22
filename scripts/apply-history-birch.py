#!/usr/bin/env python3
"""White birch color + archive subfolders (cutting / schemes) with live BarScheme."""
from pathlib import Path

p = Path("src/lib/types.ts")
s = p.read_text()
if "white-birch" not in s and "белая берёза" not in s.lower() and "Белая берёза" not in s:
    old = '''  { id: "vintage", name: "Винтаж", hex: "#6e5a4a", finish: "matte", texture: "/textures/vintage-matte.jpg" },
];'''
    new = '''  { id: "vintage", name: "Винтаж", hex: "#6e5a4a", finish: "matte", texture: "/textures/vintage-matte.jpg" },
  { id: "white-birch", name: "Белая берёза", hex: "#f0e4cc", finish: "matte", texture: "/textures/vintage-matte.jpg" },
];'''
    if old not in s:
        raise SystemExit("PROFILE_COLORS pattern missing")
    s = s.replace(old, new, 1)
    print("birch color ok")
else:
    print("birch already")

old_ar = "export type ArchiveEntry = { id: string; photoId: string; title: string; colorName?: string; sentAt: number; projectId?: string; projectName?: string };"
new_ar = 'export type ArchiveEntry = { id: string; photoId: string; title: string; colorName?: string; sentAt: number; projectId?: string; projectName?: string; kind?: "scheme" | "cutting"; bars?: { id: string; index: number; stockLength: number; cuts: { pieceId: string; length: number; label: string; color: string; openingName?: string }[]; used: number; waste: number; leftover: number; usableRemainder: boolean }[] };'
if "kind?: \"scheme\" | \"cutting\"" not in s and "kind?: 'scheme' | 'cutting'" not in s:
    if old_ar not in s:
        raise SystemExit("ArchiveEntry type missing")
    s = s.replace(old_ar, new_ar, 1)
    print("ArchiveEntry kind ok")
else:
    print("ArchiveEntry already")
p.write_text(s)

p = Path("src/lib/store.ts")
s = p.read_text()
old_sig = 'addArchiveEntry: (entry: { photoId: string; title: string; colorName?: string; projectId?: string; projectName?: string }) => ArchiveEntry;'
new_sig = 'addArchiveEntry: (entry: { photoId: string; title: string; colorName?: string; projectId?: string; projectName?: string; kind?: "scheme" | "cutting"; bars?: import("./types").StockBar[] }) => ArchiveEntry;'
if "kind?:" not in s.split("addArchiveEntry")[1][:200]:
    if old_sig in s:
        s = s.replace(old_sig, new_sig, 1)
    old_impl = 'const item: ArchiveEntry = { id: uid("ar"), photoId: entry.photoId, title: entry.title, colorName: entry.colorName, sentAt: Date.now(), projectId: entry.projectId, projectName: entry.projectName };'
    new_impl = 'const item: ArchiveEntry = { id: uid("ar"), photoId: entry.photoId, title: entry.title, colorName: entry.colorName, sentAt: Date.now(), projectId: entry.projectId, projectName: entry.projectName, kind: entry.kind, bars: entry.bars };'
    if old_impl not in s:
        raise SystemExit("addArchiveEntry impl missing")
    s = s.replace(old_impl, new_impl, 1)
    p.write_text(s)
    print("store ok")
else:
    print("store already")

print("part1 done")
