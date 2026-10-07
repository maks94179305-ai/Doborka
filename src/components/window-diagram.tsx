import { mm } from "@/lib/format";
import { slopeLength } from "@/lib/pieces";
import type { Opening } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WindowDiagram({ opening, fallbackAllowance, className }: { opening: Opening; fallbackAllowance: number; className?: string }) {
  const left = opening.sides.left ? slopeLength(opening, "left", fallbackAllowance) : 0;
  const right = opening.sides.right ? slopeLength(opening, "right", fallbackAllowance) : 0;
  const top = opening.sides.top ? slopeLength(opening, "top", fallbackAllowance) : 0;
  const bottom = opening.sides.bottom ? slopeLength(opening, "bottom", fallbackAllowance) : 0;
  return (
    <svg viewBox="0 0 280 180" className={cn(className)} role="img" aria-label={`Проём ${opening.width} на ${opening.height}`}>
      <rect x="78" y="36" width="124" height="96" fill="#1c2420" stroke="#8fa39a" strokeWidth="3" />
      <rect x="92" y="48" width="96" height="72" fill="#163038" stroke="#6d8b94" />
      {left ? <rect x="62" y="36" width="12" height="96" fill="#d7dfd9" stroke="#8fa39a" /> : null}
      {right ? <rect x="206" y="36" width="12" height="96" fill="#d7dfd9" stroke="#8fa39a" /> : null}
      {top ? <rect x="78" y="20" width="124" height="12" fill="#d7dfd9" stroke="#8fa39a" /> : null}
      {bottom ? <rect x="78" y="136" width="124" height="12" fill="#d7dfd9" stroke="#8fa39a" /> : null}
      <text x="140" y="168" textAnchor="middle" fill="#f3f1ec" fontSize="13" fontFamily="IBM Plex Mono, monospace">{opening.width} мм</text>
      <text x="28" y="88" textAnchor="middle" fill="#f3f1ec" fontSize="13" fontFamily="IBM Plex Mono, monospace" transform="rotate(-90 28 88)">{opening.height} мм</text>
      {left ? <text x="68" y="84" textAnchor="middle" fill="#c4a574" fontSize="10" fontFamily="IBM Plex Mono, monospace" transform="rotate(-90 68 84)">{mm(left)}</text> : null}
      {right ? <text x="212" y="84" textAnchor="middle" fill="#c4a574" fontSize="10" fontFamily="IBM Plex Mono, monospace" transform="rotate(-90 212 84)">{mm(right)}</text> : null}
      {top ? <text x="140" y="16" textAnchor="middle" fill="#c4a574" fontSize="10" fontFamily="IBM Plex Mono, monospace">{mm(top)}</text> : null}
      {bottom ? <text x="140" y="146" textAnchor="middle" fill="#c4a574" fontSize="10" fontFamily="IBM Plex Mono, monospace">{mm(bottom)}</text> : null}
    </svg>
  );
}
