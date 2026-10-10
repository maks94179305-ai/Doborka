import { useState } from "react";
import { Label } from "@/components/ui/label";
import { NumPad } from "@/components/num-pad";

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
  const [open, setOpen] = useState(false);
  const shown = Number.isFinite(value) ? String(value) : "";

  return (
    <label className="grid gap-1.5">
      <Label>{label}</Label>
      <button
        type="button"
        className="relative flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-1 pr-8 text-center text-sm tabular outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen(true)}
        aria-label={label}
      >
        <span>{shown}</span>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
      </button>
      <NumPad
        open={open}
        value={value}
        min={min ?? 0}
        label={label}
        onConfirm={(n) => onChange(n)}
        onClose={() => setOpen(false)}
      />
    </label>
  );
}
