import type { DrawObject } from "./types";

export type LibraryDrawing = { id: string; name: string; objects: DrawObject[]; updatedAt: number };
const KEY = "doborka-drawing-library";

export function loadLibrary(): LibraryDrawing[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as LibraryDrawing[]; } catch { return []; }
}
export function saveLibrary(items: LibraryDrawing[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 80)));
  window.dispatchEvent(new Event("doborka-library"));
}
export function rememberDrawing(name: string, objects: DrawObject[]) {
  if (!objects.length) return;
  const items = loadLibrary();
  const sig = JSON.stringify(objects.map((o) => ({ ...o, id: "" })));
  if (items.some((item) => JSON.stringify(item.objects.map((o) => ({ ...o, id: "" }))) === sig)) return;
  saveLibrary([{ id: `lib-${Date.now()}`, name: name || "Чертёж", objects, updatedAt: Date.now() }, ...items]);
}
