import { useEffect, useState } from "react";
import { DrawingEditor } from "@/components/drawing-editor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Drawing } from "@/lib/types";

export function SchemeDrawDialog({ open, title, drawing, onOpenChange, onDone }: { open: boolean; title: string; drawing: Drawing; onOpenChange: (open: boolean) => void; onDone: (drawing: Drawing) => void }) {
  const [local, setLocal] = useState(drawing);
  useEffect(() => { if (open) setLocal(drawing); }, [open, drawing]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent instant title={`Схема · ${title}`} className="fixed inset-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none p-3 duration-0 animate-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(90dvh,44rem)] sm:w-[min(56rem,calc(100vw-1rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:p-4">
        <DrawingEditor key={`${drawing.id}-${open}`} drawing={local} onChange={setLocal} compact />
        <div className="mt-3 flex shrink-0 justify-end pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <Button type="button" className="min-h-11 w-full sm:w-auto" onClick={() => { onDone(local); onOpenChange(false); }}>Готово</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
