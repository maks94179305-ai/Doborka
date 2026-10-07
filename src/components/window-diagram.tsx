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
    <svg viewBox="0 0 340 260" className={cn(className)} role="img" aria-label={`Проём ${opening.width} на ${opening.height}`}>
      <defs>
        <pattern id="wall-grain" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#3a403c" /><path d="M0 4 H8" stroke="#2c312e" strokeWidth="0.6" /></pattern>
        <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#efe2c4" /><stop offset="45%" stopColor="#c9ae78" /><stop offset="100%" stopColor="#8d7044" /></linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#d7eef4" /><stop offset="28%" stopColor="#7eb4c4" /><stop offset="100%" stopColor="#16343c" /></linearGradient>
        <linearGradient id="slope" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f7f4ee" /><stop offset="100%" stopColor="#c9c2b6" /></linearGradient>
      </defs>
      <rect x="92" y="58" width="156" height="150" fill="url(#wall-grain)" />
      <rect x="102" y="68" width="136" height="130" fill="url(#frame)" stroke="#6d5430" strokeWidth="2" />
      <rect x="112" y="78" width="54" height="108" fill="url(#glass)" stroke="#efe2c4" strokeWidth="3" />
      <rect x="170" y="78" width="54" height="108" fill="url(#glass)" stroke="#efe2c4" strokeWidth="3" />
      <path d="M116 82 H160 L146 132 Z" fill="#fff" opacity="0.22" />
      <rect x="102" y="192" width="136" height="8" fill="#8d7044" />
      {left ? <rect x="80" y="68" width="16" height="130" fill="url(#slope)" /> : null}
      {right ? <rect x="244" y="68" width="16" height="130" fill="url(#slope)" /> : null}
      {top ? <rect x="102" y="46" width="136" height="16" fill="url(#slope)" /> : null}
      {bottom ? <rect x="102" y="204" width="136" height="16" fill="url(#slope)" /> : null}
      {top ? <text x="170" y="40" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace">{mm(top)}</text> : null}
      {bottom ? <text x="170" y="234" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace">{mm(bottom)}</text> : null}
      {left ? <text x="64" y="134" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace" transform="rotate(-90 64 134)">{mm(left)}</text> : null}
      {right ? <text x="276" y="134" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace" transform="rotate(-90 276 134)">{mm(right)}</text> : null}
      <foreignObject x="118" y="4" width="104" height="28">
        <input inputMode="numeric" aria-label="Ширина" value={String(opening.width)} onChange={(e) => set(e.target.value, onWidth)} style={{ width: "100%", height: "26px", borderRadius: "8px", border: "1px solid #3c463f", background: "#121614", color: "#f3f1ec", textAlign: "center", fontSize: "13px" }} />
      </foreignObject>
      <foreignObject x="4" y="112" width="58" height="28" transform="rotate(-90 33 126)">
        <input inputMode="numeric" aria-label="Высота" value={String(opening.height)} onChange={(e) => set(e.target.value, onHeight)} style={{ width: "58px", height: "26px", borderRadius: "8px", border: "1px solid #3c463f", background: "#121614", color: "#f3f1ec", textAlign: "center", fontSize: "13px" }} />
      </foreignObject>
    </svg>
  );
}
