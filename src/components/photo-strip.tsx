import { fileToBlob, savePhoto } from "@/lib/photos";
import { uid } from "@/lib/utils";

export function PhotoStrip({ ids, onChange }: { ids: string[]; onChange: (ids: string[]) => void; variant?: string; extraActions?: unknown; previewAside?: unknown; shareCard?: unknown; onEdit?: (id: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">{ids.length} фото</span>
      <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm">
        Добавить фото
        <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const id = uid("ph"); await savePhoto(id, await fileToBlob(file)); onChange([...ids, id]); e.target.value = ""; }} />
      </label>
    </div>
  );
}
