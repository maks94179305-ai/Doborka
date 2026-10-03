import { mm, meters, pct } from "./format";
import { collectPieces, groupByMaterial } from "./pieces";
import type { MaterialPlan } from "./cutting";
import type { CuttingPlan, Project } from "./types";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildReportHtml(project: Project, plan: CuttingPlan, materials?: MaterialPlan[]): string {
  const pieces = collectPieces(project);
  const groups = materials ?? groupByMaterial(pieces).map((g) => ({ ...g, plan }));
  const order = groups.map((g) => {
    const counts = g.plan.barCounts.map((c) => `<li>${mm(c.length)} × ${c.count}</li>`).join("");
    const els = g.lengthGroups.map((row) => `<tr><td>${escapeHtml(row.title)}</td><td>${mm(row.length)}</td><td>${row.count}</td></tr>`).join("");
    return `<section><h3>${escapeHtml(g.title)} · ${g.pieces.length} шт · ${meters(g.plan.totalMm)}</h3><ul>${counts || "<li>—</li>"}</ul><table><tbody>${els}</tbody></table></section>`;
  }).join("");
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"/><title>Доборка — ${escapeHtml(project.name)}</title></head><body><h1>Доборка</h1><p>${escapeHtml(project.name)}</p><p><b>${meters(plan.totalMm)}</b> заказать · отход ${pct(plan.wastePercent)} · элементов ${pieces.length}</p>${order}</body></html>`;
}

export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
