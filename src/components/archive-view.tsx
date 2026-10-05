import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePhoto, getPhoto } from "@/lib/photos";
import { useProject, useWorkspace } from "@/lib/store";
import { unpublishHistory } from "@/lib/team-sync";

const sentFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

export function ArchiveView() {
  const project = useProject();
  const removeArchiveEntry = useWorkspace((s) => s.removeArchiveEntry);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);
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

  async function remove(id: string, photoId: string) {
    await deletePhoto(photoId);
    removeArchiveEntry(id);
    void unpublishHistory(id);
    if (preview && urls[id] === preview) setPreview(null);
  }

  if (!project) return null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header>
        <p className="kicker">История</p>
        <h1>История заказов</h1>
        <p className="mt-1 text-sm text-muted-foreground">Общая для компьютера и телефона. Карточки, которыми делились, видят все, кто открыл Доборку.</p>
      </header>
      {entries.length === 0 ? (
        <div className="panel-dash px-5 py-12 text-center">
          <p className="font-display text-lg">Пока пусто</p>
          <p className="mt-1 text-sm text-muted-foreground">Нажмите «Поделиться» на схеме в раскрое — карточка появится здесь.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(entries.reduce<Record<string, typeof entries>>((acc, e) => { const day = dayFmt.format(e.sentAt); (acc[day] ??= []).push(e); return acc; }, {})).map(([day, items]) => (
          <section key={day}>
            <h2 className="mb-3 font-display text-3xl text-[#f3f1ec]">{day}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((e) => (
            <li key={e.id} className="panel overflow-hidden p-4">
              <button type="button" className="block w-full overflow-hidden rounded-xl border border-border bg-background/50" onClick={() => urls[e.id] && setPreview(urls[e.id])} aria-label="Открыть карточку">
                {urls[e.id] ? <img src={urls[e.id]} alt="" className="max-h-52 w-full object-contain" /> : <div className="h-36 bg-muted" />}
              </button>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{e.title}</p>
                  {e.colorName ? <p className="text-sm text-muted-foreground">Цвет {e.colorName}</p> : null}
                  <p className="mt-1 tabular text-sm text-steel">{sentFmt.format(e.sentAt)}</p>
                </div>
                <Button size="icon-sm" variant="ghost" onClick={() => void remove(e.id, e.photoId)} aria-label="Удалить из архива"><Trash2 /></Button>
              </div>
            </li>
          ))}
            </ul>
          </section>
          ))}
        </div>
      )}
      {preview ? <section className="panel space-y-3 p-3"><div className="flex justify-end"><button type="button" className="underline" onClick={() => setPreview(null)}>Закрыть</button></div><img src={preview} alt="" className="max-h-[50vh] w-full object-contain" /></section> : null}
    </div>
  );
}
