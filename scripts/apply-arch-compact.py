#!/usr/bin/env python3
from pathlib import Path
p = Path("src/components/archive-view.tsx")
s = p.read_text()
if "openSub" in s:
    print("already"); raise SystemExit(0)
s = s.replace(
    'import { Pencil, Share2, Trash2 } from "lucide-react";',
    'import { ChevronLeft, Folder, Pencil, Share2, Trash2 } from "lucide-react";\nimport { BarScheme } from "@/components/bar-scheme";',
    1,
)
s = s.replace(
    "const [openFolder, setOpenFolder] = useState<string | null>(null);",
    'const [openFolder, setOpenFolder] = useState<string | null>(null);\n  const [openSub, setOpenSub] = useState<null | "cutting" | "scheme">(null);',
    1,
)
s = s.replace(
    "if (openFolder === folderId) setOpenFolder(null);",
    "if (openFolder === folderId) { setOpenFolder(null); setOpenSub(null); }",
    1,
)
helper = """
  function entryKind(e: (typeof entries)[number]): \"cutting\" | \"scheme\" {
    if (e.kind === \"cutting\" || e.kind === \"scheme\") return e.kind;
    if (e.bars && e.bars.length) return \"cutting\";
    if ((e.title || \"\").startsWith(\"\u0420\u0430\u0441\u043a\u0440\u043e\u0439\")) return \"cutting\";
    return \"scheme\";
  }
"""
s = s.replace("  if (!project) return null;", helper + "\n  if (!project) return null;", 1)
start = s.find('{openFolder ? <ul className="grid gap-3 sm:grid-cols-2">')
if start < 0:
    raise SystemExit("block missing")
