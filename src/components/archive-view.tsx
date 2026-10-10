import { useEffect, useRef, useState } from "react";
import { Pencil, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePhoto, getPhoto } from "@/lib/photos";
import { shareFiles, shareOrSave } from "@/lib/share-native";
import { useProject, useWorkspace } from "@/lib/store";
import { unpublishHistory } from "@/lib/team-sync";

const sentFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

function SchemeZoom({ src, onClose }: { src: string; onClose: () => void }) {
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number; x: number; y: number } | null>(null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  function onDown(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1, scale: view.scale, x: view.x, y: view.y };
    }
  }
  function onMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2 && pinch.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const scale = Math.min(6, Math.max(1, pinch.current.scale * (dist / pinch.current.dist)));
      setView({ scale, x: (pts[0].x + pts[1].x) / 2 - window.innerWidth / 2, y: (pts[0].y + pts[1].y) / 2 - window.innerHeight / 2 });
    }
  }
  function onUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  }
  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[#161618] px-4 py-4 pt-[max(1.25rem,env(safe-area-inset-top))]" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <div className="flex justify-end"><button type="button" className="rounded-lg bg-[#e8e4d8] px-4 py-2 text-[#141816]" onClick={onClose}>Закрыть</button></div>
      <img src={src} alt="" className="mt-3 max-h-[80vh] w-full object-contain" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformOrigin: "center center", touchAction: "none" }} />
    </div>
  );
}
export function ArchiveView() {
  const project = useProject();
  const removeArchiveEntry = useWorkspace((s) => s.removeArchiveEntry);
  const renameArchiveProject = useWorkspace((s) => s.renameArchiveProject);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [sharing, setSharing] = useState(false);
  const entries = project?.archive ?? [];
  const [photoRev, setPhotoRev] = useState(0);
  const photoKey = entries.map((e) => e.photoId).join("|");
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useEffect(() => {
    const onPhotos = () => setPhotoRev((n) => n + 1);
    window.addEventListener("doborka-photos", onPhotos);
    return () => window.removeEventListener("doborka-photos", onPhotos);
  }, []);

  useEffect(() => {
    let live = true;
    const fresh: string[] = [];
    const list = entriesRef.current;
    void (async () => {
      const next: Record<string, string> = {};
      for (const e of list) {
        try {
          const blob = await getPhoto(e.photoId);
          if (!live || !blob) continue;
          const u = URL.createObjectURL(blob);
          fresh.push(u);
          next[e.id] = u;
        } catch { /* ignore */ }
      }
      if (live) setUrls(next);
    })();
    return () => { live = false; fresh.forEach((u) => URL.revokeObjectURL(u)); };
  }, [photoKey, photoRev]);

  function toggle(id: string) {
    setPicked((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }

  async function filesOf(list: { photoId: string; title: string }[]) {
    const files: File[] = [];
    for (const [i, item] of list.entries()) {
      const blob = await getPhoto(item.photoId);
      if (!blob) continue;
      files.push(new File([blob], `doborka-${i + 1}-${Date.now()}-${(item.title || "schema").replace(/[^\wа-яА-ЯёЁ-]+/g, "_").slice(0, 20)}.png`, { type: blob.type || "image/png" }));
    }
    return files;
  }

  async function share(photoId: string, title: string) {
    const files = await filesOf([{ photoId, title }]);
    if (files[0]) await shareOrSave(files[0], title || "Схема · Доборка");
  }

  async function sharePicked() {
    if (sharing || !picked.length) return;
    setSharing(true);
    try {
      const chosen = entries.filter((e) => picked.includes(e.id) && (!openFolder || (e.projectId || e.id) === openFolder));
      const files = await filesOf(chosen);
      if (files.length) await shareFiles(files, "Схемы · Доборка");
    } finally {
      setSharing(false);
    }
  }

  async function remove(id: string, photoId: string) {
    await deletePhoto(photoId);
    removeArchiveEntry(id);
    void unpublishHistory(id);
    if (preview && urls[id] === preview) setPreview(null);
  }

  async function removeFolder(folderId: string) {
    const items = entries.filter((e) => (e.projectId || e.id) === folderId);
    for (const item of items) {
      await deletePhoto(item.photoId);
      removeArchiveEntry(item.id);
      void unpublishHistory(item.id);
    }
    setPicked((cur) => cur.filter((id) => !items.some((item) => item.id === id)));
    if (openFolder === folderId) setOpenFolder(null);
    setPreview(null);
  }

  function startRename(folderId: string, current: string) {
    setRenaming(folderId);
    setRenameDraft(current);
  }

  function commitRename() {
    if (!renaming) return;
    const name = renameDraft.trim();
    if (name) renameArchiveProject(renaming, name);
    setRenaming(null);
    setRenameDraft("");
  }

  if (!project) return null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <p className="kicker">История</p>
        <h1>История заказов</h1>
        <p className="mt-1 text-sm text-muted-foreground">{openFolder ? "Отметьте карточки в папке и отправьте сразу несколько." : "Откройте папку, чтобы выбрать и поделиться схемами."}</p>
        {openFolder && entries.length ? <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPicked(entries.filter((e) => (e.projectId || e.id) === openFolder).map((e) => e.id))}>Выбрать все</Button>
          <Button size="sm" variant="secondary" onClick={() => setPicked([])} disabled={!picked.length}>Снять выбор</Button>
          <Button size="sm" onClick={() => void sharePicked()} disabled={!picked.length || sharing}><Share2 /> {sharing ? "Отправляем…" : `Поделиться выбранными${picked.length ? ` (${picked.length})` : ""}`}</Button>
        </div> : null}
      </header>
      {entries.length === 0 ? (
        <div className="panel-dash px-5 py-12 text-center">
          <p className="font-display text-lg">Пока пусто</p>
          <p className="mt-1 text-sm text-muted-foreground">Нажмите «Поделиться» на схеме в раскрое — карточка появится здесь.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {openFolder ? <div className="flex gap-2"><Button variant="secondary" onClick={() => { setOpenFolder(null); setPicked([]); }}>Назад к папкам</Button><Button variant="secondary" onClick={() => void removeFolder(openFolder)}><Trash2 /> Удалить папку</Button></div> : null}
          {(openFolder ? entries.filter((e) => (e.projectId || e.id) === openFolder) : Object.values(entries.reduce<Record<string, typeof entries[number]>>((acc, e) => { const key = e.projectId || e.id; acc[key] ??= e; return acc; }, {}))).map((e) => (
          openFolder ? null : (
            <div key={e.projectId || e.id} className="panel flex w-full items-center justify-between p-4 text-left">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { if (renaming) return; setOpenFolder(e.projectId || e.id); }}>
                {renaming === (e.projectId || e.id) ? (
                  <input
                    autoFocus
                    value={renameDraft}
                    onClick={(ev) => ev.stopPropagation()}
                    onChange={(ev) => setRenameDraft(ev.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(ev) => { if (ev.key === "Enter") commitRename(); if (ev.key === "Escape") setRenaming(null); }}
                    className="w-full rounded-md border border-border bg-background px-2 py-1 font-display text-2xl outline-none"
                    aria-label="Название папки"
                  />
                ) : (
                  <span className="font-display text-2xl">{e.projectId ? (e.projectName || "Папка") : e.title}</span>
                )}
                <span className="mt-1 block text-sm text-muted-foreground">{entries.filter((x) => (x.projectId || x.id) === (e.projectId || e.id)).length} карт. · {dayFmt.format(e.sentAt)}</span>
              </button>
              <span className="flex items-center gap-1">
                {e.projectId ? (
                  <Button size="icon-sm" variant="ghost" onClick={(ev) => { ev.stopPropagation(); startRename(e.projectId!, e.projectName || ""); }} aria-label="Переименовать папку"><Pencil /></Button>
                ) : null}
                <Button size="icon-sm" variant="ghost" onClick={(ev) => { ev.stopPropagation(); void removeFolder(e.projectId || e.id); }} aria-label="Удалить папку"><Trash2 /></Button>
                <button type="button" className="text-steel" onClick={() => setOpenFolder(e.projectId || e.id)}>Открыть</button>
              </span>
            </div>
          )))}
          {openFolder ? <ul className="grid gap-3 sm:grid-cols-2">{entries.filter((e) => (e.projectId || e.id) === openFolder).map((e) => (
            <li key={e.id} className={"panel overflow-hidden p-4 " + (picked.includes(e.id) ? "ring-2 ring-primary" : "")}>
              <button type="button" className="block w-full overflow-hidden rounded-xl border border-border bg-background/50" onClick={() => urls[e.id] && setPreview(urls[e.id])} aria-label="Открыть карточку">
                {urls[e.id] ? <img src={urls[e.id]} alt="" className="max-h-52 w-full object-contain" /> : <div className="h-36 bg-muted" />}
              </button>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <label className="mb-1 flex items-center gap-2 text-sm"><input type="checkbox" checked={picked.includes(e.id)} onChange={() => toggle(e.id)} /> Выбрать</label>
                  <p className="font-medium">{e.title}</p>
                  {e.colorName ? <p className="text-sm text-muted-foreground">Цвет {e.colorName}</p> : null}
                  <p className="mt-1 tabular text-sm text-steel">{sentFmt.format(e.sentAt)}</p>
                </div>
                <div className="flex shrink-0 gap-1"><Button size="sm" variant="secondary" onClick={() => void share(e.photoId, e.title)}><Share2 /> Поделиться</Button><Button size="icon-sm" variant="ghost" onClick={() => void remove(e.id, e.photoId)} aria-label="Удалить из архива"><Trash2 /></Button></div>
              </div>
            </li>
          ))}</ul> : null}
        </div>
      )}
      {preview ? <SchemeZoom src={preview} onClose={() => setPreview(null)} /> : null}
    </div>
  );
}
