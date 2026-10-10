import { useEffect, useState } from "react";
import { Delete, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const SETTLE_MS = 320;

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
  const [settled, setSettled] = useState(false);

  const n = Math.max(min, Number(draft.replace(/\D/g, "") || min));

  useEffect(() => {
    if (!open) {
      setSettled(false);
      return;
    }
    setDraft(String(Number.isFinite(value) ? value : min));
    setSettled(false);
    const t = window.setTimeout(() => setSettled(true), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [open, value, min]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function setNum(next: number) {
    setDraft(String(Math.max(min, next)));
  }

  function digit(d: string) {
    setDraft((cur) => {
      const next = (cur + d).replace(/\D/g, "").slice(0, 5);
      if (!next) return String(min);
      return String(Math.max(min, Number(next)));
    });
  }

  function backspace() {
    setDraft((cur) => {
      const next = cur.slice(0, -1);
      if (!next) return String(min);
      return String(Math.max(min, Number(next.replace(/\D/g, "") || min)));
    });
  }

  function tryClose() {
    if (!settled) return;
    onClose();
  }

  if (!open) return null;

  return (
    <div
      data-numpad
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          tryClose();
        }
      }}
    >
      <div
        data-numpad
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-float"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {label ? <p className="mb-2 text-sm text-muted-foreground">{label}</p> : null}
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-display text-3xl tabular tracking-tight">
            {n}
            <span className="ml-1 text-base text-muted-foreground">мм</span>
          </p>
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" type="button" onClick={() => setNum(n - 1)} disabled={n <= min}>
              −
            </Button>
            <Button size="sm" variant="secondary" type="button" onClick={() => setNum(n + 1)}>
              +
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              type="button"
              className="h-12 rounded-xl border border-border bg-background text-lg font-medium active:bg-accent"
              onClick={() => digit(d)}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            className="h-12 rounded-xl border border-border bg-background text-lg active:bg-accent"
            onClick={backspace}
            aria-label="Стереть"
          >
            <Delete className="mx-auto h-5 w-5" />
          </button>
          <button
            type="button"
            className="h-12 rounded-xl border border-border bg-background text-lg font-medium active:bg-accent"
            onClick={() => digit("0")}
          >
            0
          </button>
          <button
            type="button"
            className="h-12 rounded-xl border border-steel/50 bg-primary text-primary-foreground active:opacity-90"
            onClick={() => {
              onConfirm(n);
              onClose();
            }}
            aria-label="Готово"
          >
            <Check className="mx-auto h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
