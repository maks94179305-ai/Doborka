import type { DrawObject } from "./types";

export type LibraryDrawing = { id: string; name: string; objects: DrawObject[]; updatedAt: number };
const KEY = "doborka-drawing-library";
const FORGOT = "doborka-drawing-forgotten";
function sigOf(objects: DrawObject[]) { return JSON.stringify(objects.map((o) => ({ ...o, id: "" }))); }
function forgotten() { try { return new Set(JSON.parse(localStorage.getItem(FORGOT) || "[]") as string[]); } catch { return new Set<string>(); } }

export function loadLibrary(): LibraryDrawing[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as LibraryDrawing[]; } catch { return []; }
}
export function saveLibrary(items: LibraryDrawing[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 80)));
  window.dispatchEvent(new Event("doborka-library"));
}
export function rememberDrawing(name: string, objects: DrawObject[], id = "") {
  if (!objects.length) return;
  const sig = sigOf(objects);
  if (forgotten().has(sig)) return;
  const items = loadLibrary();
  const key = id || sig;
  const current = items.find((item) => item.id === key);
  if (current) {
    saveLibrary(items.map((item) => item.id === key ? { ...item, name: name || item.name, objects, updatedAt: Date.now() } : item));
    return;
  }
  if (items.some((item) => sigOf(item.objects) === sig)) return;
  saveLibrary([{ id: key, name: name || "Чертёж", objects, updatedAt: Date.now() }, ...items]);
}

export function forgetDrawings(items: LibraryDrawing[]) {
  const gone = forgotten();
  for (const item of items) gone.add(sigOf(item.objects));
  localStorage.setItem(FORGOT, JSON.stringify([...gone]));
  saveLibrary(loadLibrary().filter((item) => !items.some((goneItem) => goneItem.id === item.id)));
}
