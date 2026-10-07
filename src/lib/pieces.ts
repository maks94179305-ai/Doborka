import { DEFAULT_PROFILE_COLOR, EXTRA_COLORS, extraPreset, OPENING_COLORS, SIDE_LABEL, SIDE_SHORT, type ExtraItem, type ExtraKind, type NeedPiece, type Opening, type Project } from "./types";

export function allowanceOf(opening: Opening, fallback: number): number {
  return opening.allowance ?? fallback;
}

export function slopeLength(opening: Opening, side: "left" | "right" | "top" | "bottom", fallbackAllowance: number): number {
  const a = allowanceOf(opening, fallbackAllowance);
  if (side === "left" || side === "right") return opening.height + a;
  if (side === "bottom" && opening.bottomLength) return opening.bottomLength;
  return opening.width + a;
}

export function collectPieces(project: Project): NeedPiece[] {
  const pieces: NeedPiece[] = [];
  const { defaultAllowance } = project.settings;
  project.openings.forEach((opening, oi) => {
    const color = OPENING_COLORS[oi % OPENING_COLORS.length];
    const qty = Math.max(1, Math.round(opening.qty) || 1);
    for (let instance = 1; instance <= qty; instance++) {
      const tag = qty > 1 ? ` · ${instance}` : "";
      (["left", "right", "top", "bottom"] as const).forEach((side) => {
        if (!opening.sides[side]) return;
        const profileMm = opening.facade?.[side] ?? 18;
        pieces.push({
          id: `${opening.id}_${instance}_${side}`,
          length: slopeLength(opening, side, defaultAllowance),
          kind: "slope",
          side,
          openingId: opening.id,
          openingName: opening.name,
          instance,
          color,
          label: `${opening.name}${tag}${profileMm ? ` · ${profileMm} мм` : ""}`,
          photoIds: opening.photoIds,
          drawingId: opening.drawingId,
          profileMm,
        });
      });
    }
  });
  project.extras.forEach((extra) => {
    const qty = Math.max(1, Math.round(extra.qty) || 1);
    const name = extra.name.trim() || extraPreset(extra.kind).name;
    for (let instance = 1; instance <= qty; instance++) {
      const tag = qty > 1 ? ` · ${instance}` : "";
      pieces.push({
        id: `${extra.id}_${instance}`,
        length: extra.length,
        kind: "extra",
        extraId: extra.id,
        extraName: name,
        extraKind: extra.kind,
        instance,
        color: EXTRA_COLORS[extra.kind] ?? EXTRA_COLORS.custom,
        label: `${name}${tag}`,
        photoIds: extra.photoIds,
        drawingId: extra.drawingId,
      });
    }
  });
  return pieces;
}

export function pieceTitle(piece: NeedPiece): string {
  if (piece.kind === "slope" && piece.side) return `${SIDE_LABEL[piece.side]} · ${piece.openingName ?? ""}`.trim();
  return piece.extraName ?? piece.label;
}

export type GroupedElement = {
  key: string;
  title: string;
  length: number;
  kind: NeedPiece["kind"];
  side?: NeedPiece["side"];
  extraKind?: ExtraKind;
  count: number;
  pieces: NeedPiece[];
  photoIds: string[];
  drawingId: string | null;
};

export function groupElements(pieces: NeedPiece[]): GroupedElement[] {
  const map = new Map<string, GroupedElement>();
  for (const p of pieces) {
    const key = p.kind === "slope" ? `slope:${p.side}:${p.length}` : `extra:${p.extraName}:${p.length}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.pieces.push(p);
      for (const id of p.photoIds) if (!existing.photoIds.includes(id)) existing.photoIds.push(id);
    } else {
      map.set(key, {
        key,
        title: p.kind === "slope" && p.side ? SIDE_LABEL[p.side] : (p.extraName ?? "Элемент"),
        length: p.length,
        kind: p.kind,
        side: p.side,
        extraKind: p.extraKind,
        count: 1,
        pieces: [p],
        photoIds: [...p.photoIds],
        drawingId: p.drawingId,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.length - a.length || a.title.localeCompare(b.title, "ru"));
}

export function materialKey(piece: NeedPiece): string {
  if (piece.kind === "slope") return piece.profileMm ? `slope:${piece.profileMm}` : "slope:bottom";
  if (piece.extraId) return `extra:${piece.extraId}`;
  return `extra:custom:${piece.extraName ?? "custom"}`;
}

export function materialTitle(piece: NeedPiece): string {
  if (piece.kind === "slope") return "Откос";
  if (piece.extraName?.trim()) return piece.extraName.trim();
  if (piece.extraKind) return extraPreset(piece.extraKind).name;
  return "Свой элемент";
}

export type MaterialGroup = {
  key: string;
  title: string;
  kind: NeedPiece["kind"];
  extraKind?: ExtraKind;
  pieces: NeedPiece[];
  lengthGroups: GroupedElement[];
};

export function groupByMaterial(pieces: NeedPiece[]): MaterialGroup[] {
  const map = new Map<string, MaterialGroup>();
  const order: string[] = [];
  for (const p of pieces) {
    const key = materialKey(p);
    const existing = map.get(key);
    if (existing) existing.pieces.push(p);
    else {
      order.push(key);
      map.set(key, { key, title: materialTitle(p), kind: p.kind, extraKind: p.extraKind, pieces: [p], lengthGroups: [] });
    }
  }
  const groups = order.map((key) => {
    const g = map.get(key)!;
    g.lengthGroups = groupElements(g.pieces);
    return g;
  });
  for (const g of groups) {
    if (g.kind !== "extra") continue;
    const length = g.pieces[0]?.length;
    if (length) g.title = `${g.title} · ${Math.round(length)} мм`;
  }
  const counts = new Map<string, number>();
  for (const g of groups) counts.set(g.title, (counts.get(g.title) ?? 0) + 1);
  const seen = new Map<string, number>();
  for (const g of groups) {
    if ((counts.get(g.title) ?? 0) < 2) continue;
    const n = (seen.get(g.title) ?? 0) + 1;
    seen.set(g.title, n);
    g.title = `${g.title} · ${n}`;
  }
  return groups;
}

export function schemeIdsOf(project: Project, key: string): string[] {
  return project.schemes?.[key] ?? [];
}
export function profileColorOf(project: Project, key: string): string {
  return project.profileColors?.[key] ?? DEFAULT_PROFILE_COLOR;
}
export function openingHasPhotos(opening: Opening): boolean {
  return opening.photoIds.length > 0;
}
export function extraHasPhotos(extra: ExtraItem): boolean {
  return extra.photoIds.length > 0;
}
