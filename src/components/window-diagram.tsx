import wood from "@/assets/wood.jpg";
import glass from "@/assets/glass.jpg";
import wall from "@/assets/wall.jpg";
import slope from "@/assets/slope.jpg";
import { useState } from "react";
import { mm } from "@/lib/format";
import { slopeLength } from "@/lib/pieces";
import type { Opening } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WindowDiagram({ opening, fallbackAllowance, className, onWidth, onHeight }: { opening: Opening; fallbackAllowance: number; className?: string; onWidth?: (n: number) => void; onHeight?: (n: number) => void; onBottom?: (n: number) => void }) {
  const left = opening.sides.left ? slopeLength(opening, "left", fallbackAllowance) : 0;
  const right = opening.sides.right ? slopeLength(opening, "right", fallbackAllowance) : 0;
  const top = opening.sides.top ? slopeLength(opening, "top", fallbackAllowance) : 0;
  const bottom = opening.sides.bottom ? slopeLength(opening, "bottom", fallbackAllowance) : 0;
  const [widthDraft, setWidthDraft] = useState<string | null>(null);
  const [heightDraft, setHeightDraft] = useState<string | null>(null);
  const [bottomDraft, setBottomDraft] = useState<string | null>(null);
  function commit(raw: string, apply?: (n: number) => void) {
    const n = Number(raw.replace(/\D/g, ""));
    if (apply && n >= 1) apply(n);
  }
  return (
    <svg viewBox="-12 0 352 292" className={cn(className)} role="img" aria-label={`Проём ${opening.width} на ${opening.height}`}>
      <defs>
        <pattern id="tex-wall" width="48" height="48" patternUnits="userSpaceOnUse"><image href={wall} width="48" height="48" preserveAspectRatio="xMidYMid slice" /></pattern>
        <pattern id="tex-wood" width="64" height="64" patternUnits="userSpaceOnUse"><image href={wood} width="64" height="64" preserveAspectRatio="xMidYMid slice" /></pattern>
        <pattern id="tex-glass" width="54" height="108" patternUnits="userSpaceOnUse"><image href={glass} width="54" height="108" preserveAspectRatio="xMidYMid slice" /></pattern>
        <pattern id="tex-slope" width="40" height="40" patternUnits="userSpaceOnUse"><image href={slope} width="40" height="40" preserveAspectRatio="xMidYMid slice" /></pattern>
      </defs>
      <rect x="108" y="72" width="132" height="128" fill="url(#tex-wall)" />
      <rect x="116" y="80" width="116" height="112" fill="url(#tex-wood)" stroke="#6d5430" strokeWidth="1.5" />
      <rect x="124" y="88" width="46" height="94" fill="url(#tex-glass)" stroke="#efe2c4" strokeWidth="3" />
      <rect x="174" y="88" width="46" height="94" fill="url(#tex-glass)" stroke="#efe2c4" strokeWidth="3" />
      <path d="M128 92 H166 L152 136 Z" fill="#fff" opacity="0.18" />
      {left ? <rect x="94" y="80" width="14" height="112" fill="url(#tex-slope)" /> : null}
      {right ? <rect x="238" y="80" width="14" height="112" fill="url(#tex-slope)" /> : null}
      {top ? <rect x="116" y="58" width="116" height="14" fill="url(#tex-slope)" /> : null}
      {bottom ? <rect x="116" y="198" width="116" height="14" fill="url(#tex-slope)" /> : null}
      {top ? <text x="174" y="52" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace">{mm(top)}</text> : null}
      {bottom ? <text x="174" y="224" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace">{mm(opening.bottomLength ?? bottom)}</text> : null}
      {bottom ? <foreignObject x="128" y="232" width="92" height="24">
        <input inputMode="numeric" aria-label="Низ" value={bottomDraft ?? String(opening.bottomLength ?? bottom)} onChange={(e) => setBottomDraft(e.target.value.replace(/\D/g, ""))} onBlur={() => { commit(bottomDraft ?? String(opening.bottomLength ?? bottom), onBottom); setBottomDraft(null); }} style={{ width: "100%", height: "22px", borderRadius: "8px", border: "1px solid #3c463f", background: "#121614", color: "#f3f1ec", textAlign: "center", fontSize: "13px" }} />
      </foreignObject> : null}
      {left ? <text x="88" y="136" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace" transform="rotate(-90 88 136)">{mm(left)}</text> : null}
      {right ? <text x="268" y="136" textAnchor="middle" fill="#c4a574" fontSize="11" fontFamily="IBM Plex Mono, monospace" transform="rotate(-90 268 136)">{mm(right)}</text> : null}
      <foreignObject x="128" y="2" width="92" height="24">
        <input inputMode="numeric" aria-label="Ширина" value={widthDraft ?? String(opening.width)} onChange={(e) => setWidthDraft(e.target.value.replace(/\D/g, ""))} onBlur={() => { commit(widthDraft ?? String(opening.width), onWidth); setWidthDraft(null); }} style={{ width: "100%", height: "22px", borderRadius: "8px", border: "1px solid #3c463f", background: "#121614", color: "#f3f1ec", textAlign: "center", fontSize: "13px" }} />
      </foreignObject>
      <foreignObject x="-4" y="118" width="92" height="24" transform="rotate(-90 42 130)">
        <input inputMode="numeric" aria-label="Высота" value={heightDraft ?? String(opening.height)} onChange={(e) => setHeightDraft(e.target.value.replace(/\D/g, ""))} onBlur={() => { commit(heightDraft ?? String(opening.height), onHeight); setHeightDraft(null); }} style={{ width: "92px", height: "22px", borderRadius: "8px", border: "1px solid #3c463f", background: "#121614", color: "#f3f1ec", textAlign: "center", fontSize: "13px" }} />
      </foreignObject>
    </svg>
  );
}
