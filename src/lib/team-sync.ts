import { useEffect, useState } from "react";
import { savePhoto, getPhoto } from "@/lib/photos";
import { renderDrawingToBlob } from "@/lib/draw-render";
import { readPairPin } from "@/lib/pair-pin";
import { useWorkspace, normalizeProject } from "@/lib/store";
import type { ArchiveEntry, Project } from "@/lib/types";
import { deleteSharedHistory, getSharedHistoryImage, getSharedPhoto, getSharedProject, listSharedHistory, saveSharedHistory, saveSharedPhoto, saveSharedProject } from "@/lib/team-sync.functions";

let applyingRemote = false;
let pushTimer = 0;
let sessionDirty = false;
let syncing = false;
function notifySync(body: string) {
  window.dispatchEvent(new CustomEvent("doborka-sync", { detail: body }));
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try { new Notification("Доборка", { body }); } catch { /* ignore */ }
}
let photoCursor = 0;
const publishedPhotos = new Set<string>();
const photoMissUntil = new Map<string, number>();
const BASE_KEY = "doborka-sync-base";
type SyncBase = { updatedAt: number; payload: string; pin?: string };

function activeProject(): Project | null {
  const s = useWorkspace.getState();
  return s.projects.find((p) => p.id === s.activeId) ?? null;
}
function readBase(): SyncBase | null {
  try {
    const raw = localStorage.getItem(BASE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SyncBase;
    if (!parsed || typeof parsed.payload !== "string" || typeof parsed.updatedAt !== "number") return null;
    return parsed;
  } catch { return null; }
}
function writeBase(project: Project, updatedAt: number, pin: string) {
  try { localStorage.setItem(BASE_KEY, JSON.stringify({ updatedAt, payload: JSON.stringify({ ...project, updatedAt }), pin })); } catch { /* ignore */ }
}
function applyRemote(payload: string, updatedAt: number, pin: string) {
  const parsed = normalizeProject({ ...(JSON.parse(payload) as Project), updatedAt });
  if (!parsed.id || !Array.isArray(parsed.openings)) return;
  applyingRemote = true;
  useWorkspace.setState({ projects: [parsed], activeId: parsed.id });
  applyingRemote = false;
  writeBase(parsed, updatedAt, pin);
  void hydrateSchemePhotos(parsed);
}
async function hydrateSchemePhotos(project: Project) {
  let changed = false;
  for (const drawing of project.drawings ?? []) {
    const photoId = drawing.previewPhotoId;
    if (!photoId || drawing.objects.length === 0) continue;
    try {
      if (await getPhoto(photoId)) continue;
      const blob = await renderDrawingToBlob(drawing);
      if (!blob) continue;
      await savePhoto(photoId, blob);
      changed = true;
    } catch { /* ignore */ }
  }
  if (changed) window.dispatchEvent(new Event("doborka-photos"));
}
function photoIdsOf(project: Project): string[] {
  const ids = new Set<string>();
  for (const opening of project.openings ?? []) for (const id of opening.photoIds ?? []) ids.add(id);
  for (const extra of project.extras ?? []) for (const id of extra.photoIds ?? []) ids.add(id);
  for (const list of Object.values(project.schemes ?? {})) for (const id of list) ids.add(id);
  for (const drawing of project.drawings ?? []) if (drawing.previewPhotoId) ids.add(drawing.previewPhotoId);
  for (const entry of project.archive ?? []) if (entry.photoId) ids.add(entry.photoId);
  return [...ids];
}
async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
async function syncPhotos(project: Project) {
  const pin = readPairPin();
  if (!pin) return;
  const ids = photoIdsOf(project);
  if (ids.length === 0) return;
  const batch = Math.min(4, ids.length);
  const start = photoCursor % ids.length;
  photoCursor = (start + batch) % ids.length;
  let changed = false;
  for (let i = 0; i < batch; i++) {
    const id = ids[(start + i) % ids.length];
    const key = `${pin}:${id}`;
    try {
      const local = await getPhoto(id);
      if (local) {
        if (publishedPhotos.has(key)) continue;
        const image = await blobToDataUrl(local);
        if (!image.startsWith("data:") || image.length > 1_800_000) { publishedPhotos.add(key); continue; }
        await saveSharedPhoto({ data: { pin, id, image } });
        publishedPhotos.add(key);
        continue;
      }
      if ((photoMissUntil.get(key) ?? 0) > Date.now()) continue;
      const { image } = await getSharedPhoto({ data: { pin, id } });
      if (!image.startsWith("data:")) { photoMissUntil.set(key, Date.now() + 15_000); continue; }
      const blob = await (await fetch(image)).blob();
      if (blob.size > 0) { await savePhoto(id, blob); publishedPhotos.add(key); photoMissUntil.delete(key); changed = true; }
    } catch { /* ignore */ }
  }
  if (changed) window.dispatchEvent(new Event("doborka-photos"));
}
function sameSnapshot(local: Project, snapshot: string) {
  return JSON.stringify(normalizeProject(local)) === snapshot;
}
export async function publishHistory(entry: ArchiveEntry, blob: Blob) {
  const pin = readPairPin();
  if (!pin) return;
  try {
    const image = await blobToDataUrl(blob);
    if (image.length > 1_800_000) return;
    await saveSharedHistory({ data: { pin, id: entry.id, photoId: entry.photoId, title: entry.title, colorName: entry.colorName, sentAt: entry.sentAt, image } });
  } catch { /* ignore */ }
}
export async function unpublishHistory(id: string) {
  const pin = readPairPin();
  if (!pin) return;
  try { await deleteSharedHistory({ data: { pin, id } }); } catch { /* ignore */ }
}
async function pushProject() {
  const pin = readPairPin();
  const local = activeProject();
  if (!pin || !local || applyingRemote) return;
  const snapshot = JSON.stringify(normalizeProject(local));
  const base = readBase();
  try {
    const saved = await saveSharedProject({ data: { pin, basePayload: base?.pin === pin ? (base.payload ?? "") : "", nextPayload: snapshot } });
    const latest = activeProject();
    if (latest && !sameSnapshot(latest, snapshot)) { writeBase(normalizeProject(JSON.parse(saved.payload) as Project), saved.updatedAt, pin); sessionDirty = true; schedulePush(); return; }
    sessionDirty = false;
    applyRemote(saved.payload, saved.updatedAt, pin);
    notifySync("Изменения отправлены на связанные устройства");
  } catch { /* ignore */ }
}
function schedulePush() {
  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => { void syncOnce(); }, 400);
}
async function pullProject() {
  const pin = readPairPin();
  if (!pin) return;
  const remote = await getSharedProject({ data: { pin } });
  const local = activeProject();
  if (!local) return;
  if (!remote) { await pushProject(); return; }
  if (sessionDirty) { await pushProject(); return; }
  const base = readBase();
  if (!base || base.pin !== pin) { await pushProject(); return; }
  if (remote.updatedAt !== base.updatedAt && !sessionDirty) { applyRemote(remote.payload, remote.updatedAt, pin); notifySync("Получены изменения с другого устройства"); }
}
async function pullHistory() {
  const pin = readPairPin();
  if (!pin) return;
  const rows = await listSharedHistory({ data: { pin } });
  const local = activeProject();
  if (!local) return;
  const archive = local.archive ?? [];
  const known = new Map(archive.map((e) => [e.id, e]));
  const incoming: ArchiveEntry[] = [];
  let gotImage = false;
  for (const row of rows) {
    const exists = known.get(row.id);
    if (!exists || !(await getPhoto(row.photoId))) {
      if (row.hasImage) {
        try {
          const { image } = await getSharedHistoryImage({ data: { pin, id: row.id } });
          if (image.startsWith("data:")) { await savePhoto(row.photoId, await (await fetch(image)).blob()); gotImage = true; }
        } catch { /* ignore */ }
      }
    }
    if (!exists) incoming.push({ id: row.id, photoId: row.photoId, title: row.title, colorName: row.colorName ?? undefined, sentAt: row.sentAt });
  }
  if (incoming.length === 0) { if (gotImage) window.dispatchEvent(new Event("doborka-photos")); return; }
  applyingRemote = true;
  useWorkspace.setState((s) => ({ projects: s.projects.map((p) => p.id === s.activeId ? { ...p, archive: [...incoming, ...(p.archive ?? [])].sort((a, b) => b.sentAt - a.sentAt) } : p) }));
  applyingRemote = false;
}
async function syncOnce() {
  if (!readPairPin() || syncing) return;
  syncing = true;
  try {
    await pullProject();
    const local = activeProject();
    if (local) { await hydrateSchemePhotos(local); await syncPhotos(local); }
    await pullHistory();
  } catch { /* ignore */ } finally { syncing = false; }
}
export function useTeamSync() {
  if (typeof navigator !== "undefined" && navigator.userAgent.includes("Electron")) return;
  const ready = useWorkspace((s) => s.ready);
  const [pin, setPin] = useState<string | null>(null);
  useEffect(() => {
    setPin(readPairPin());
    const onPair = () => {
      sessionDirty = false;
      publishedPhotos.clear();
      photoMissUntil.clear();
      try { localStorage.removeItem(BASE_KEY); } catch { /* ignore */ }
      setPin(readPairPin());
    };
    window.addEventListener("doborka-pair", onPair);
    return () => window.removeEventListener("doborka-pair", onPair);
  }, []);
  useEffect(() => {
    if (!ready || !pin) return;
    let alive = true;
    const unsub = useWorkspace.subscribe((s) => {
      if (applyingRemote || !readPairPin()) return;
      if (!s.projects.find((x) => x.id === s.activeId)) return;
      sessionDirty = true;
      schedulePush();
    });
    const tick = () => { if (alive) void syncOnce(); };
    tick();
    const timer = window.setInterval(tick, 3000);
    const onShow = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onShow);
    const onHide = () => { if (document.visibilityState === "hidden") void pushProject(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", () => { void pushProject(); });
    return () => { alive = false; unsub(); window.clearInterval(timer); window.clearTimeout(pushTimer); document.removeEventListener("visibilitychange", onShow); };
  }, [ready, pin]);
}
