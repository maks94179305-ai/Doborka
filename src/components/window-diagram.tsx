import { useId } from "react";
import { mm } from "@/lib/format";
import { slopeLength } from "@/lib/pieces";
import type { Opening, SideKey } from "@/lib/types";
import { cn } from "@/lib/utils";

type Pt = { x: number; y: number };

function p(a: Pt, b: Pt, c: Pt, d: Pt) {
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${b.x.toFixed(1)} ${b.y.toFixed(1)} L${c.x.toFixed(1)} ${c.y.toFixed(1)} L${d.x.toFixed(1)} ${d.y.toFixed(1)} Z`;
}
function iso(ox: number, oy: number, x: number, y: number, z: number): Pt {
  return { x: ox + x * 0.9 + y * 0.42, y: oy - z * 0.86 + y * 0.26 };
}
function prism(ox: number, oy: number, x: number, y: number, z: number, w: number, d: number, h: number) {
  const P = (xx: number, yy: number, zz: number) => iso(ox, oy, xx, yy, zz);
  const a = P(x, y, z);
  const b = P(x + w, y, z);
  const c = P(x + w, y + d, z);
  const e = P(x, y + d, z);
  const f = P(x, y, z + h);
  const g = P(x + w, y, z + h);
  const i = P(x + w, y + d, z + h);
  const j = P(x, y + d, z + h);
  return { back: p(a, b, g, f), left: p(a, e, j, f), right: p(b, c, i, g), top: p(f, g, i, j), front: p(e, c, i, j), bottom: p(a, b, c, e), center: { x: (f.x + i.x) / 2, y: (f.y + i.y) / 2 } };
}
function Metal({ faces, ids }: { faces: ReturnType<typeof prism>; ids: { top: string; side: string; front: string } }) {
  return (
    <g>
      <path d={faces.back} fill={`url(#${ids.side})`} />
      <path d={faces.left} fill={`url(#${ids.side})`} />
      <path d={faces.bottom} fill="#5d6e67" />
      <path d={faces.right} fill={`url(#${ids.side})`} stroke="#3f4c47" strokeWidth="0.6" />
      <path d={faces.top} fill={`url(#${ids.top})`} stroke="#d7dfd9" strokeWidth="0.5" />
      <path d={faces.front} fill={`url(#${ids.front})`} stroke="#4a5a54" strokeWidth="0.7" />
    </g>
  );
}
function Callout({ at, text, dx, dy }: { at: Pt; text: string; dx: number; dy: number }) {
  const tx = at.x + dx;
  const ty = at.y + dy;
  return (
    <g>
      <line x1={at.x} y1={at.y} x2={tx} y2={ty} stroke="#c4a574" strokeWidth="0.9" strokeDasharray="2.5 2.5" />
      <circle cx={at.x} cy={at.y} r="1.6" fill="#c4a574" />
      <rect x={tx - 34} y={ty - 8} width="68" height="15" rx="3" fill="#121614" fillOpacity="0.82" />
      <text x={tx} y={ty + 3} textAnchor="middle" fill="#f1eee6" fontSize="9" fontFamily="IBM Plex Mono, monospace">{text}</text>
    </g>
  );
}

