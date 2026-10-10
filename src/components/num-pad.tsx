import { useEffect, useMemo, useRef, useState } from "react";
import { Delete, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const ITEM = 40;

export function NumPad({
  open,
  value,
  min = 0,
  label,
  onConfirm,
  onClose,
}: {
  open: boolean;
  value: number;
  min?: number;
  label?: string;
  onConfirm: (n: number) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(String(value ?? min ?? 0));
  const wheelRef = useRef<HTMLDivElement>(null);
  const suppress = useRef(false);

  const n = Math.max(min, Number(draft.replace(/\D/g, "") || min));
  const maxWheel = Math.max(n + 40, 120);
  const ticks = useMemo(() => Array.from({ length: maxWheel - min + 1 }, (_, i) => min + i), [min, maxWheel]);

  useEffect(() => {
    if (!open) return;
    setDraft(String(Number.isFinite(value) ? value : min));
  }, [open, value, min]);

  useEffect(() => {
    if (!open || !wheelRef.current) return;
    suppress.current = true;
    wheelRef.current.scrollTop = (n - min) * ITEM;
    requestAnimationFrame(() => { suppress.current = false; });
  }, [open, n, min]);

  function setNum(next: number) {
    const v = Math.max(min, next);
    setDraft(String(v));
  }

  function digit(d: string) {
    setDraft((cur) => {
      const base = cur === "0" || cur === String(value) && cur.length > 2 ? "" : cur;
      const next = (base + d).replace(/\D/g, "").slice(0, 5);
      return next === "" ? String(min) : String(Math.max(min, Number(next)));
    });
  }

  function backspace() {
    setDraft((cur) => {
      const next = cur.slice(0, -1);
      if (!next) return String(min);
      return String(Math.max(min, Number(next.replace(/\D/g, "") || min)));
    });
  }

  function onWheelScroll() {
    if (suppress.current || !wheelRef.current) return;
    const idx = Math.round(wheelRef.current.scrollTop / ITEM);
    const v = min + Math.max(0, Math.min(ticks.length - 1, idx));
    setDraft(String(v));
  }

  if (!open) return null;

  return (
    <div
      data-numpad
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center"
      onClick={onClose}
    >
      <div
        data-numpad
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        {label ? <p className="mb-2 text-sm text-muted-foreground">{label}</p> : null}
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-display text-3xl tabular tracking-tight">{n}<span className="ml-1 text-base text-muted-foreground">мм</span></p>
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" type="button" onClick={() => setNum(n - 1)} disabled={n <= min}>−</Button>
            <Button size="sm" variant="secondary" type="button" onClick={() => setNum(n + 1)}>+</Button>
          </div>
        </div>

        <div className="relative mb-3 h-[120px] overflow-hidden rounded-xl border border-border bg-[#141816]">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-10 -translate-y-1/2 rounded-md border border-steel/40 bg-steel/10" />
          <div
            ref={wheelRef}
            onScroll={onWheelScroll}
            className="h-full overflow-y-auto scroll-smooth px-2"
            style={{ scrollSnapType: "y mandatory" }}
          >
            <div style={{ height: ITEM * 1.5 }} />
            {ticks.map((t) => (
              <div
                key={t}
                className={"flex h-10 items-center justify-center scroll-snap-center text-lg tabular " + (t === n ? "font-semibold text-foreground" : "text-muted-foreground")}
                style={{ scrollSnapAlign: "center" }}
              >
                {t}
              </div>
            ))}
            <div style={{ height: ITEM * 1.5 }} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button key={d} type="button" className="h-12 rounded-xl border border-border bg-background text-lg font-medium active:bg-accent" onClick={() => digit(d)}>{d}</button>
          ))}
          <button type="button" className="h-12 rounded-xl border border-border bg-background text-lg active:bg-accent" onClick={backspace} aria-label="Стереть"><Delete className="mx-auto h-5 w-5" /></button>
          <button type="button" className="h-12 rounded-xl border border-border bg-background text-lg font-medium active:bg-accent" onClick={() => digit("0")}>0</button>
          <button type="button" className="h-12 rounded-xl border border-steel/50 bg-primary text-primary-foreground active:opacity-90" onClick={() => { onConfirm(n); onClose(); }} aria-label="Готово"><Check className="mx-auto h-5 w-5" /></button>
        </div>
      </div>
    </div>
  );
}
