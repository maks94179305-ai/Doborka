#!/usr/bin/env python3
from pathlib import Path

# extras overlay
p = Path("src/components/extras-view.tsx")
s = p.read_text()
old = """      {open ? (
        <section className=\"panel space-y-2 p-4\">
          <div className=\"flex items-center justify-between\"><h2 className=\"font-medium\">Добавить элемент</h2><Button type=\"button\" onClick={() => setOpen(false)}>Закрыть</Button></div>
          {EXTRA_PRESETS.map((p) => (
            <button key={p.kind} type=\"button\" className=\"w-full rounded-xl border border-border bg-background/50 px-3 py-3 text-left hover:bg-accent\" onClick={() => { const kind = p.kind as ExtraKind; addExtra({ kind, name: extraPreset(kind).name, length: p.defaultLength || 1000, qty: 1 }); setOpen(false); }}>
              <span className=\"block font-medium\">{p.name}</span>
              <span className=\"text-xs text-muted-foreground\">{p.hint}</span>
            </button>
          ))}
        </section>
      ) : null}"""
# Use actual file content without excessive escaping - read from raw pattern
old = '''      {open ? (
        <section className="panel space-y-2 p-4">
          <div className="flex items-center justify-between"><h2 className="font-medium">Добавить элемент</h2><Button type="button" onClick={() => setOpen(false)}>Закрыть</Button></div>
          {EXTRA_PRESETS.map((p) => (
            <button key={p.kind} type="button" className="w-full rounded-xl border border-border bg-background/50 px-3 py-3 text-left hover:bg-accent" onClick={() => { const kind = p.kind as ExtraKind; addExtra({ kind, name: extraPreset(kind).name, length: p.defaultLength || 1000, qty: 1 }); setOpen(false); }}>
              <span className="block font-medium">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.hint}</span>
            </button>
          ))}
        </section>
      ) : null}'''
new = '''      {open ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-3 sm:items-center" onPointerDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <section className="max-h-[min(70vh,32rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-float" onPointerDown={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-medium">Добавить элемент</h2>
              <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>Закрыть</Button>
            </div>
            <div className="space-y-2">
              {EXTRA_PRESETS.map((p) => (
                <button key={p.kind} type="button" className="w-full rounded-xl border border-border bg-background/50 px-3 py-3 text-left hover:bg-accent active:bg-accent" onClick={() => { const kind = p.kind as ExtraKind; addExtra({ kind, name: extraPreset(kind).name, length: p.defaultLength || 1000, qty: 1 }); setOpen(false); }}>
                  <span className="block font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.hint}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}'''
if old not in s:
    raise SystemExit("extras pattern missing")
p.write_text(s.replace(old, new, 1))
print("extras overlay ok")

# editor tools
e = Path("src/components/drawing-editor.tsx")
es = e.read_text()
es = es.replace(
    'import { ClipboardPaste, Copy, DraftingCompass, Maximize2, MousePointer2, PenLine, Redo2, Ruler, Trash2, Undo2 } from "lucide-react";',
    'import { ArrowUpRight, ClipboardPaste, Copy, DraftingCompass, Maximize2, MousePointer2, PenLine, Pencil, Redo2, Ruler, Trash2, Undo2 } from "lucide-react";',
)
es = es.replace(
    'type Tool = "select" | "line" | "dim" | "angle";',
    'type Tool = "select" | "line" | "dim" | "angle" | "path" | "arrow";',
)
old_tools = '''  const tools = useMemo(() => [
    { id: "select" as const, icon: MousePointer2, label: "Выбор" },
    { id: "line" as const, icon: PenLine, label: "Линия" },
    { id: "dim" as const, icon: Ruler, label: "Размер" },
    { id: "angle" as const, icon: DraftingCompass, label: "Угол" },
  ], []);'''
new_tools = '''  const tools = useMemo(() => [
    { id: "select" as const, icon: MousePointer2, label: "Выбор" },
    { id: "line" as const, icon: PenLine, label: "Линия" },
    { id: "path" as const, icon: Pencil, label: "Кривая" },
    { id: "arrow" as const, icon: ArrowUpRight, label: "Стрелка" },
    { id: "dim" as const, icon: Ruler, label: "Размер" },
    { id: "angle" as const, icon: DraftingCompass, label: "Угол" },
  ], []);'''
if old_tools not in es:
    raise SystemExit("tools list missing")
es = es.replace(old_tools, new_tools)
old_commit = '''    const line = { id: uid("dr"), type: "line" as const, x1: d.start.x, y1: d.start.y, x2: d.end.x, y2: d.end.y, color: activeColor("line"), width: 3, dash: "solid" as const };
    commit([...objectsRef.current, line]);
    setSelected([line.id]);
    setLength(""); freshRef.current = true;
    setPad("length");
  }'''
new_commit = '''    if (toolRef.current === "arrow") {
      const id = uid("dr");
      const label = window.prompt("Текст у начала стрелки (можно пусто)") || undefined;
      commit([...objectsRef.current, { id, type: "arrow" as const, x1: d.start.x, y1: d.start.y, x2: d.end.x, y2: d.end.y, color: activeColor("line"), width: 3, dash: "solid" as const, label }]);
      setSelected([id]);
      return;
    }
    if (toolRef.current === "path") {
      const id = uid("dr");
      const pts = [d.start, { x: (d.start.x + d.end.x) / 2, y: (d.start.y + d.end.y) / 2 }, d.end];
      commit([...objectsRef.current, { id, type: "path" as const, points: pts, color: activeColor("line"), width: 3 }]);
      setSelected([id]);
      return;
    }
    const line = { id: uid("dr"), type: "line" as const, x1: d.start.x, y1: d.start.y, x2: d.end.x, y2: d.end.y, color: activeColor("line"), width: 3, dash: "solid" as const };
    commit([...objectsRef.current, line]);
    setSelected([line.id]);
    setLength(""); freshRef.current = true;
    setPad("length");
  }'''
if old_commit not in es:
    raise SystemExit("commit line missing")
es = es.replace(old_commit, new_commit)
e.write_text(es)
print("editor tools ok")
