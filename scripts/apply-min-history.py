#!/usr/bin/env python3
from pathlib import Path

p = Path("src/lib/types.ts")
s = p.read_text()
if "white-birch" not in s:
    s = s.replace(
        '{ id: "vintage", name: "Винтаж", hex: "#6e5a4a", finish: "matte", texture: "/textures/vintage-matte.jpg" },\n];',
        '{ id: "vintage", name: "Винтаж", hex: "#6e5a4a", finish: "matte", texture: "/textures/vintage-matte.jpg" },\n  { id: "white-birch", name: "Белая берёза", hex: "#f0e4cc", finish: "matte", texture: "/textures/vintage-matte.jpg" },\n];',
        1,
    )
old = 'export type ArchiveEntry = { id: string; photoId: string; title: string; colorName?: string; sentAt: number; projectId?: string; projectName?: string };'
new = 'export type ArchiveEntry = { id: string; photoId: string; title: string; colorName?: string; sentAt: number; projectId?: string; projectName?: string; kind?: "scheme" | "cutting"; bars?: { id: string; index: number; stockLength: number; cuts: { pieceId: string; length: number; label: string; color: string; openingName?: string }[]; used: number; waste: number; leftover: number; usableRemainder: boolean }[] };'
if old in s:
    s = s.replace(old, new, 1)
p.write_text(s)
print("types")

p = Path("src/lib/store.ts")
s = p.read_text()
s = s.replace(
    'addArchiveEntry: (entry: { photoId: string; title: string; colorName?: string; projectId?: string; projectName?: string }) => ArchiveEntry;',
    'addArchiveEntry: (entry: { photoId: string; title: string; colorName?: string; projectId?: string; projectName?: string; kind?: "scheme" | "cutting"; bars?: ArchiveEntry["bars"] }) => ArchiveEntry;',
    1,
)
s = s.replace(
    'const item: ArchiveEntry = { id: uid("ar"), photoId: entry.photoId, title: entry.title, colorName: entry.colorName, sentAt: Date.now(), projectId: entry.projectId, projectName: entry.projectName };',
    'const item: ArchiveEntry = { id: uid("ar"), photoId: entry.photoId, title: entry.title, colorName: entry.colorName, sentAt: Date.now(), projectId: entry.projectId, projectName: entry.projectName, kind: entry.kind, bars: entry.bars };',
    1,
)
p.write_text(s)
print("store")

p = Path("src/components/plan-view.tsx")
s = p.read_text()
s = s.replace(
    "const sent: { file: File; title: string }[] = [];",
    'const sent: { file: File; title: string; kind: "scheme" | "cutting"; bars?: import("@/lib/types").StockBar[]; colorName?: string }[] = [];',
    1,
)
s = s.replace(
    "sent.push({ file, title: m.title });",
    'sent.push({ file, title: m.title, kind: "scheme", colorName: profileColorName(color) });',
    1,
)
s = s.replace(
    "if (cutFile) sent.push({ file: cutFile, title: `Раскрой · ${m.title}` });",
    'if (cutFile) sent.push({ file: cutFile, title: m.title, kind: "cutting", bars: cutBars, colorName: profileColorName(color) });',
    1,
)
s = s.replace(
    "addArchiveEntry({ photoId, title: item.title, projectId, projectName });",
    "addArchiveEntry({ photoId, title: item.title, projectId, projectName, kind: item.kind, bars: item.bars, colorName: item.colorName });",
    1,
)
p.write_text(s)
print("plan")
