#!/usr/bin/env python3
"""Share cutting screenshots to messenger (schemes + cutting shots)."""
from pathlib import Path

p = Path("src/components/plan-view.tsx")
s = p.read_text()

old = """        // В мессенджер — только схемы; раскрой остаётся в истории (BarScheme)
        if (item.kind === "scheme") {
          files.push(named);
          shareOnly.push(named);
        }"""
new = """        // Схемы + скрин раскроя в мессенджер; в истории раскрой — живые карточки
        if (item.kind === "scheme" || item.kind === "cutting") {
          files.push(named);
          shareOnly.push(named);
        }"""
if old not in s:
    old2 = """        if (item.kind === "scheme") {
          files.push(named);
          shareOnly.push(named);
        }"""
    if old2 in s:
        s = s.replace(old2, new, 1)
        print("share filter updated (no comment)")
    elif 'item.kind === "cutting"' in s and "shareOnly" in s:
        print("already shares cutting")
    else:
        raise SystemExit("share filter missing")
else:
    s = s.replace(old, new, 1)
    print("share filter updated")

if "renderCuttingPlanShot(m.title, cutBars, url)" not in s:
    raise SystemExit("cutting shot call missing")
print("cutting shot generation present")
p.write_text(s)
print("ALL DONE")
