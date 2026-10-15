#!/usr/bin/env python3
from pathlib import Path
p = Path("src/components/drawing-editor.tsx")
s = p.read_text()
old = """    if (toolRef.current === \"select\" && tap && e && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 8) {
      const picked = hit(toWorld(local(e).x, local(e).y));
      setSelected(picked ? [picked.id] : []);
      setDraft(null);
      offsetDrag.current = null;
      return;
    }
    const d = draftRef.current;
    setDraft(null);"""
new = """    if (toolRef.current === \"select\" && tap && e && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 8) {
      const picked = hit(toWorld(local(e).x, local(e).y));
      setSelected(picked ? [picked.id] : []);
      setDraft(null);
      offsetDrag.current = null;
      return;
    }
    if (toolRef.current === \"path\") {
      const pts = pathPointsRef.current;
      pathPointsRef.current = null;
      setPathPoints(null);
      if (pts && pts.length > 1) {
        const id = uid(\"dr\");
        commit([...objectsRef.current, { id, type: \"path\" as const, points: pts, color: activeColor(\"line\"), width: 3 }]);
        setSelected([id]);
      }
      return;
    }
    const d = draftRef.current;
    setDraft(null);"""
if old not in s:
    if "if (toolRef.current === \"path\") {\n      const pts = pathPointsRef.current;" in s:
        print("already fixed")
    else:
        raise SystemExit("FAIL pattern missing")
else:
    p.write_text(s.replace(old, new, 1))
    print("path commit onUp ok")
