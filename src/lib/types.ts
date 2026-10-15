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
  { kind: "custom", name: "Своя позиция", hint: "Произвольный отрезок", defaultLength: 1000 },
];

export const PROFILE_COLORS: { id: string; name: string; hex: string; finish?: "matte" | "gloss"; texture?: string }[] = [
  { id: "white", name: "Белый", hex: "#f3f1ec" },
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
  if (profileFinish(hex) === "matte") return mixHex(hex, "#ffffff", 0.08);
  return hex;
}
function mixHex(a: string, b: string, t: number) {
  const pa = a.replace("#", "");
  const pb = b.replace("#", "");
  const n = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  const m = (i: number) => Math.round(n(pa, i) * (1 - t) + n(pb, i) * t).toString(16).padStart(2, "0");
  return `#${m(0)}${m(2)}${m(4)}`;
}
export function profileChipSide(hex: string): "light" | "dark" {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.62 ? "dark" : "light";
}

export type Sides = Record<SideKey, boolean>;

export type FacadeThickness = { left: number; right: number; top: number; bottom?: number };
export type SlopeSize = { leg: number; bottom: number; shelf: number; rise: number; top: number };
export type SlopeSizes = { left: SlopeSize; right: SlopeSize; top: SlopeSize };
export type Opening = {
  id: string;
  name: string;
  width: number;
  height: number;
  bottomLength?: number;
  allowance?: number;
  dripAllowance?: number;
  sides: Sides;
  facade?: FacadeThickness;
  sourceId?: string;
};

export type ExtraItem = {
  id: string;
  kind: ExtraKind;
  name: string;
  length: number;
  qty: number;
  note?: string;
};

export type DashStyle = "solid" | "dash" | "dot";

export type DrawObject =
  | { id: string; type: "line"; x1: number; y1: number; x2: number; y2: number; color: string; width: number; dash: DashStyle }
  | { id: string; type: "rect"; x: number; y: number; w: number; h: number; color: string; width: number; dash: DashStyle }
  | { id: string; type: "dim"; x1: number; y1: number; x2: number; y2: number; offset: number; color: string; width?: number; dash?: DashStyle; label?: string }
  | { id: string; type: "text"; x: number; y: number; text: string; size: number; color: string }
  | { id: string; type: "angle"; a: string; b: string; color: string; radius?: number; label?: number }
  | { id: string; type: "path"; points: { x: number; y: number }[]; color: string; width: number }
  | { id: string; type: "arrow"; x1: number; y1: number; x2: number; y2: number; color: string; width: number; dash: DashStyle; label?: string };

export type Drawing = {
  id: string;
  name: string;
  objects: DrawObject[];
  view?: { x: number; y: number; scale: number };
  updatedAt: number;
  previewPhotoId?: string;
};

export type Strategy = "waste" | "meters" | "short";

export type ProjectSettings = {
  stockLengths: number[];
  kerf: number;
  minRemainder: number;
  strategy: Strategy;
  defaultAllowance: number;
};

export type Project = {
  id: string;
  name: string;
  updatedAt: number;
  openings: Opening[];
  extras: ExtraItem[];
  drawings: Drawing[];
  schemes: Record<string, string[]>;
  schemeDrawings: Record<string, string>;
  profileColors: Record<string, string>;
  profileNotes: Record<string, string>;
  settings: ProjectSettings;
  archive?: ArchiveEntry[];
};

export type ArchiveEntry = { id: string; photoId: string; title: string; colorName?: string; sentAt: number; projectId?: string; projectName?: string };

export type NeedPiece = {
  id: string;
  label: string;
  length: number;
  color: string;
  openingId?: string;
  openingName?: string;
  side?: SideKey | "extra";
  drawingId?: string;
};

export type CutSegment = { pieceId: string; length: number; label: string; color: string; openingName?: string };

export type StockBar = {
  id: string;
  stock: number;
  used: number;
  waste: number;
  segments: CutSegment[];
};

export type CuttingPlan = {
  bars: StockBar[];
  totalStock: number;
  totalUsed: number;
  totalWaste: number;
  efficiency: number;
  barCounts: Record<number, number>;
};

export const DRAW_COLORS = ["#eceae4", "#8fa39a", "#c4a574", "#7d9a9b", "#c45c4a", "#6b7d8a"] as const;
