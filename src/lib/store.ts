import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { uid } from "./utils";
import { createProject, demoProject } from "./seed";
import { defaultSettings, type ArchiveEntry, type ExtraItem, type Opening, type Project } from "./types";

type Workspace = {
  ready: boolean;
  projects: Project[];
  activeId: string | null;
  markReady: () => void;
  setActive: (id: string) => void;
  addProject: (name?: string) => string;
  loadDemo: () => string;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  patchProject: (fn: (p: Project) => Project) => void;
  addOpening: (partial?: Partial<Opening>) => string;
  updateOpening: (id: string, patch: Partial<Opening>) => void;
  duplicateOpening: (id: string) => void;
  removeOpening: (id: string) => void;
  addExtra: (partial?: Partial<ExtraItem>) => string;
  updateExtra: (id: string, patch: Partial<ExtraItem>) => void;
  removeExtra: (id: string) => void;
  setSchemeIds: (key: string, photoIds: string[]) => void;
  setProfileColor: (key: string, color: string) => void;
  setProfileNote: (key: string, note: string) => void;
  addArchiveEntry: (entry: { photoId: string; title: string; colorName?: string }) => ArchiveEntry;
  removeArchiveEntry: (id: string) => void;
  importProject: (data: Project) => string;
};

function touch(p: Project): Project {
  return { ...p, updatedAt: Date.now() };
}

export function normalizeProject(p: Project): Project {
  return {
    ...p,
    settings: (() => {
      const settings = { ...defaultSettings(), ...(p.settings ?? {}) };
      if (settings.minRemainder === 200) settings.minRemainder = 800;
      return settings;
    })(),
    schemes: p.schemes ?? {},
    schemeDrawings: p.schemeDrawings ?? {},
    profileColors: p.profileColors ?? {},
    profileNotes: p.profileNotes ?? {},
    openings: (p.openings ?? []).map((o) => ({
      ...o,
      photoIds: o.photoIds ?? [],
      drawingId: o.drawingId ?? null,
      sides: { ...defaultSettings().defaultSides, ...(o.sides ?? {}) },
      facade: { left: 18, right: 18, top: 18, ...(o.facade ?? {}) },
      slopes: { left: { leg: 50, bottom: 40, shelf: 20, rise: o.facade?.left ?? 18, top: 50, ...(o.slopes?.left ?? {}) }, right: { leg: 50, bottom: 40, shelf: 20, rise: o.facade?.right ?? 18, top: 50, ...(o.slopes?.right ?? {}) }, top: { leg: 50, bottom: 40, shelf: 20, rise: o.facade?.top ?? 18, top: 50, ...(o.slopes?.top ?? {}) } },
    })),
    extras: (p.extras ?? []).map((e) => ({ ...e, photoIds: e.photoIds ?? [], drawingId: e.drawingId ?? null })),
    drawings: p.drawings ?? [],
    archive: p.archive ?? [],
  };
}

