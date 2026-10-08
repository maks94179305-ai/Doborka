import { useEffect, useState } from "react";
import { ClipboardPaste, Copy, Download, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_STOCK, SIDE_KEYS, SIDE_SHORT, type Strategy } from "@/lib/types";
import { useProject, useWorkspace } from "@/lib/store";
import { downloadText } from "@/lib/report";
import { PairPanel } from "@/components/pair-panel";
import { SchemeDrawDialog } from "@/components/scheme-draw-dialog";
import { forgetDrawings, loadLibrary, rememberDrawing, saveLibrary, type LibraryDrawing } from "@/lib/drawing-library";
import { renderDrawingToBlob } from "@/lib/draw-render";
import type { Drawing } from "@/lib/types";

type BIPEvent = Event & { prompt: () => Promise<void> };

export function MoreView() {
  const project = useProject();
  const ws = useWorkspace();
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [customStock, setCustomStock] = useState("");
  const [light, setLight] = useState(() => localStorage.getItem("doborka-theme") === "light");
  const [library, setLibrary] = useState<LibraryDrawing[]>(() => loadLibrary());
  useEffect(() => {
    const sync = () => setLibrary(loadLibrary());
    window.addEventListener("doborka-library", sync);
    return () => window.removeEventListener("doborka-library", sync);
  }, []);
  useEffect(() => { for (const d of project?.drawings ?? []) if (d.objects.length) rememberDrawing(d.name, d.objects); }, [project]);

  useEffect(() => {
    const standaloneNow = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone));
    setStandalone(standaloneNow);
    const onbip = (e: Event) => { e.preventDefault(); setInstallEvt(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", onbip);
    return () => window.removeEventListener("beforeinstallprompt", onbip);
  }, []);

  if (!project) return null;
  const st = project.settings;
  function patchSettings(partial: Partial<typeof st>) { ws.patchProject((p) => ({ ...p, settings: { ...p.settings, ...partial } })); }
  function toggleStock(n: number) {
    const has = st.stockLengths.includes(n);
    patchSettings({ stockLengths: has ? st.stockLengths.filter((x) => x !== n) : [...st.stockLengths, n].sort((a, b) => a - b) });
  }
  async function install() {
    if (installEvt) { await installEvt.prompt(); setInstallEvt(null); return; }
    /* desktop has no browser install */
  }
  function exportJson() {
    if (!project) return;
    downloadText(`doborka-${project.name}.json`, JSON.stringify(project, null, 2), "application/json");
  }
  function importJson(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (data && data.openings && data.settings) ws.importProject(data);
      } catch { /* ignore */ }
    };
    reader.readAsText(file);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 pb-8">
      <header><p className="kicker">Доборка</p><h1>Настройки</h1></header>
      <section className="panel p-5">
        <div className="flex items-start gap-3">
          <img src="/icon-192.png?v=pc" alt="" width={56} height={56} className="size-14 shrink-0 rounded-2xl border border-border/70 shadow-panel" />
          <div className="flex-1">
            <h2 className="font-medium">Приложение на телефоне</h2>
            <p className="mt-1 text-sm text-muted-foreground">На Android это ставится как обычное приложение: иконка «Доборка» на главном экране, без строки браузера, работает без интернета.</p>
            {standalone ? <p className="mt-3 text-sm text-ok">Уже установлено на это устройство.</p> : <Button className="mt-3" onClick={() => void install()}><Download /> Установить на телефон</Button>}
          </div>
        </div>
      </section>
      <section className="space-y-3">
        <details className="rounded-xl border border-border bg-card px-3 py-2">
          <summary className="cursor-pointer font-display text-lg">Архив чертежей</summary>
          <ArchiveFolder library={library} />
        </details>
      </section>
      <PairPanel />
      <details className="panel space-y-3 p-4">
        <summary className="cursor-pointer font-display text-lg">Как пользоваться</summary>
        <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
          <p><span className="text-foreground">Откосы.</span> Кнопка «Проём» добавляет окно. Название меняется нажатием на заголовок карточки. Ширина стоит над окном, высота слева. Если включён низ, его длина задаётся отдельно под окном.</p>
          <p><span className="text-foreground">Толщина фасада.</span> Слева, справа, сверху и снизу настраиваются отдельно. Схема стоит сразу под своим полем. Нажатие на схему открывает чертёж. Правка попадает в раскрой этой же толщины.</p>
          <p><span className="text-foreground">Чертёж.</span> Линия рисуется выбранным инструментом. Размер ставится так: включите разметку, нажмите прямо на линию и отведите палец в сторону. Цифру размера можно изменить нажатием на неё.</p>
          <p><span className="text-foreground">Другие элементы.</span> Здесь добавляются доборные детали. Количество меняется плюсом и минусом или вручную. Цвет появляется после чертежа.</p>
          <p><span className="text-foreground">Раскрой.</span> Одинаковые откосы собираются в одну карточку. На хлысте подписано, где 18 мм и где 23 мм. Кнопка «Редактировать» открывает тот же чертёж.</p>
          <p><span className="text-foreground">История.</span> Сюда попадают отправленные схемы. Нажатие открывает схему, двумя пальцами её можно увеличить.</p>
          <p><span className="text-foreground">Синхронизация.</span> В настройках создайте пин-код и введите тот же код на втором устройстве. Объект, чертежи и история станут общими. Проект также хранится на этом устройстве и не пропадает после выхода.</p>
        </div>
      </details>

      <section className="space-y-3">
        <h2 className="font-display text-lg">Объект</h2>
        <label className="grid gap-1.5"><Label>Название</Label><Input value={project.name} onChange={(e) => ws.renameProject(project.id, e.target.value)} /></label>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => ws.addProject()}>Новый объект</Button>
          <Button variant="outline" onClick={() => ws.loadDemo()}>Пример 5 проёмов</Button>
          <Button variant="outline" onClick={exportJson}><Download /> Копия JSON</Button>
          <Button variant="outline" asChild><label>Открыть JSON<input type="file" accept="application/json" className="sr-only" onChange={(e) => { importJson(e.target.files?.[0]); e.target.value = ""; }} /></label></Button>
        </div>
        {ws.projects.length > 1 ? (
          <ul className="grid gap-1">
            {ws.projects.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <button type="button" className={`h-11 flex-1 rounded-lg px-3 text-left text-sm ${p.id === project.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`} onClick={() => ws.setActive(p.id)}>{p.name}</button>
                <Button size="icon-sm" variant="ghost" onClick={() => ws.deleteProject(p.id)} aria-label="Удалить объект"><Trash2 /></Button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-lg">Тема</h2>
        <label className="flex h-11 items-center justify-between rounded-md border border-border px-3">
          <span className="text-sm">Светлая тема</span>
          <Switch checked={light} onCheckedChange={(v) => { setLight(v); localStorage.setItem("doborka-theme", v ? "light" : "dark"); document.documentElement.dataset.theme = v ? "light" : "dark"; window.dispatchEvent(new Event("doborka-theme")); }} />
        </label>
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-lg">Запас и раскрой</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5"><Label>Запас на элемент, мм</Label><Input inputMode="numeric" className="tabular" value={st.defaultAllowance} onChange={(e) => patchSettings({ defaultAllowance: Number(e.target.value) || 0 })} /></label>
          <label className="grid gap-1.5"><Label>Пропил, мм</Label><Input inputMode="numeric" className="tabular" value={st.kerf} onChange={(e) => patchSettings({ kerf: Number(e.target.value) || 0 })} /></label>
          <label className="grid gap-1.5 col-span-2"><Label>Минимальный полезный остаток, мм</Label><Input inputMode="numeric" className="tabular" value={st.minRemainder} onChange={(e) => patchSettings({ minRemainder: Number(e.target.value) || 0 })} /></label>
        </div>
        <div>
          <Label className="mb-2 block">Цель расчёта</Label>
          <div className="grid grid-cols-3 gap-2">
            {([["waste", "Мин. отход"], ["meters", "Мин. метраж"], ["short", "Короткие"]] as [Strategy, string][]).map(([k, label]) => (
              <Button key={k} variant={st.strategy === k ? "default" : "secondary"} size="sm" onClick={() => patchSettings({ strategy: k })}>{label}</Button>
            ))}
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Стороны по умолчанию</Label>
          <div className="grid grid-cols-2 gap-2">
            {SIDE_KEYS.map((k) => (
              <label key={k} className="flex h-11 items-center justify-between rounded-md border border-border px-3">
                <span className="text-sm">{SIDE_SHORT[k]}</span>
                <Switch checked={st.defaultSides[k]} onCheckedChange={(v) => patchSettings({ defaultSides: { ...st.defaultSides, [k]: v } })} />
              </label>
            ))}
          </div>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-lg">Длины хлыстов</h2>
        <p className="text-sm text-muted-foreground">Можно смешивать разные длины — раскрой сам подберёт, с какого хлыста резать.</p>
        <div className="flex flex-wrap gap-2">
          {[...new Set([...DEFAULT_STOCK, ...st.stockLengths])].sort((a, b) => a - b).map((n) => {
            const on = st.stockLengths.includes(n);
            return <button key={n} type="button" onClick={() => toggleStock(n)} className={`h-11 rounded-lg px-3 tabular text-sm ${on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{n}</button>;
          })}
        </div>
        <div className="flex gap-2">
          <Input inputMode="numeric" placeholder="Своя длина" className="tabular" value={customStock} onChange={(e) => setCustomStock(e.target.value.replace(/\D/g, ""))} />
          <Button variant="secondary" onClick={() => { const n = Number(customStock); if (n > 0) { toggleStock(n); setCustomStock(""); } }}>Добавить</Button>
        </div>
      </section>
    </div>
  );
}

function ArchiveFolder({ library }: { library: LibraryDrawing[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [edit, setEdit] = useState<LibraryDrawing | null>(null);
  function copy(item: LibraryDrawing) {
    const payload = JSON.stringify(item.objects);
    localStorage.setItem("doborka-drawing-clip", payload);
    void navigator.clipboard?.writeText(payload);
  }
  return (
    <div className="mt-3 grid gap-2">
      <Button variant="secondary" onClick={() => { const raw = localStorage.getItem("doborka-drawing-clip"); if (!raw) return; try { rememberDrawing("Вставленный чертёж", JSON.parse(raw)); } catch { /* ignore */ } }}><ClipboardPaste /> Вставить</Button>
      {library.length ? <div className="grid grid-cols-2 gap-2">{library.map((item) => (
        <article key={item.id} className={"rounded-xl border bg-card p-2 " + (picked.includes(item.id) ? "border-primary" : "border-border")} onClick={() => setPicked((cur) => cur.includes(item.id) ? cur.filter((id) => id !== item.id) : [...cur, item.id])}>
          <ArchiveShot item={item} />
          <div className="mt-2 flex items-center justify-between gap-1">
            <span className="min-w-0 truncate text-xs">{item.name}</span>
            <span className="flex gap-1">
              <Button size="icon-sm" variant="secondary" aria-label="Редактировать" onClick={(e) => { e.stopPropagation(); setEdit(item); }}><Pencil /></Button>
              <Button size="icon-sm" variant="secondary" aria-label="Копировать" onClick={(e) => { e.stopPropagation(); copy(item); }}><Copy /></Button>
              <Button size="icon-sm" variant="ghost" aria-label="Удалить" onClick={(e) => { e.stopPropagation(); forgetDrawings([item]); }}><Trash2 /></Button>
            </span>
          </div>
        </article>
      ))}</div> : <p className="text-sm text-muted-foreground">Пока нет сохранённых чертежей.</p>}
      {picked.length ? <div className="flex gap-2"><Button variant="secondary" onClick={() => { const items = library.filter((item) => picked.includes(item.id)); const payload = JSON.stringify(items.flatMap((item) => item.objects)); localStorage.setItem("doborka-drawing-clip", payload); void navigator.clipboard?.writeText(payload); }}><Copy /> Копировать выбранные</Button><Button variant="destructive" onClick={() => { forgetDrawings(library.filter((item) => picked.includes(item.id))); setPicked([]); }}><Trash2 /> Удалить выбранные</Button></div> : null}
      {edit ? <SchemeDrawDialog open title={edit.name} drawing={{ id: edit.id, name: edit.name, objects: edit.objects, updatedAt: edit.updatedAt }} onOpenChange={(open) => { if (!open) setEdit(null); }} onDone={(drawing: Drawing) => { saveLibrary(library.map((item) => item.id === edit.id ? { ...item, name: drawing.name, objects: drawing.objects, updatedAt: Date.now() } : item)); setEdit(null); }} /> : null}
    </div>
  );
}
function ArchiveShot({ item }: { item: LibraryDrawing }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let alive = true;
    void renderDrawingToBlob({ id: item.id, name: item.name, objects: item.objects, updatedAt: item.updatedAt }, { w: 640, h: 420 }).then((blob) => {
      if (!blob || !alive) return;
      const next = URL.createObjectURL(blob);
      setUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return next; });
    });
    return () => { alive = false; };
  }, [item]);
  return <figure className="rounded-xl border border-border bg-[#141816] p-1.5">{url ? <img src={url} alt="" className="mx-auto block h-auto w-full object-contain" /> : null}</figure>;
}
