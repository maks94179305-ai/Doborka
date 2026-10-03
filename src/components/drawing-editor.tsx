import type { Drawing } from "@/lib/types";

export function DrawingEditor({ drawing }: { drawing: Drawing; onChange: (d: Drawing) => void; compact?: boolean }) {
  return <p className="text-sm text-muted-foreground">Чертёж: {drawing.name}. Полный редактор будет в следующей загрузке.</p>;
}
