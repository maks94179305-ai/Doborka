export const DEFAULT_STOCK = [2000, 2200, 2500, 2600, 3000, 3200] as const;

export const SIDE_KEYS = ["left", "right", "top", "bottom"] as const;
export type SideKey = (typeof SIDE_KEYS)[number];

export const SIDE_LABEL: Record<SideKey, string> = {
  left: "Левый откос",
  right: "Правый откос",
  top: "Верхний откос",
  bottom: "Нижний откос",
};

export const SIDE_SHORT: Record<SideKey, string> = {
  left: "Лев",
  right: "Прав",
  top: "Верх",
  bottom: "Низ",
};

export type ExtraKind =
  | "outer-corner"
  | "inner-corner"
  | "j-profile"
  | "sill"
  | "connector"
  | "platband"
  | "custom";

export const EXTRA_PRESETS: { kind: ExtraKind; name: string; hint: string; defaultLength: number }[] = [
  { kind: "outer-corner", name: "Сложный внешний угол", hint: "Внешний угол сложного профиля", defaultLength: 3000 },
  { kind: "inner-corner", name: "Внутренний угол", hint: "Внутренний угловой элемент", defaultLength: 3000 },
  { kind: "j-profile", name: "J-профиль", hint: "Замыкающий / стартовый профиль", defaultLength: 3000 },
  { kind: "sill", name: "Отлив", hint: "Нижний отлив, длина по ширине проёма", defaultLength: 0 },
  { kind: "connector", name: "Соединительная планка", hint: "Стык двух панелей", defaultLength: 3000 },
  { kind: "platband", name: "Наличник", hint: "Обрамление проёма", defaultLength: 3000 },
  { kind: "custom", name: "Свой элемент", hint: "Произвольная длина и название", defaultLength: 0 },
];

export const EXTRA_COLORS: Record<ExtraKind, string> = {
  "outer-corner": "#a09080",
  "inner-corner": "#7d9a9b",
  "j-profile": "#8a9a7a",
  sill: "#9a8f7a",
  connector: "#7a8fa6",
  platband: "#8a9aa6",
  custom: "#9a7a8a",
};

export const PROFILE_COLORS: { id: string; name: string; hex: string; finish?: "matte" | "gloss"; texture?: string }[] = [
  { id: "white", name: "Белый", hex: "#eceae4", finish: "gloss" },
  { id: "graphite-matte", name: "Графит матовый", hex: "#3a4147", finish: "matte", texture: "/textures/graphite-matte.jpg" },
  { id: "graphite-gloss", name: "Графит глянцевый", hex: "#23282e", finish: "gloss", texture: "/textures/graphite-matte.jpg" },
  { id: "anthracite", name: "Антрацит", hex: "#3d4548" },
  { id: "vintage", name: "Винтаж", hex: "#6e5a4a", finish: "matte", texture: "/textures/vintage-matte.jpg" },
];

export const DEFAULT_PROFILE_COLOR = PROFILE_COLORS[0].hex;

const HEX_ALIASES: Record<string, string> = {
  "#5a6268": "#3a4147",
  "#2f363d": "#23282e",
  "#8a7460": "#6e5a4a",
};

function profileOf(hex: string) {
  const h = (HEX_ALIASES[hex.toLowerCase()] ?? hex).toLowerCase();
  return PROFILE_COLORS.find((c) => c.hex.toLowerCase() === h);
}

