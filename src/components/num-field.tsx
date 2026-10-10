import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { NumPad } from "@/components/num-pad";

const LONG_MS = 380;
const PX_PER_STEP = 14;

export function Num({
  label,
  value,
  onChange,
  suffix = "мм",
  min,
  clearOnFocus = false,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  min?: number;
  clearOnFocus?: boolean;
}) {
  const floor = min ?? 0;
  const [open, setOpen] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [live, setLive] = useState<number | null>(null);

  const holdTimer = useRef<number | null>(null);
  const startY = useRef(0);
  const startVal = useRef(0);
  const moved = useRef(false);
  const scrubActive = useRef(false);
  const ptrId = useRef<number | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const shown = live != null ? live : Number.isFinite(value) ? value : floor;

  function clearHold() {
    if (holdTimer.current != null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function endScrub(commit: boolean) {
    clearHold();
    scrubActive.current = false;
    setScrubbing(false);
    if (commit && live != null && live !== value) onChange(live);
    setLive(null);
    ptrId.current = null;
  }

  useEffect(() => () => clearHold(), []);

  function onPointerDown(e: React.PointerEvent) {
    if (e.button != null && e.button !== 0) return;
    e.stopPropagation();
    ptrId.current = e.pointerId;
    startY.current = e.clientY;
    startVal.current = Number.isFinite(value) ? value : floor;
    moved.current = false;
    scrubActive.current = false;
    setLive(null);

    clearHold();
    holdTimer.current = window.setTimeout(() => {
      scrubActive.current = true;
      setScrubbing(true);
      setLive(startVal.current);
      try {
        btnRef.current?.setPointerCapture(e.pointerId);
      } catch { /* ignore */ }
      try {
        navigator.vibrate?.(12);
      } catch { /* ignore */ }
    }, LONG_MS);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (ptrId.current != null && e.pointerId !== ptrId.current) return;
    const dy = startY.current - e.clientY;
    if (!moved.current && Math.abs(e.clientY - startY.current) > 6) {
      moved.current = true;
    }
    if (!scrubActive.current) return;
    const steps = Math.round(dy / PX_PER_STEP);
    const next = Math.max(floor, startVal.current + steps);
    setLive(next);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (ptrId.current != null && e.pointerId !== ptrId.current) return;
    e.stopPropagation();
    e.preventDefault();
    const wasScrub = scrubActive.current;
    const didMove = moved.current;
    clearHold();

    if (wasScrub) {
      endScrub(true);
      return;
    }

    // short tap → open numpad (defer so the same click cannot hit the backdrop)
    if (!didMove) {
      window.setTimeout(() => setOpen(true), 0);
    }
    ptrId.current = null;
    setScrubbing(false);
    setLive(null);
  }

  function onPointerCancel() {
    endScrub(false);
  }

  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <button
        ref={btnRef}
        type="button"
        className={
          "relative flex h-10 w-full touch-none select-none items-center justify-center rounded-md border px-1 pr-8 text-center text-sm tabular outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring " +
          (scrubbing
            ? "border-primary bg-accent text-foreground ring-2 ring-primary/40"
            : "border-input bg-background")
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label={label}
        aria-valuenow={shown}
      >
        <span className="font-medium">{shown}</span>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
        {scrubbing ? (
          <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
            прокрутка
          </span>
        ) : null}
      </button>
      <NumPad
        open={open}
        value={value}
        min={floor}
        label={label}
        onConfirm={(n) => onChange(n)}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
