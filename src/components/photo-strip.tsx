import { useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, FileUp, ImagePlus, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePhoto, fileToBlob, getPhoto, savePhoto } from "@/lib/photos";
import { composeWindowShot, shareOrSave, type ShareCardMeta } from "@/lib/share-image";
import { useWorkspace } from "@/lib/store";
import { publishHistory } from "@/lib/team-sync";
import { cn, uid } from "@/lib/utils";

export function PhotoStrip({ ids, onChange, variant = "photos", previewAside, extraActions, shareCard, onEdit }: { ids: string[]; onChange: (ids: string[]) => void; variant?: "photos" | "scheme"; previewAside?: ReactNode; extraActions?: ReactNode; shareCard?: ShareCardMeta; onEdit?: (photoId: string) => void }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [shareState, setShareState] = useState<"idle" | "busy" | "shared" | "saved">("idle");
  const [photoRev, setPhotoRev] = useState(0);
  const addArchiveEntry = useWorkspace((s) => s.addArchiveEntry);
  const urlsRef = useRef(urls);
  urlsRef.current = urls;
  const scheme = variant === "scheme";
  const preview = previewId ? urls[previewId] : null;
  const idsKey = ids.join("|");
  const idsRef = useRef(ids);
  idsRef.current = ids;

  useEffect(() => {
    let live = true;
    const fresh: string[] = [];
    const list = idsRef.current;
    void (async () => {
      const next: Record<string, string> = {};
      for (const id of list) {
        try {
          const blob = await getPhoto(id);
          if (!live || !blob) continue;
          const u = URL.createObjectURL(blob);
          fresh.push(u);
          next[id] = u;
        } catch { /* ignore */ }
      }
      if (live) setUrls(next);
    })();
    return () => { live = false; fresh.forEach((u) => URL.revokeObjectURL(u)); };
  }, [idsKey, photoRev]);

  useEffect(() => {
    const onPhotos = () => setPhotoRev((n) => n + 1);
    window.addEventListener("doborka-photos", onPhotos);
    return () => window.removeEventListener("doborka-photos", onPhotos);
  }, []);

  useEffect(() => { if (!previewId) setShareState("idle"); }, [previewId]);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const added: string[] = [];
    for (const file of [...files]) {
      if (!file.type.startsWith("image/")) continue;
      const id = uid("ph");
      await savePhoto(id, await fileToBlob(file));
      added.push(id);
    }
    if (added.length) onChange([...ids, ...added]);
  }

  async function remove(id: string) {
    await deletePhoto(id);
    onChange(ids.filter((x) => x !== id));
  }

  async function share() {
    if (!preview || shareState === "busy") return;
    setShareState("busy");
    try {
      const file = await composeWindowShot(preview, shareCard);
      const result = await shareOrSave(file, scheme ? "Схема · Доборка" : "Фото · Доборка");
      if (result !== "cancelled") {
        const photoId = uid("ph");
        await savePhoto(photoId, file);
        const entry = addArchiveEntry({ photoId, title: shareCard?.title ?? (scheme ? "Схема" : "Фото"), colorName: shareCard?.colorName });
        void publishHistory(entry, file);
      }
      setShareState(result === "cancelled" ? "idle" : result);
    } catch {
      setShareState("idle");
    }
  }

  return (
    <div className="space-y-2">
      <div className={cn("flex flex-wrap gap-2", scheme && "gap-3")}>
        {ids.map((id) => (
          <div key={id} className={cn("relative overflow-hidden rounded-lg border border-border bg-background/60", scheme ? "h-28 w-40 max-w-full" : "size-20")}>
            {urls[id] ? (
              <button type="button" className="size-full" onClick={() => setPreviewId(id)} aria-label={scheme ? "Открыть схему" : "Открыть фото"}>
                <img src={urls[id]} alt="" className={cn("size-full", scheme ? "object-contain p-1" : "object-cover")} />
              </button>
            ) : <div className="size-full bg-muted" />}
            <button type="button" className="absolute right-1 top-1 rounded-full bg-background/80 p-1" onClick={() => void remove(id)} aria-label={scheme ? "Удалить схему" : "Удалить фото"}>
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="relative inline-flex h-11 min-h-11 cursor-pointer items-center gap-2 overflow-hidden rounded-md border border-border bg-transparent px-3 text-xs font-medium whitespace-nowrap hover:bg-accent">
          <Camera className="size-4" /> Камера
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
        </label>
        <label className="relative inline-flex h-11 min-h-11 cursor-pointer items-center gap-2 overflow-hidden rounded-md border border-border bg-transparent px-3 text-xs font-medium whitespace-nowrap hover:bg-accent">
          {scheme ? <FileUp className="size-4" /> : <ImagePlus className="size-4" />} {scheme ? "Файл" : "Галерея"}
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
        </label>
        {extraActions}
      </div>
      {previewId && preview ? (
        <section className="panel space-y-3 p-3">
          <div className="flex items-center justify-between"><h3 className="font-medium">{scheme ? "Схема" : "Фото"}</h3><Button type="button" onClick={() => setPreviewId(null)}>Закрыть</Button></div>
          <img src={preview} alt="" className="max-h-[42vh] w-full object-contain" />
          {previewAside}
          <div className="flex gap-2">
            {scheme && onEdit && previewId ? <Button type="button" variant="secondary" onClick={() => { const id = previewId; setPreviewId(null); onEdit(id); }}>Редактировать</Button> : null}
            <Button type="button" onClick={() => void share()} disabled={shareState === "busy"}>{shareState === "busy" ? "Готовлю…" : "Поделиться"}</Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
