import { mm } from "@/lib/format";
import type { StockBar } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BarScheme({ bar }: { bar: StockBar }) {
  return (
    <article className="panel min-w-0 overflow-hidden p-4">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-sm font-medium">
          Хлыст {mm(bar.stockLength)}
          <span className="ml-2 text-muted-foreground">№{bar.index}</span>
        </h3>
        <p className="tabular text-xs text-muted-foreground">
          {bar.usableRemainder ? (
            <span className="text-steel">остаток {mm(bar.leftover)}</span>
          ) : (
            <span className="text-waste">отход {mm(bar.leftover)}</span>
          )}
        </p>
      </header>
      <div className="flex h-12 overflow-hidden rounded-lg border border-border bg-background/70">
        {bar.cuts.map((c) => {
          const w = (c.length / bar.stockLength) * 100;
          return (
            <div key={c.pieceId} title={`${c.label} · ${mm(c.length)}`} className="relative flex min-w-0 items-center justify-center overflow-hidden border-r border-background/40" style={{ width: `${w}%`, background: c.color }}>
              {w > 12 ? <span className="truncate px-1 text-[10px] font-medium text-primary-foreground">{c.label}</span> : null}
            </div>
          );
        })}
        {bar.leftover > 0 ? (
          <div className={cn("hatch min-w-0", bar.usableRemainder ? "bg-steel/10" : "bg-waste/10")} style={{ width: `${(bar.leftover / bar.stockLength) * 100}%` }} title={bar.usableRemainder ? `Остаток ${mm(bar.leftover)}` : `Отход ${mm(bar.leftover)}`} />
        ) : null}
      </div>
      <ul className="mt-3 space-y-1.5">
        {bar.cuts.map((c) => (
          <li key={c.pieceId} className="flex items-start justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <i className="size-2.5 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
              <span className="truncate">{c.label}</span>
            </span>
            <span className="tabular shrink-0 text-muted-foreground">{mm(c.length)}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
