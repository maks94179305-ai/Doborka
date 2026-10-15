#!/usr/bin/env python3
from pathlib import Path
p = Path("src/components/drawing-editor.tsx")
s = p.read_text()
old = """      <div className=\"flex shrink-0 flex-wrap items-center gap-2\">
        <div className=\"flex rounded-xl border border-border/80 bg-card/80 p-1\">
          {tools.map((t) => (
            <button key={t.id} type=\"button\" aria-label={t.label} aria-pressed={tool === t.id} onClick={() => { offsetDrag.current = null; endDrag.current = null; setDraft(null); manualRef.current = null; if (t.id === \"angle\" && placeAngle()) return; setTool(t.id); setColor(t.id === \"dim\" ? dimColor : lineColor); }} className={cn(\"flex h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-medium\", tool === t.id ? \"bg-primary text-primary-foreground\" : \"text-muted-foreground\")}>
              <t.icon className=\"size-4\" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>"""
new = """      <div className=\"flex min-w-0 shrink-0 flex-wrap items-center gap-1.5\">
        <div className=\"flex min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-0.5\">
          {tools.map((t) => (
            <button key={t.id} type=\"button\" title={t.label} aria-label={t.label} aria-pressed={tool === t.id} onClick={() => { offsetDrag.current = null; endDrag.current = null; setDraft(null); manualRef.current = null; if (t.id === \"angle\" && placeAngle()) return; setTool(t.id); setColor(t.id === \"dim\" ? dimColor : lineColor); }} className={cn(\"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl\", tool === t.id ? \"bg-primary text-primary-foreground\" : \"text-muted-foreground\")}>
              <t.icon className=\"size-4\" />
            </button>
          ))}
        </div>"""
if old not in s:
    if "overflow-hidden rounded-2xl" in s and "h-9 w-9" in s:
        print("already")
    else:
        raise SystemExit("FAIL pattern missing")
else:
    p.write_text(s.replace(old, new, 1))
    print("tools bar ok")
