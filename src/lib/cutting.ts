import { uid } from "./utils";
import { groupByMaterial, type MaterialGroup } from "./pieces";
import type { CuttingPlan, NeedPiece, StockBar, Strategy } from "./types";

type Packed = { piece: NeedPiece; cost: number };

function knapsackIds(capacity: number, items: { id: string; cost: number }[]): string[] {
  const C = Math.floor(Math.max(0, capacity));
  const n = items.length;
  if (C <= 0 || n === 0) return [];
  const value = new Int32Array(C + 1);
  const choose: Uint8Array[] = Array.from({ length: n }, () => new Uint8Array(C + 1));
  for (let i = 0; i < n; i++) {
    const w = Math.round(items[i].cost);
    if (w <= 0 || w > C) continue;
    for (let c = C; c >= w; c--) {
      const cand = value[c - w] + w;
      if (cand > value[c]) {
        value[c] = cand;
        choose[i][c] = 1;
      }
    }
  }
  const picked: string[] = [];
  let c = C;
  for (let i = n - 1; i >= 0; i--) {
    if (choose[i][c]) {
      picked.push(items[i].id);
      c -= Math.round(items[i].cost);
      if (c < 0) break;
    }
  }
  return picked;
}

function fillBar(first: NeedPiece, rest: NeedPiece[], stock: number, kerf: number): NeedPiece[] {
  if (first.length > stock) return [];
  const remainingCap = stock - first.length;
  const items = rest.map((p) => ({ id: p.id, cost: p.length + kerf }));
  const ids = new Set(knapsackIds(remainingCap, items));
  const extras = rest.filter((p) => ids.has(p.id));
  extras.sort((a, b) => b.length - a.length);
  return [first, ...extras];
}

function usedOnBar(pieces: NeedPiece[], kerf: number): number {
  if (pieces.length === 0) return 0;
  return pieces.reduce((s, p) => s + p.length, 0) + kerf * (pieces.length - 1);
}

function scoreBar(stock: number, packed: NeedPiece[], kerf: number, strategy: Strategy, minRemainder: number): number {
  const used = usedOnBar(packed, kerf);
  const waste = stock - used;
  const util = used / stock;
  if (strategy === "short") return util * 100 + packed.length - stock / 10000;
  if (strategy === "meters") return util * 200 + packed.length * 2 - stock / 5000;
  const leftoverPenalty = waste > 0 && waste < minRemainder ? waste * 0.15 : waste * 0.02;
  return util * 300 + packed.length * 4 - leftoverPenalty - stock / 8000;
}

function pickBar(remaining: NeedPiece[], stocks: number[], kerf: number, strategy: Strategy, minRemainder: number): { stock: number; packed: NeedPiece[] } | null {
  const sorted = [...remaining].sort((a, b) => b.length - a.length);
  const first = sorted[0];
  if (!first) return null;
  let best: { stock: number; packed: NeedPiece[]; score: number } | null = null;
  const rest = sorted.slice(1);
  for (const stock of stocks) {
    if (first.length > stock) continue;
    const packed = fillBar(first, rest, stock, kerf);
    if (packed.length === 0) continue;
    const score = scoreBar(stock, packed, kerf, strategy, minRemainder);
    if (!best || score > best.score) best = { stock, packed, score };
  }
  return best ? { stock: best.stock, packed: best.packed } : null;
}

function buildBars(pieces: NeedPiece[], stocks: number[], kerf: number, strategy: Strategy, minRemainder: number): { bars: Packed[][]; stocksUsed: number[] } {
  const remaining = [...pieces];
  const bars: Packed[][] = [];
  const stocksUsed: number[] = [];
  while (remaining.length) {
    const pick = pickBar(remaining, stocks, kerf, strategy, minRemainder);
    if (!pick) break;
    const ids = new Set(pick.packed.map((p) => p.id));
    bars.push(pick.packed.map((p) => ({ piece: p, cost: p.length })));
    stocksUsed.push(pick.stock);
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (ids.has(remaining[i].id)) remaining.splice(i, 1);
    }
  }
  return { bars, stocksUsed };
}

function toPlan(pieces: NeedPiece[], packedBars: NeedPiece[][], stocksUsed: number[], kerf: number, minRemainder: number, unplaced: NeedPiece[]): CuttingPlan {
  const bars: StockBar[] = packedBars.map((cuts, i) => {
    const stockLength = stocksUsed[i];
    const used = usedOnBar(cuts, kerf);
    const leftover = Math.max(0, stockLength - used);
    return {
      id: uid("bar"),
      index: i + 1,
      stockLength,
      cuts: cuts.map((p) => ({ pieceId: p.id, length: p.length, label: p.label, color: p.color, openingName: p.openingName ?? p.extraName })),
      used,
      waste: leftover,
      leftover,
      usableRemainder: leftover >= minRemainder,
    };
  });
  const totalMm = bars.reduce((s, b) => s + b.stockLength, 0);
  const usedMm = bars.reduce((s, b) => s + b.used, 0);
  const remainderMm = bars.reduce((s, b) => s + (b.usableRemainder ? b.leftover : 0), 0);
  const wasteMm = totalMm - usedMm - remainderMm;
  const counts = new Map<number, number>();
  for (const b of bars) counts.set(b.stockLength, (counts.get(b.stockLength) ?? 0) + 1);
  const pieceToBar: Record<string, number> = {};
  for (const b of bars) for (const c of b.cuts) pieceToBar[c.pieceId] = b.index;
  return {
    bars,
    totalMm,
    usedMm,
    wasteMm,
    remainderMm,
    wastePercent: totalMm === 0 ? 0 : ((totalMm - usedMm) / totalMm) * 100,
    barCounts: [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([length, count]) => ({ length, count })),
    unplaced,
    pieceToBar,
  };
}

