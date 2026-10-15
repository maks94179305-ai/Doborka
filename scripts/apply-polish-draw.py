#!/usr/bin/env python3
from pathlib import Path
import re

def sub(path, pattern, repl, label, flags=0):
    p = Path(path)
    s = p.read_text()
    ns, n = re.subn(pattern, repl, s, count=1, flags=flags)
    if n == 0:
        if repl[:40] in s:
            print(label, "already")
            return
        raise SystemExit("FAIL " + label)
    p.write_text(ns)
    print(label, "ok")

sub("src/lib/draw-render.ts",
    r"(if \(hi\) \{ ctx\.shadowColor = obj\.color; ctx\.shadowBlur = 8; \}\n  strokeDimMarks)",
    r"if (hi) { ctx.shadowColor = obj.color; ctx.shadowBlur = 8; }\n  else { ctx.globalAlpha = 0.5; }\n  strokeDimMarks",
    "dim")
sub("src/lib/draw-render.ts",
    r"(strokeDimMarks\(ctx, obj, g, tick\); ctx\.setLineDash\(\[\]\);\n  if \(hideLabel\))",
    r"strokeDimMarks(ctx, obj, g, tick); ctx.setLineDash([]);\n  ctx.globalAlpha = 1;\n  if (hideLabel)",
    "dim reset")

old = Path("src/lib/draw-render.ts").read_text()
if "globalAlpha = hi ? 0.75" not in old:
    old2 = old.replace(
        '} else if (obj.type === "arrow") {\n      strokeDash(ctx, obj.dash, scale);',
        '} else if (obj.type === "arrow") {\n      ctx.save();\n      ctx.globalAlpha = hi ? 0.75 : 0.48;\n      strokeDash(ctx, obj.dash, scale);',
        1,
    )
    if old2 == old:
        raise SystemExit("FAIL arrow start")
    old2 = old2.replace(
        '      ctx.fillStyle = strokeColor(obj.color);\n      ctx.fill();\n      if (obj.label && !hideLabel) {\n        ctx.fillStyle = strokeColor(obj.color);\n        ctx.font = `${12 / scale}px Manrope, sans-serif`;\n        ctx.textAlign = "left";\n        ctx.textBaseline = "bottom";\n        ctx.fillText(obj.label, obj.x1 + 4 / scale, obj.y1 - 4 / scale);\n      }',
        '      ctx.fillStyle = strokeColor(obj.color);\n      ctx.fill();\n      ctx.restore();\n      if (obj.label && !hideLabel) {\n        const lx = obj.x1 + 4 / scale;\n        const ly = obj.y1 - 4 / scale;\n        ctx.font = `600 ${13 / scale}px Manrope, sans-serif`;\n        ctx.textAlign = "left";\n        ctx.textBaseline = "bottom";\n        const metrics = ctx.measureText(obj.label);\n        const pad = 3 / scale;\n        const th = 14 / scale;\n        ctx.fillStyle = sheetColor();\n        ctx.globalAlpha = 0.88;\n        ctx.fillRect(lx - pad, ly - th, metrics.width + pad * 2, th + pad);\n        ctx.globalAlpha = 1;\n        ctx.fillStyle = labelColor();\n        ctx.fillText(obj.label, lx, ly);\n      }',
        1,
    )
    Path("src/lib/draw-render.ts").write_text(old2)
    print("arrow ok")
else:
    print("arrow already")

sub("src/lib/draw-render.ts",
    r'if \(o\.type === "line" \|\| o\.type === "dim"\)',
    r'if (o.type === "line" || o.type === "dim" || o.type === "arrow")',
    "bounds arrow")
if 'for (const pt of o.points)' not in Path("src/lib/draw-render.ts").read_text():
    sub("src/lib/draw-render.ts",
        r'(else if \(o\.type === "rect"\))',
        r'else if (o.type === "path") { for (const pt of o.points) add(pt.x, pt.y); }\n    \1',
        "bounds path")

e = Path("src/components/drawing-editor.tsx").read_text()
if "pathPoints" not in e:
    e = e.replace(
        "  const [draft, setDraft] = useState<{ start: Pt; end: Pt; offset?: number; locked?: boolean } | null>(null);\n",
        "  const [draft, setDraft] = useState<{ start: Pt; end: Pt; offset?: number; locked?: boolean } | null>(null);\n  const [pathPoints, setPathPoints] = useState<Pt[] | null>(null);\n  const pathPointsRef = useRef<Pt[] | null>(null);\n  pathPointsRef.current = pathPoints;\n",
        1,
    )
    print("path state ok")
else:
    print("path state already")

