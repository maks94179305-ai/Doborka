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
      <DialogContent instant title={`Схема · ${title}`} className="flex h-[min(90dvh,44rem)] w-[min(56rem,calc(100vw-1rem))] flex-col overflow-hidden p-4 duration-0 animate-none">
        <DrawingEditor key={`${drawing.id}-${open}`} drawing={local} onChange={setLocal} compact />
        <div className="mt-3 flex shrink-0 justify-end">
          <Button type="button" onClick={() => { onDone(local); onOpenChange(false); }}>Готово</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
