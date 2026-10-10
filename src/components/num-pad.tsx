import { useEffect, useState } from "react";
import { Delete, Check } from "lucide-react";

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
  const [draft, setDraft] = useState("0");
  const [settled, setSettled] = useState(false);
  const [fresh, setFresh] = useState(true);

  const n = Math.max(min, Number(draft.replace(/\D/g, "") || 0));

  useEffect(() => {
    if (!open) {
      setSettled(false);
      return;
    }
    // Always start at 0 so user types a new value from scratch
    setDraft("0");
    setFresh(true);
    setSettled(false);
    const t = window.setTimeout(() => setSettled(true), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [open, min]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function digit(d: string) {
    setDraft((cur) => {
      if (fresh || cur === "0") {
        setFresh(false);
        return d;
      }
      const next = (cur + d).replace(/\D/g, "").slice(0, 5);
      if (!next) return "0";
      return next.replace(/^0+(?=\d)/, "") || "0";
    });
  }

  function backspace() {
    setDraft((cur) => {
      setFresh(false);
      const next = cur.slice(0, -1);
      if (!next) return "0";
      return next.replace(/\D/g, "") || "0";
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
        <p className="mb-3 font-display text-3xl tabular tracking-tight">
          {n}
          <span className="ml-1 text-base text-muted-foreground">мм</span>
        </p>

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
              const v = Math.max(min, n);
              onConfirm(v);
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