export const useWorkspace = create<Workspace>()(
  persist(
    (set, get) => ({
      ready: false,
      projects: [],
      activeId: null,
      markReady: () => {
        const s = get();
        if (!useWorkspace.persist.hasHydrated()) return;
        if (s.projects.length === 0) {
          const demo = demoProject();
          set({ ready: true, projects: [demo], activeId: demo.id });
          return;
        }
        set({
          ready: true,
          projects: s.projects.map((p) => normalizeProject(p)),
          activeId: s.activeId && s.projects.some((p) => p.id === s.activeId) ? s.activeId : s.projects[0].id,
        });
      },
      setActive: (id) => set({ activeId: id }),
      addProject: (name) => {
        const p = createProject(name);
        set((s) => ({ projects: [p, ...s.projects], activeId: p.id }));
        return p.id;
      },
      loadDemo: () => {
        const p = demoProject();
        set((s) => ({ projects: [p, ...s.projects], activeId: p.id }));
        return p.id;
      },
      renameProject: (id, name) => set((s) => ({ projects: s.projects.map((p) => (p.id === id ? touch({ ...p, name }) : p)) })),
      deleteProject: (id) => set((s) => {
        const projects = s.projects.filter((p) => p.id !== id);
        return { projects, activeId: s.activeId === id ? (projects[0]?.id ?? null) : s.activeId };
      }),
      patchProject: (fn) => set((s) => ({ projects: s.projects.map((p) => (p.id === s.activeId ? touch(fn(p)) : p)) })),
      addOpening: (partial) => {
        const id = uid("op");
        const s = get();
        const proj = s.projects.find((p) => p.id === s.activeId);
        if (proj) {
          const emptyIds = new Set((proj.drawings ?? []).filter((d) => !d.objects.length).map((d) => d.id));
          const schemeDrawings = { ...(proj.schemeDrawings ?? {}) };
          for (const [key, drawingId] of Object.entries(schemeDrawings)) if (key.startsWith("slope:") && emptyIds.has(drawingId)) delete schemeDrawings[key];
          if (Object.keys(schemeDrawings).length !== Object.keys(proj.schemeDrawings ?? {}).length) {
            set({ projects: s.projects.map((p) => p.id === proj.id ? { ...p, schemeDrawings } : p) });
          }
        }
        const opening: Opening = {
          id,
          name: `Окно ${(proj?.openings.length ?? 0) + 1}`,
          width: 1650,
          height: 2050,
          qty: 1,
          allowance: null,
          sides: { ...(proj?.settings.defaultSides ?? defaultSettings().defaultSides) },
          facade: { left: 18, right: 18, top: 18 },
          slopes: { left: { leg: 50, bottom: 40, shelf: 20, rise: 18, top: 50 }, right: { leg: 50, bottom: 40, shelf: 20, rise: 18, top: 50 }, top: { leg: 50, bottom: 40, shelf: 20, rise: 18, top: 50 } },
          note: "",
          photoIds: [],
          drawingId: null,
          ...partial,
        };
        get().patchProject((p) => ({ ...p, openings: [...p.openings, opening] }));
        return id;
      },
      updateOpening: (id, patch) => get().patchProject((p) => ({ ...p, openings: p.openings.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
      duplicateOpening: (id) => get().patchProject((p) => {
        const src = p.openings.find((o) => o.id === id);
        if (!src) return p;
        const copyId = uid("op");
        const copy: Opening = { ...src, id: copyId, name: `${src.name} копия`, photoIds: [...src.photoIds], sides: { ...src.sides }, facade: src.facade ? { ...src.facade } : src.facade };
        const i = p.openings.findIndex((o) => o.id === id);
        const openings = [...p.openings];
        openings.splice(i + 1, 0, copy);
        const drawings = [...p.drawings];
        const schemeDrawings = { ...(p.schemeDrawings ?? {}) };
        const schemes = { ...(p.schemes ?? {}) };
        const cloneKey = (from: string, to: string) => {
          const drawing = drawings.find((d) => d.id === schemeDrawings[from]);
          if (!drawing) return;
          const next = { ...drawing, id: uid("dr"), updatedAt: Date.now(), objects: drawing.objects.map((o) => ({ ...o, id: uid("ob") })) };
          drawings.push(next);
          schemeDrawings[to] = next.id;
          if (schemes[from]) schemes[to] = [...schemes[from]];
        };
        const left = src.facade?.left ?? 18, right = src.facade?.right ?? 18, top = src.facade?.top ?? 18;
        cloneKey(schemeDrawings[`slope:${src.id}:left`] ? `slope:${src.id}:left` : `slope:${left}`, `slope:${copyId}:left`);
        cloneKey(schemeDrawings[`slope:${src.id}:right`] ? `slope:${src.id}:right` : `slope:${right}`, `slope:${copyId}:right`);
        cloneKey(schemeDrawings[`slope:${src.id}:top`] ? `slope:${src.id}:top` : `slope:${top}`, `slope:${copyId}:top`);
        cloneKey(`slope:bottom:${src.id}`, `slope:bottom:${copyId}`);
        return { ...p, openings, drawings, schemeDrawings, schemes };
      }),
      removeOpening: (id) => get().patchProject((p) => ({ ...p, openings: p.openings.filter((o) => o.id !== id) })),
      addExtra: (partial) => {
        const id = uid("ex");
        const extra: ExtraItem = { id, kind: "custom", name: "Элемент", length: 3000, qty: 1, note: "", photoIds: [], drawingId: null, ...partial };
        get().patchProject((p) => ({ ...p, extras: [...p.extras, extra] }));
        return id;
      },
      updateExtra: (id, patch) => get().patchProject((p) => ({ ...p, extras: p.extras.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      removeExtra: (id) => get().patchProject((p) => ({ ...p, extras: p.extras.filter((e) => e.id !== id) })),
      setSchemeIds: (key, photoIds) => get().patchProject((p) => ({ ...p, schemes: { ...(p.schemes ?? {}), [key]: photoIds } })),
      setProfileColor: (key, color) => get().patchProject((p) => ({ ...p, profileColors: { ...(p.profileColors ?? {}), [key]: color } })),
      setProfileNote: (key, note) => get().patchProject((p) => ({ ...p, profileNotes: { ...(p.profileNotes ?? {}), [key]: note.slice(0, 400) } })),
      addArchiveEntry: (entry) => {
        const item: ArchiveEntry = { id: uid("ar"), photoId: entry.photoId, title: entry.title, colorName: entry.colorName, sentAt: Date.now() };
        get().patchProject((p) => ({ ...p, archive: [item, ...(p.archive ?? [])] }));
        return item;
      },
      removeArchiveEntry: (id) => get().patchProject((p) => ({ ...p, archive: (p.archive ?? []).filter((e) => e.id !== id) })),
      importProject: (data) => {
        const p: Project = { ...normalizeProject(data), id: uid("prj"), createdAt: Date.now(), updatedAt: Date.now() };
        set((s) => ({ projects: [p, ...s.projects], activeId: p.id }));
        return p.id;
      },
    }),
    {
      name: "doborka-v1",
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(name) ?? localStorage.getItem("doborka-backup"),
        setItem: (name, value) => { localStorage.setItem(name, value); localStorage.setItem("doborka-backup", value); },
        removeItem: (name) => { localStorage.removeItem(name); localStorage.removeItem("doborka-backup"); },
      })),
            partialize: (s) => ({ projects: s.projects, activeId: s.activeId }),
      skipHydration: true,
      onRehydrateStorage: () => () => { useWorkspace.getState().markReady(); },
      version: 1,
    },
  ),
);

export function useProject(): Project | null {
  return useWorkspace((s) => s.projects.find((p) => p.id === s.activeId) ?? null);
}
