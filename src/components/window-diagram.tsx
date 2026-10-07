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
    <svg viewBox="0 0 320 220" className={cn(className)} role="img" aria-label={`Проём ${opening.width} на ${opening.height}`}>
      <rect x="108" y="48" width="104" height="108" rx="4" fill="#1b2421" stroke="#9aafa6" strokeWidth="2.5" />
      <rect x="122" y="62" width="76" height="80" rx="2" fill="#14343c" stroke="#6d8b94" />
      {left ? <rect x="92" y="48" width="12" height="108" rx="2" fill="#e7eeea" /> : null}
      {right ? <rect x="216" y="48" width="12" height="108" rx="2" fill="#e7eeea" /> : null}
      {top ? <rect x="108" y="32" width="104" height="12" rx="2" fill="#e7eeea" /> : null}
      {bottom ? <rect x="108" y="160" width="104" height="12" rx="2" fill="#e7eeea" /> : null}
      {top ? <text x="160" y="22" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace">{mm(top)}</text> : null}
      {bottom ? <text x="160" y="188" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace">{mm(bottom)}</text> : null}
      {left ? <text x="78" y="104" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace" transform="rotate(-90 78 104)">{mm(left)}</text> : null}
      {right ? <text x="246" y="104" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace" transform="rotate(-90 246 104)">{mm(right)}</text> : null}
    </svg>
  );
}
