import type { Project } from "@/lib/types";

export type HistoryRow = { id: string; photoId: string; title: string; colorName: string | null; sentAt: number; hasImage: boolean };

type Store = { project?: { payload: string; updatedAt: number }; history: Record<string, HistoryRow & { image: string }>; photos: Record<string, string> };

function bucket(pin: string): Store {
  const key = `doborka-shared:${pin}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as Store;
  } catch { /* ignore */ }
  return { history: {}, photos: {} };
}
function write(pin: string, store: Store) {
  localStorage.setItem(`doborka-shared:${pin}`, JSON.stringify(store));
}

export async function listSharedHistory({ data }: { data: { pin: string } }) {
  return Object.values(bucket(data.pin).history).map((r) => ({ id: r.id, photoId: r.photoId, title: r.title, colorName: r.colorName, sentAt: r.sentAt, hasImage: !!r.image }));
}
export async function getSharedHistoryImage({ data }: { data: { pin: string; id: string } }) {
  return { image: bucket(data.pin).history[data.id]?.image ?? "" };
}
export async function saveSharedHistory({ data }: { data: { pin: string; id: string; photoId: string; title: string; colorName?: string; sentAt: number; image: string } }) {
  const store = bucket(data.pin);
  store.history[data.id] = { id: data.id, photoId: data.photoId, title: data.title, colorName: data.colorName ?? null, sentAt: data.sentAt, hasImage: true, image: data.image };
  write(data.pin, store);
}
export async function deleteSharedHistory({ data }: { data: { pin: string; id: string } }) {
  const store = bucket(data.pin);
  delete store.history[data.id];
  write(data.pin, store);
}
export async function saveSharedProject({ data }: { data: { pin: string; basePayload: string; nextPayload: string } }) {
  const store = bucket(data.pin);
  const updatedAt = Date.now();
  store.project = { payload: data.nextPayload, updatedAt };
  write(data.pin, store);
  return { payload: data.nextPayload, updatedAt };
}
export async function getSharedProject({ data }: { data: { pin: string } }): Promise<{ payload: string; updatedAt: number } | null> {
  return bucket(data.pin).project ?? null;
}
export async function saveSharedPhoto({ data }: { data: { pin: string; id: string; image: string } }) {
  const store = bucket(data.pin);
  store.photos[data.id] = data.image;
  write(data.pin, store);
}
export async function getSharedPhoto({ data }: { data: { pin: string; id: string } }) {
  return { image: bucket(data.pin).photos[data.id] ?? "" };
}
export type SharedProject = Project;
