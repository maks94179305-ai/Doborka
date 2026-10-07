import { mm } from "@/lib/format";
import { slopeLength } from "@/lib/pieces";
import type { Opening } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WindowDiagram({ opening, fallbackAllowance, className, onWidth, onHeight }: { opening: Opening; fallbackAllowance: number; className?: string; onWidth?: (n: number) => void; onHeight?: (n: number) => void }) {
  const left = opening.sides.left ? slopeLength(opening, "left", fallbackAllowance) : 0;
  const right = opening.sides.right ? slopeLength(opening, "right", fallbackAllowance) : 0;
  const top = opening.sides.top ? slopeLength(opening, "top", fallbackAllowance) : 0;
  const bottom = opening.sides.bottom ? slopeLength(opening, "bottom", fallbackAllowance) : 0;
  function set(raw: string, apply?: (n: number) => void) {
    const n = Number(raw.replace(/\D/g, ""));
    if (apply && n >= 1) apply(n);
  }
  return (
    <svg viewBox="0 0 340 250" className={cn(className)} role="img" aria-label={`Проём ${opening.width} на ${opening.height}`}>
      <rect x="96" y="42" width="148" height="146" rx="3" fill="#2a3330" />
      <rect x="104" y="50" width="132" height="130" fill="#1a2428" stroke="#c8b48a" strokeWidth="6" />
      <rect x="114" y="60" width="52" height="108" fill="#1c4d5c" stroke="#d9c7a2" strokeWidth="3" />
      <rect x="170" y="60" width="52" height="108" fill="#184654" stroke="#d9c7a2" strokeWidth="3" />
      <path d="M116 64 H164 L150 118 Z" fill="#f4f1ea" opacity="0.16" />
      <rect x="104" y="176" width="132" height="8" fill="#b7a98f" />
      {left ? <rect x="84" y="50" width="14" height="130" rx="2" fill="#e7eeea" /> : null}
      {right ? <rect x="242" y="50" width="14" height="130" rx="2" fill="#e7eeea" /> : null}
      {top ? <rect x="104" y="30" width="132" height="14" rx="2" fill="#e7eeea" /> : null}
      {bottom ? <rect x="104" y="186" width="132" height="14" rx="2" fill="#e7eeea" /> : null}
      {top ? <text x="170" y="22" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace">{mm(top)}</text> : null}
      {bottom ? <text x="170" y="214" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace">{mm(bottom)}</text> : null}
      {left ? <text x="70" y="116" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace" transform="rotate(-90 70 116)">{mm(left)}</text> : null}
      {right ? <text x="272" y="116" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace" transform="rotate(-90 272 116)">{mm(right)}</text> : null}
      <foreignObject x="118" y="222" width="104" height="26">
        <input inputMode="numeric" aria-label="Ширина" value={String(opening.width)} onChange={(e) => set(e.target.value, onWidth)} style={{ width: "100%", height: "24px", borderRadius: "8px", border: "1px solid #3c463f", background: "#121614", color: "#f3f1ec", textAlign: "center", fontSize: "13px" }} />
      </foreignObject>
      <foreignObject x="8" y="102" width="58" height="26">
        <input inputMode="numeric" aria-label="Высота" value={String(opening.height)} onChange={(e) => set(e.target.value, onHeight)} style={{ width: "100%", height: "24px", borderRadius: "8px", border: "1px solid #3c463f", background: "#121614", color: "#f3f1ec", textAlign: "center", fontSize: "13px" }} />
      </foreignObject>
    </svg>
  );
}
