import { useEffect, useState } from "react";
import { DrawingEditor } from "@/components/drawing-editor";
import { Button } from "@/components/ui/button";
import type { Drawing } from "@/lib/types";

export function SchemeDrawDialog({ open, title, drawing, onOpenChange, onDone }: { open: boolean; title: string; drawing: Drawing; onOpenChange: (open: boolean) => void; onDone: (drawing: Drawing) => void }) {
  const [local, setLocal] = useState(drawing);
  useEffect(() => { if (open) setLocal(drawing); }, [open, drawing]);
  if (!open) return null;
  function close() { onDone(local); onOpenChange(false); }
  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#141816] p-3 pt-8" style={{ pointerEvents: "auto" }}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-[#f3f1ec]">Схема · {title}</h2>
        <Button type="button" onClick={close}>Готово</Button>
      </div>
      <DrawingEditor key={`${drawing.id}-${open}`} drawing={local} onChange={setLocal} compact />
    </div>
  );
}
