#!/usr/bin/env python3
from pathlib import Path

p = Path("src/components/plan-view.tsx")
s = p.read_text()
if "kind: \"cutting\"" not in s and "kind: 'cutting'" not in s:
    s = s.replace(
        "const sent: { file: File; title: string }[] = [];",
        'const sent: { file: File; title: string; kind: "scheme" | "cutting"; bars?: import("@/lib/types").StockBar[]; colorName?: string }[] = [];',
        1,
    )
    old = '''          sent.push({ file, title: m.title });\n          if (m.plan.bars.length > 0) {\n            const cutBars = m.plan.bars.map((b) => {\n              const global = plan.pieceToBar[b.cuts[0]?.pieceId] ?? b.index;\n              return { ...b, index: global };\n            });\n            const cutFile = await renderCuttingPlanShot(m.title, cutBars);\n            if (cutFile) sent.push({ file: cutFile, title: `\u0420\u0430\u0441\u043a\u0440\u043e\u0439 \u00b7 ${m.title}` });\n          }'''
    new = '''          sent.push({ file, title: m.title, kind: "scheme", colorName: profileColorName(color) });\n          if (m.plan.bars.length > 0) {\n            const cutBars = m.plan.bars.map((b) => {\n              const global = plan.pieceToBar[b.cuts[0]?.pieceId] ?? b.index;\n              return { ...b, index: global };\n            });\n            const cutFile = await renderCuttingPlanShot(m.title, cutBars);\n            if (cutFile) sent.push({ file: cutFile, title: m.title, kind: "cutting", bars: cutBars, colorName: profileColorName(color) });\n          }'''
    if old not in s:
        # try unicode raskroy as actual chars
        old2 = old.replace("\\u0420\\u0430\\u0441\\u043a\\u0440\\u043e\\u0439 \\u00b7 ", "\u0420\u0430\u0441\u043a\u0440\u043e\u0439 \u00b7 ")
        if old2 in s:
            old = old2
        else:
            raise SystemExit("plan-view sent.push pattern missing")
    s = s.replace(old, new, 1)
    old_add = "addArchiveEntry({ photoId, title: item.title, projectId, projectName });"
    new_add = "addArchiveEntry({ photoId, title: item.title, projectId, projectName, kind: item.kind, bars: item.bars, colorName: item.colorName });"
    if old_add not in s:
        raise SystemExit("addArchiveEntry call missing")
    s = s.replace(old_add, new_add, 1)
    p.write_text(s)
    print("plan-view ok")
else:
    print("plan-view already")
print("part2a ok")