end = s.find("</ul> : null}", start) + len("</ul> : null}")
rep = (
    '{openFolder && !openSub ? (\n'
    '          <div className="grid gap-3 sm:grid-cols-2">\n'
    '            {(["cutting", "scheme"] as const).map((sub) => {\n'
    '              const count = entries.filter((e) => (e.projectId || e.id) === openFolder && entryKind(e) === sub).length;\n'
    '              return (\n'
    '                <button key={sub} type="button" className="panel flex items-center justify-between gap-3 p-4 text-left" onClick={() => setOpenSub(sub)}>\n'
    '                  <span className="flex min-w-0 items-center gap-3">\n'
    '                    <Folder className="size-5 shrink-0 text-steel" />\n'
    '                    <span>\n'
    '                      <span className="block font-medium">{sub === "cutting" ? "\u0420\u0430\u0441\u043a\u0440\u043e\u0439 \u0445\u043b\u044b\u0441\u0442\u043e\u0432" : "\u0421\u0445\u0435\u043c\u044b"}</span>\n'
    '                      <span className="text-sm text-muted-foreground">{count} \u043f\u043e\u0437.</span>\n'
    '                    </span>\n'
    '                  </span>\n'
    '                  <span className="text-steel">\u041e\u0442\u043a\u0440\u044b\u0442\u044c</span>\n'
    '                </button>\n'
    '              );\n'
    '            })}\n'
    '          </div>\n'
    '        ) : null}\n'
    '        {openFolder && openSub ? (\n'
    '          <div className="grid gap-3">\n'
    '            <div className="flex flex-wrap items-center gap-2">\n'
    '              <Button size="sm" variant="secondary" onClick={() => setOpenSub(null)}><ChevronLeft className="size-4" /> \u041a \u043f\u0430\u043f\u043a\u0430\u043c</Button>\n'
    '              <p className="text-sm text-muted-foreground">{openSub === "cutting" ? "\u0420\u0430\u0441\u043a\u0440\u043e\u0439 \u0445\u043b\u044b\u0441\u0442\u043e\u0432" : "\u0421\u0445\u0435\u043c\u044b"}</p>\n'
    '            </div>\n'
    '            {openSub === "cutting" ? (\n'
    '              <ul className="grid gap-6">\n'
    '                {entries.filter((e) => (e.projectId || e.id) === openFolder && entryKind(e) === "cutting").map((e) => (\n'
    '                  <li key={e.id} className={"space-y-3 " + (picked.includes(e.id) ? "rounded-2xl ring-2 ring-primary p-2" : "")}>\n'
    '                    <div className="flex flex-wrap items-start justify-between gap-2">\n'
    '                      <div className="min-w-0">\n'
    '                        <label className="mb-1 flex items-center gap-2 text-sm"><input type="checkbox" checked={picked.includes(e.id)} onChange={() => toggle(e.id)} /> \u0412\u044b\u0431\u0440\u0430\u0442\u044c</label>\n'
    '                        <h2 className="font-display text-base">\u0420\u0430\u0441\u043a\u0440\u043e\u0439 \u00b7 {e.title.replace(/^\u0420\u0430\u0441\u043a\u0440\u043e\u0439\\s*\u00b7\\s*/, "")}</h2>\n'
    '                        {e.colorName ? <p className="text-sm text-muted-foreground">\u0426\u0432\u0435\u0442 {e.colorName}</p> : null}\n'
    '                        <p className="mt-1 tabular text-sm text-steel">{sentFmt.format(e.sentAt)}</p>\n'
    '                      </div>\n'
    '                      <div className="flex shrink-0 gap-1">\n'
    '                        {e.photoId ? <Button size="sm" variant="secondary" onClick={() => void share(e.photoId, e.title)}><Share2 /> \u041f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f</Button> : null}\n'
    '                        <Button size="icon-sm" variant="ghost" onClick={() => void remove(e.id, e.photoId)} aria-label="\u0423\u0434\u0430\u043b\u0438\u0442\u044c"><Trash2 /></Button>\n'
    '                      </div>\n'
    '                    </div>\n'
    '                    {e.bars && e.bars.length > 0 ? (\n'
    '                      <div className="grid min-w-0 gap-3">{e.bars.map((b) => <BarScheme key={b.id} bar={b} />)}</div>\n'
    '                    ) : urls[e.id] ? (\n'
    '                      <button type="button" className="block w-full overflow-hidden rounded-xl border border-border bg-background/50" onClick={() => setPreview(urls[e.id])}>\n'
    '                        <img src={urls[e.id]} alt="" className="max-h-80 w-full object-contain" />\n'
    '                      </button>\n'
    '                    ) : (\n'
    '                      <div className="panel-dash px-4 py-8 text-center text-sm text-muted-foreground">\u041d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445 \u0440\u0430\u0441\u043a\u0440\u043e\u044f</div>\n'
    '                    )}\n'
    '                  </li>\n'
    '                ))}\n'
    '              </ul>\n'
    '            ) : (\n'
    '              <ul className="grid gap-3 sm:grid-cols-2">\n'
    '                {entries.filter((e) => (e.projectId || e.id) === openFolder && entryKind(e) === "scheme").map((e) => (\n'
    '                  <li key={e.id} className={"panel overflow-hidden p-4 " + (picked.includes(e.id) ? "ring-2 ring-primary" : "")}>\n'
    '                    <button type="button" className="block w-full overflow-hidden rounded-xl border border-border bg-background/50" onClick={() => urls[e.id] && setPreview(urls[e.id])}>\n'
    '                      {urls[e.id] ? <img src={urls[e.id]} alt="" className="max-h-52 w-full object-contain" /> : <div className="h-36 bg-muted" />}\n'
    '                    </button>\n'
    '                    <div className="mt-3 flex items-start justify-between gap-2">\n'
    '                      <div className="min-w-0">\n'
    '                        <label className="mb-1 flex items-center gap-2 text-sm"><input type="checkbox" checked={picked.includes(e.id)} onChange={() => toggle(e.id)} /> \u0412\u044b\u0431\u0440\u0430\u0442\u044c</label>\n'
    '                        <p className="font-medium">{e.title}</p>\n'
    '                        {e.colorName ? <p className="text-sm text-muted-foreground">\u0426\u0432\u0435\u0442 {e.colorName}</p> : null}\n'
    '                        <p className="mt-1 tabular text-sm text-steel">{sentFmt.format(e.sentAt)}</p>\n'
    '                      </div>\n'
    '                      <div className="flex shrink-0 gap-1"><Button size="sm" variant="secondary" onClick={() => void share(e.photoId, e.title)}><Share2 /> \u041f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f</Button><Button size="icon-sm" variant="ghost" onClick={() => void remove(e.id, e.photoId)} aria-label="\u0423\u0434\u0430\u043b\u0438\u0442\u044c"><Trash2 /></Button></div>\n'
    '                    </div>\n'
    '                  </li>\n'
    '                ))}\n'
    '              </ul>\n'
    '            )}\n'
    '          </div>\n'
    '        ) : null}'
)
s = s[:start] + rep + s[end:]
s = s.replace(
    "setPicked(entries.filter((e) => (e.projectId || e.id) === openFolder).map((e) => e.id))",
    "setPicked(entries.filter((e) => (e.projectId || e.id) === openFolder && (!openSub || entryKind(e) === openSub)).map((e) => e.id))",
)
s = s.replace(
    'onClick={() => { setOpenFolder(null); setPicked([]); }}',
    'onClick={() => { setOpenFolder(null); setOpenSub(null); setPicked([]); }}',
)
s = s.replace(
    'onClick={() => setOpenFolder(null)}',
    'onClick={() => { setOpenFolder(null); setOpenSub(null); }}',
)
p.write_text(s)
print("archive compact ok", p.stat().st_size)