export function profileColorName(hex: string): string {
  return profileOf(hex)?.name ?? "Свой цвет";
}
export function profileFinish(hex: string): "matte" | "gloss" | undefined {
  return profileOf(hex)?.finish;
}
export function profileId(hex: string): string | undefined {
  return profileOf(hex)?.id;
}
export function profileCanonicalHex(hex: string): string {
  return profileOf(hex)?.hex ?? hex;
}
export function profileTexture(hex: string): string | undefined {
  return profileOf(hex)?.texture;
}
export function profileSwatchBg(hex: string): string {
  const texture = profileTexture(hex);
  if (texture) return `center / cover url("${texture}")`;
  if (profileFinish(hex) === "matte") return mixHex(hex, "#6e6c68", 0.3);
  return hex;
}
function mixHex(hex: string, toward: string, t: number): string {
  const parse = (h: string) => {
    const s = h.replace("#", "");
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)] as const;
  };
  const a = parse(hex);
  const b = parse(toward);
  const m = a.map((v, i) => Math.round(v + (b[i]! - v) * t));
  return `#${m.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
export function profileChipSide(hex: string): string {
  return mixHex(hex, "#000000", 0.38);
}

export type Sides = Record<SideKey, boolean>;

export type Opening = {
  id: string;
  name: string;
  width: number;
  height: number;
  qty: number;
  allowance: number | null;
  sides: Sides;
  note: string;
  photoIds: string[];
  drawingId: string | null;
};

export type ExtraItem = {
  id: string;
  kind: ExtraKind;
  name: string;
  length: number;
  qty: number;
  note: string;
  photoIds: string[];
  drawingId: string | null;
};

export type DashStyle = "solid" | "dash" | "dot";

export type DrawObject =
  | { id: string; type: "line"; x1: number; y1: number; x2: number; y2: number; color: string; width: number; dash: DashStyle }
  | { id: string; type: "rect"; x: number; y: number; w: number; h: number; color: string; width: number; dash: DashStyle }
  | { id: string; type: "dim"; x1: number; y1: number; x2: number; y2: number; offset: number; color: string; width?: number; dash?: DashStyle; label?: string }
  | { id: string; type: "text"; x: number; y: number; text: string; size: number; color: string };

export type Drawing = {
  id: string;
  name: string;
  objects: DrawObject[];
  updatedAt: number;
  previewPhotoId?: string;
  view?: { x: number; y: number; scale: number; wx?: number; wy?: number };
};

export type Strategy = "waste" | "meters" | "short";

export type ProjectSettings = {
  defaultAllowance: number;
  kerf: number;
  minRemainder: number;
  stockLengths: number[];
  defaultSides: Sides;
  strategy: Strategy;
};

export type Project = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  openings: Opening[];
  extras: ExtraItem[];
  drawings: Drawing[];
  schemes: Record<string, string[]>;
  schemeDrawings: Record<string, string>;
  profileColors: Record<string, string>;
  profileNotes: Record<string, string>;
  archive: ArchiveEntry[];
  settings: ProjectSettings;
};

export type ArchiveEntry = { id: string; photoId: string; title: string; colorName?: string; sentAt: number };

export type NeedPiece = {
  id: string;
  length: number;
  kind: "slope" | "extra";
  side?: SideKey;
  openingId?: string;
  openingName?: string;
  instance: number;
  extraId?: string;
  extraName?: string;
  extraKind?: ExtraKind;
  color: string;
  label: string;
  photoIds: string[];
  drawingId: string | null;
};

export type CutSegment = { pieceId: string; length: number; label: string; color: string; openingName?: string };

export type StockBar = {
  id: string;
  index: number;
  stockLength: number;
  cuts: CutSegment[];
  used: number;
  waste: number;
  leftover: number;
  usableRemainder: boolean;
};

export type CuttingPlan = {
  bars: StockBar[];
  totalMm: number;
  usedMm: number;
  wasteMm: number;
  remainderMm: number;
  wastePercent: number;
  barCounts: { length: number; count: number }[];
  unplaced: NeedPiece[];
  pieceToBar: Record<string, number>;
};

export const OPENING_COLORS = ["#8aa39c", "#9a8f7a", "#7a8fa6", "#8a9a7a", "#a67a7a", "#7aa69a", "#9a7a8a", "#8a9aa6"] as const;
export const DRAW_COLORS = ["#eceae4", "#8fa39a", "#c4a574", "#7d9a9b", "#c45c4a", "#6b7d8a"] as const;

export function defaultSides(): Sides {
  return { left: true, right: true, top: true, bottom: false };
}

export function defaultSettings(): ProjectSettings {
  return {
    defaultAllowance: 100,
    kerf: 0,
    minRemainder: 800,
    stockLengths: [...DEFAULT_STOCK],
    defaultSides: defaultSides(),
    strategy: "waste",
  };
}

export function extraPreset(kind: ExtraKind) {
  return EXTRA_PRESETS.find((p) => p.kind === kind) ?? EXTRA_PRESETS[6];
}
