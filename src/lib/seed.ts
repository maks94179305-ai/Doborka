import { uid } from "./utils";
import { defaultSettings, type Opening, type Project } from "./types";

function opening(name: string, width: number, height: number, extra?: Partial<Opening>): Opening {
  return {
    id: uid("op"),
    name,
    width,
    height,
    qty: 1,
    allowance: null,
    sides: { left: true, right: true, top: true, bottom: false },
    note: "",
    photoIds: [],
    drawingId: null,
    ...extra,
  };
}

export function createProject(name = "Новый объект"): Project {
  const now = Date.now();
  return {
    id: uid("prj"),
    name,
    createdAt: now,
    updatedAt: now,
    openings: [],
    extras: [],
    drawings: [],
    schemes: {},
    schemeDrawings: {},
    profileColors: {},
    profileNotes: {},
    archive: [],
    settings: defaultSettings(),
  };
}

export function demoProject(): Project {
  const now = Date.now();
  return {
    id: uid("prj"),
    name: "Объект — пример",
    createdAt: now,
    updatedAt: now,
    openings: [
      opening("Кухня", 1650, 2050),
    ],
    extras: [
      { id: uid("ex"), kind: "outer-corner", name: "Сложный внешний угол", length: 600, qty: 4, note: "", photoIds: [], drawingId: null },
    ],
    drawings: [],
    schemes: {},
    schemeDrawings: {},
    profileColors: {},
    profileNotes: {},
    archive: [],
    settings: defaultSettings(),
  };
}