function better(a: CuttingPlan, b: CuttingPlan, strategy: Strategy): boolean {
  if (a.unplaced.length !== b.unplaced.length) return a.unplaced.length < b.unplaced.length;
  if (strategy === "meters") {
    if (a.totalMm !== b.totalMm) return a.totalMm < b.totalMm;
    if (a.wasteMm !== b.wasteMm) return a.wasteMm < b.wasteMm;
    return a.bars.length < b.bars.length;
  }
  if (strategy === "short") {
    const aAvg = a.bars.length ? a.totalMm / a.bars.length : 0;
    const bAvg = b.bars.length ? b.totalMm / b.bars.length : 0;
    if (Math.abs(aAvg - bAvg) > 1) return aAvg < bAvg;
    if (a.wastePercent !== b.wastePercent) return a.wastePercent < b.wastePercent;
    return a.totalMm < b.totalMm;
  }
  if (a.wastePercent !== b.wastePercent) return a.wastePercent < b.wastePercent;
  if (a.totalMm !== b.totalMm) return a.totalMm < b.totalMm;
  return a.bars.length < b.bars.length;
}

export function emptyPlan(unplaced: NeedPiece[] = []): CuttingPlan {
  return { bars: [], totalMm: 0, usedMm: 0, wasteMm: 0, remainderMm: 0, wastePercent: 0, barCounts: [], unplaced, pieceToBar: {} };
}

export function optimizeCuts(pieces: NeedPiece[], stockLengths: number[], kerf: number, minRemainder: number, strategy: Strategy): CuttingPlan {
  const stocks = [...new Set(stockLengths.filter((n) => n > 0))].sort((a, b) => a - b);
  if (stocks.length === 0) return emptyPlan(pieces);
  const maxStock = stocks[stocks.length - 1];
  const unplaced = pieces.filter((p) => p.length > maxStock || p.length <= 0);
  const placeable = pieces.filter((p) => p.length > 0 && p.length <= maxStock);
  if (placeable.length === 0) return emptyPlan(unplaced);
  const variants: Strategy[] = strategy === "waste" ? ["waste", "meters"] : [strategy, "waste"];
  let best: CuttingPlan | null = null;
  for (const strat of variants) {
    const { bars, stocksUsed } = buildBars(placeable, stocks, kerf, strat, minRemainder);
    const packedPieces = bars.map((row) => row.map((x) => x.piece));
    const leftoverIds = new Set(packedPieces.flat().map((p) => p.id));
    const missed = placeable.filter((p) => !leftoverIds.has(p.id));
    const plan = toPlan(placeable, packedPieces, stocksUsed, kerf, minRemainder, [...unplaced, ...missed]);
    if (!best || better(plan, best, strategy)) best = plan;
  }
  return best ?? emptyPlan(pieces);
}

export function mergePlans(plans: CuttingPlan[]): CuttingPlan {
  if (plans.length === 0) return emptyPlan();
  if (plans.length === 1) return plans[0];
  const bars: StockBar[] = [];
  const pieceToBar: Record<string, number> = {};
  const unplaced: NeedPiece[] = [];
  let index = 1;
  for (const plan of plans) {
    for (const b of plan.bars) {
      bars.push({ ...b, index });
      for (const c of b.cuts) pieceToBar[c.pieceId] = index;
      index += 1;
    }
    unplaced.push(...plan.unplaced);
  }
  const totalMm = bars.reduce((s, b) => s + b.stockLength, 0);
  const usedMm = bars.reduce((s, b) => s + b.used, 0);
  const remainderMm = bars.reduce((s, b) => s + (b.usableRemainder ? b.leftover : 0), 0);
  const wasteMm = totalMm - usedMm - remainderMm;
  const counts = new Map<number, number>();
  for (const b of bars) counts.set(b.stockLength, (counts.get(b.stockLength) ?? 0) + 1);
  return {
    bars,
    totalMm,
    usedMm,
    wasteMm,
    remainderMm,
    wastePercent: totalMm === 0 ? 0 : ((totalMm - usedMm) / totalMm) * 100,
    barCounts: [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([length, count]) => ({ length, count })),
    unplaced,
    pieceToBar,
  };
}

export type MaterialPlan = MaterialGroup & { plan: CuttingPlan };

export function plansByMaterial(pieces: NeedPiece[], stockLengths: number[], kerf: number, minRemainder: number, strategy: Strategy): MaterialPlan[] {
  return groupByMaterial(pieces).map((g) => ({ ...g, plan: optimizeCuts(g.pieces, stockLengths, kerf, minRemainder, strategy) }));
}

export function barsForOpening(plan: CuttingPlan, openingName: string): StockBar[] {
  return plan.bars.filter((b) => b.cuts.some((c) => c.openingName === openingName));
}
