#!/usr/bin/env python3
from pathlib import Path
p = Path("src/components/plan-view.tsx")
s = p.read_text()
old = '''        if (item.kind === "scheme" || item.kind === "cutting") {
          files.push(named);
          shareOnly.push(named);
        }'''
new = '''        // В мессенджер — только схемы; раскрой остаётся в истории (BarScheme)
        if (item.kind === "scheme") {
          files.push(named);
          shareOnly.push(named);
        }'''
if old not in s:
    if 'item.kind === "scheme")' in s and 'item.kind === "cutting"' not in s[s.find("shareOnly"):s.find("shareOnly")+500]:
        print("already schemes only")
    else:
        raise SystemExit("share filter pattern missing")
else:
    p.write_text(s.replace(old, new, 1))
    print("share schemes only ok")
print("ALL DONE")
