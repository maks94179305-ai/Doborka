import type { Project } from "@/lib/types";

export type HistoryRow = { id: string; photoId: string; title: string; colorName: string | null; sentAt: number; hasImage: boolean };
type Store = { project?: { payload: string; updatedAt: number }; history: Record<string, HistoryRow & { image: string }>; photos: Record<string, string> };
const ROOM = "https://kvs.ix.workers.dev/doborka";

function localKey(pin: string) { return `doborka-shared:${pin}`; }
function readLocal(pin: string): Store {
  try { const raw = localStorage.getItem(localKey(pin)); if (raw) return JSON.parse(raw) as Store; } catch { /* ignore */ }
  return { history: {}, photos: {} };
}
function writeLocal(pin: string, store: Store) {
  localStorage.setItem(localKey(pin), JSON.stringify(store));
}
async function readRemote(pin: string): Promise<Store | null> {
  try {
    const res = await fetch(`${ROOM}/${encodeURIComponent(pin)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json() as Store;
  } catch { return null; }
}
async function writeRemote(pin: string, store: Store) {
  try { await fetch(`${ROOM}/${encodeURIComponent(pin)}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(store) }); } catch { /* keep local copy */ }
}
async function load(pin: string): Promise<Store> {
  const remote = await readRemote(pin);
  const local = readLocal(pin);
  const store = remote && (remote.project?.updatedAt ?? 0) >= (local.project?.updatedAt ?? 0) ? remote : local;
  writeLocal(pin, store);
  return store;
}
async function save(pin: string, store: Store) {
  writeLocal(pin, store);
  await writeRemote(pin, store);
}

export async function listSharedHistory({ data }: { data: { pin: string } }) {
  const store = await load(data.pin);
  return Object.values(store.history ?? {}).map((r) => ({ id: r.id, photoId: r.photoId, title: r.title, colorName: r.colorName, sentAt: r.sentAt, hasImage: !!r.image }));
}
export async function getSharedHistoryImage({ data }: { data: { pin: string; id: string } }) {
  const store = await load(data.pin);
  return { image: store.history?.[data.id]?.image ?? "" };
}
export async function saveSharedHistory({ data }: { data: { pin: string; id: string; photoId: string; title: string; colorName?: string; sentAt: number; image: string } }) {
  const store = await load(data.pin);
  store.history = store.history ?? {};
  store.history[data.id] = { id: data.id, photoId: data.photoId, title: data.title, colorName: data.colorName ?? null, sentAt: data.sentAt, hasImage: true, image: data.image };
  await save(data.pin, store);
}
export async function deleteSharedHistory({ data }: { data: { pin: string; id: string } }) {
  const store = await load(data.pin);
  if (store.history) delete store.history[data.id];
  await save(data.pin, store);
}
export async function saveSharedProject({ data }: { data: { pin: string; basePayload: string; nextPayload: string } }) {
  const store = await load(data.pin);
  const updatedAt = Date.now();
  store.project = { payload: data.nextPayload, updatedAt };
  await save(data.pin, store);
  return { payload: data.nextPayload, updatedAt };
}
export async function getSharedProject({ data }: { data: { pin: string } }): Promise<{ payload: string; updatedAt: number } | null> {
  return (await load(data.pin)).project ?? null;
}
export async function saveSharedPhoto({ data }: { data: { pin: string; id: string; image: string } }) {
  const store = await load(data.pin);
  store.photos = store.photos ?? {};
  store.photos[data.id] = data.image;
  await save(data.pin, store);
}
export async function getSharedPhoto({ data }: { data: { pin: string; id: string } }) {
  const store = await load(data.pin);
  return { image: store.photos?.[data.id] ?? "" };
}
export type SharedProject = Project;