export function WindowDiagram({ opening, fallbackAllowance, className }: { opening: Opening; fallbackAllowance: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const a = opening.allowance ?? fallbackAllowance;
  const lens: Record<SideKey, number> = {
    left: opening.sides.left ? slopeLength(opening, "left", fallbackAllowance) : 0,
    right: opening.sides.right ? slopeLength(opening, "right", fallbackAllowance) : 0,
    top: opening.sides.top ? slopeLength(opening, "top", fallbackAllowance) : 0,
    bottom: opening.sides.bottom ? slopeLength(opening, "bottom", fallbackAllowance) : 0,
  };
  const W = 118, H = 88, D = 26, th = 7, E = 15, ox = 78, oy = 198;
  const ids = { top: `${id}-mt`, side: `${id}-ms`, front: `${id}-mf` };
  const wallL = prism(ox, oy, -20, -8, -16, 20, 10, H + 32);
  const wallR = prism(ox, oy, W, -8, -16, 20, 10, H + 32);
  const wallSill = prism(ox, oy, 0, -8, -16, W, 10, 16);
  const wallHead = prism(ox, oy, 0, -8, H, W, 10, 16);
  const jambL = prism(ox, oy, 0, -8, 0, 5, 10, H);
  const jambR = prism(ox, oy, W - 5, -8, 0, 5, 10, H);
  const jambT = prism(ox, oy, 0, -8, H - 5, W, 10, 5);
  const jambB = prism(ox, oy, 0, -8, 0, W, 10, 5);
  const glass = prism(ox, oy, 9, -1, 9, W - 18, 2.5, H - 18);
  const left = prism(ox, oy, -th - E, 2, 0, th, D, H);
  const right = prism(ox, oy, W + E, 2, 0, th, D, H);
  const top = prism(ox, oy, 0, 2, H + E, W, D, th);
  const bottom = prism(ox, oy, 0, 2, -th - E, W, D, th);
  return (
    <svg viewBox="0 0 360 268" className={cn(className)} role="img" aria-label={`Проём ${opening.width} на ${opening.height}`}>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2a3330" /><stop offset="100%" stopColor="#161c19" /></linearGradient>
        <linearGradient id={ids.top} x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#8fa39a" /><stop offset="100%" stopColor="#dfe6e1" /></linearGradient>
        <linearGradient id={ids.side} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6d8178" /><stop offset="100%" stopColor="#3e4c46" /></linearGradient>
        <linearGradient id={ids.front} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b7c4bc" /><stop offset="55%" stopColor="#8fa39a" /><stop offset="100%" stopColor="#5c6e66" /></linearGradient>
        <linearGradient id={`${id}-glass`} x1="0.1" y1="0" x2="0.8" y2="1"><stop offset="0%" stopColor="#a9d0db" stopOpacity="0.4" /><stop offset="42%" stopColor="#1a333c" stopOpacity="0.94" /><stop offset="100%" stopColor="#0b161b" /></linearGradient>
        <radialGradient id={`${id}-shade`} cx="50%" cy="70%" r="50%"><stop offset="0%" stopColor="#000" stopOpacity="0.28" /><stop offset="100%" stopColor="#000" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="188" cy="246" rx="118" ry="10" fill={`url(#${id}-shade)`} />
      <path d={wallL.left} fill="#151b18" /><path d={wallL.top} fill="#2a3330" /><path d={wallL.front} fill="#1c2420" />
      <path d={wallR.right} fill="#101614" /><path d={wallR.top} fill="#262e2b" /><path d={wallR.front} fill="#161c19" />
      <path d={wallSill.top} fill="#2e3733" /><path d={wallSill.front} fill="#1a211e" />
      <path d={wallHead.top} fill="#323c38" /><path d={wallHead.front} fill="#1e2622" />
      <path d={jambL.right} fill="#121816" /><path d={jambR.left} fill="#1a211e" /><path d={jambT.bottom} fill="#141a17" /><path d={jambB.top} fill="#24302c" />
      <path d={glass.front} fill={`url(#${id}-glass)`} stroke="#4a656c" strokeWidth="1.1" />
      <path d={`M${iso(ox, oy, 18, 0, H - 22).x.toFixed(1)} ${iso(ox, oy, 18, 0, H - 22).y.toFixed(1)} L${iso(ox, oy, W - 36, 1, H - 38).x.toFixed(1)} ${iso(ox, oy, W - 36, 1, H - 38).y.toFixed(1)} L${iso(ox, oy, W - 48, 1, H - 46).x.toFixed(1)} ${iso(ox, oy, W - 48, 1, H - 46).y.toFixed(1)} L${iso(ox, oy, 14, 0, H - 28).x.toFixed(1)} ${iso(ox, oy, 14, 0, H - 28).y.toFixed(1)} Z`} fill="#e8e4d8" opacity="0.14" />
      <line x1={iso(ox, oy, W / 2, 1, 14).x} y1={iso(ox, oy, W / 2, 1, 14).y} x2={iso(ox, oy, W / 2, 1, H - 14).x} y2={iso(ox, oy, W / 2, 1, H - 14).y} stroke="#9bb0a6" strokeOpacity="0.28" strokeWidth="1" />
      {opening.sides.bottom ? <Metal faces={bottom} ids={ids} /> : null}
      {opening.sides.left ? <Metal faces={left} ids={ids} /> : null}
      {opening.sides.right ? <Metal faces={right} ids={ids} /> : null}
      {opening.sides.top ? <Metal faces={top} ids={ids} /> : null}
      {opening.sides.left && lens.left ? <Callout at={left.center} text={mm(lens.left)} dx={-42} dy={8} /> : null}
      {opening.sides.right && lens.right ? <Callout at={right.center} text={mm(lens.right)} dx={44} dy={6} /> : null}
      {opening.sides.top && lens.top ? <Callout at={top.center} text={mm(lens.top)} dx={0} dy={-18} /> : null}
      {opening.sides.bottom && lens.bottom ? <Callout at={bottom.center} text={mm(lens.bottom)} dx={0} dy={20} /> : null}
      <text x="18" y="22" fill="#9bb0a6" fontSize="10" fontFamily="Manrope, sans-serif">{opening.width}×{opening.height} · запас {a} мм</text>
      {opening.qty > 1 ? <text x="342" y="22" textAnchor="end" fill="#f1eee6" fontSize="12" fontFamily="IBM Plex Mono, monospace">×{opening.qty}</text> : null}
    </svg>
  );
}
