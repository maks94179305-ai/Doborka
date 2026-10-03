import { mm } from "@/lib/format";
import { slopeLength } from "@/lib/pieces";
import type { Opening } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WindowDiagram({ opening, fallbackAllowance, className }: { opening: Opening; fallbackAllowance: number; className?: string }) {
  return (
    <div className={cn("grid place-items-center rounded-xl border border-border bg-background/40 text-sm", className)}>
      <p className="tabular">{opening.width}×{opening.height} мм</p>
      <p className="text-xs text-muted-foreground">бок {mm(slopeLength(opening, "left", fallbackAllowance))}</p>
    </div>
  );
}
