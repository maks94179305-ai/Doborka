import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (Number.isFinite(value) ? String(value) : "");

  function commit(text: string) {
    const digits = text.replace(/\D/g, "");
    let n = digits === "" ? (min ?? 0) : Number(digits);
    if (!Number.isFinite(n)) n = min ?? 0;
    if (min != null) n = Math.max(min, n);
    onChange(n);
    setDraft(null);
  }

  return (
    <label className="grid gap-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          inputMode="numeric"
          value={shown}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
          onFocus={() => { if (clearOnFocus) setDraft(""); }} onBlur={() => commit(shown)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="tabular px-1 pr-8 text-center"
        />
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      </div>
    </label>
  );
}
