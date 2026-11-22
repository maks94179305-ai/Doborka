#!/usr/bin/env python3
from pathlib import Path
p = Path("src/components/plan-view.tsx")
s = p.read_text()
old = '''        // Схемы + скрин раскроя в мессенджер; в истории раскрой — живые карточки
        if (item.kind === "scheme" || item.kind === "cutting") {
          files.push(named);
          shareOnly.push(named);
        }'''
new = '''        // Из вкладки раскрой в мессенджер — только схемы
        if (item.kind === "scheme") {
          files.push(named);
          shareOnly.push(named);
        }'''
if old not in s:
    old2 = '''        if (item.kind === "scheme" || item.kind === "cutting") {
          files.push(named);
          shareOnly.push(named);
        }'''
    if old2 in s:
        s = s.replace(old2, new, 1)
        print("share schemes only ok")
    elif 'item.kind === "scheme")' in s and 'item.kind === "cutting"' not in s[s.find("shareOnly"):s.find("shareOnly")+400]:
        print("already schemes only")
    else:
        raise SystemExit("pattern missing")
else:
    s = s.replace(old, new, 1)
    print("share schemes only ok")
p.write_text(s)
print("ALL DONE")