e = e.replace(
    "useEffect(() => { redraw(); }, [redraw, objects, view, draft, color]);",
    "useEffect(() => { redraw(); }, [redraw, objects, view, draft, pathPoints, color]);",
)

if "pathPointsRef.current = [world]" not in e:
    e = e.replace(
        "    const start = snapToDrawing(world, objectsRef.current, undefined, tol);\n    setDraft({ start, end: start });\n  }",
        "    if (toolRef.current === \"path\") {\n      pathPointsRef.current = [world];\n      setPathPoints([world]);\n      setDraft(null);\n      return;\n    }\n    const start = snapToDrawing(world, objectsRef.current, undefined, tol);\n    setDraft({ start, end: start });\n  }",
        1,
    )
    print("path down ok")

if "minDist = 2.5" not in e:
    e = e.replace(
        "if (downRef.current && Math.hypot(e.clientX - downRef.current.x, e.clientY - downRef.current.y) > 8) clearHold();",
        "if (downRef.current && Math.hypot(e.clientX - downRef.current.x, e.clientY - downRef.current.y) > 8) clearHold();\n    if (toolRef.current === \"path\" && pathPointsRef.current) {\n      const world = toWorld(local(e).x, local(e).y);\n      const pts = pathPointsRef.current;\n      const last = pts[pts.length - 1];\n      const minDist = 2.5 / viewRef.current.scale;\n      if (Math.hypot(world.x - last.x, world.y - last.y) >= minDist) {\n        const next = [...pts, world];\n        pathPointsRef.current = next;\n        setPathPoints(next);\n      }\n      return;\n    }",
        1,
    )
    print("path move ok")

marker = "    const d = draftRef.current;\n    setDraft(null);"
if "const pts = pathPointsRef.current;" not in e:
    e = e.replace(marker,
        "    if (toolRef.current === \"path\") {\n      const pts = pathPointsRef.current;\n      pathPointsRef.current = null;\n      setPathPoints(null);\n      if (pts && pts.length > 1) {\n        const id = uid(\"dr\");\n        commit([...objectsRef.current, { id, type: \"path\" as const, points: pts, color: activeColor(\"line\"), width: 3 }]);\n        setSelected([id]);\n      }\n      return;\n    }\n" + marker, 1)
    print("path up ok")

e2 = re.sub(
    r"    if \(toolRef\.current === \"path\"\) \{\n      const id = uid\(\"dr\"\);\n      const pts = \[d\.start, \{ x: \(d\.start\.x \+ d\.end\.x\) / 2, y: \(d\.start\.y \+ d\.end\.y\) / 2 \}, d\.end\];\n      commit\(\[\.\.\.objectsRef\.current, \{ id, type: \"path\" as const, points: pts, color: activeColor\(\"line\"\), width: 3 \}\]\);\n      setSelected\(\[id\]\);\n      return;\n    }\n",
    "",
    e,
    count=1,
)
if e2 != e:
    e = e2
    print("removed path3")

if "const pd = pathPointsRef.current" not in e:
    m = re.search(r"\} else if \(preview\) \{[\s\S]*?ctx\.stroke\(\);\n    \}", e)
    if m:
        new_prev = '} else if (preview && toolRef.current === "arrow") {\n      paintObject(ctx, { id: "tmp", type: "arrow", x1: preview.start.x, y1: preview.start.y, x2: preview.end.x, y2: preview.end.y, color: activeColor("line"), width: 3, dash: "solid" }, v.scale, false);\n    } else if (preview) {\n      ctx.strokeStyle = activeColor("line");\n      ctx.lineWidth = 2.8 / v.scale;\n      strokeDash(ctx, "solid", v.scale);\n      ctx.beginPath();\n      ctx.moveTo(preview.start.x, preview.start.y);\n      ctx.lineTo(preview.end.x, preview.end.y);\n      ctx.stroke();\n    }\n    const pd = pathPointsRef.current;\n    if (pd && pd.length > 1) {\n      paintObject(ctx, { id: "tmp", type: "path", points: pd, color: activeColor("line"), width: 3 }, v.scale, false);\n    }'
        e = e[:m.start()] + new_prev + e[m.end():]
        print("preview ok")

e = e.replace(
    "downRef.current = null; setDraft(null); }} onContextMenu",
    "downRef.current = null; setDraft(null); pathPointsRef.current = null; setPathPoints(null); }} onContextMenu",
)

e = e.replace(
    '<div className="flex w-full shrink-0 flex-col gap-1 landscape:w-40">',
    '<div className="flex w-full shrink-0 flex-col gap-1 rounded-2xl border border-border/80 bg-card/80 p-2 landscape:w-40">',
)

Path("src/components/drawing-editor.tsx").write_text(e)
print("ALL DONE")
