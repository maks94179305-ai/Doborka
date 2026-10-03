import { useEffect, useState } from "react";
import { Link2, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPin, generatePin, readPairPin, setPairPin } from "@/lib/pair-pin";

export function PairConnectForm({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const [join, setJoin] = useState("");
  const [error, setError] = useState("");
  function create() { setError(""); setPairPin(generatePin()); onDone?.(); }
  function connect() {
    const digits = join.replace(/\D/g, "");
    if (!/^\d{4}$/.test(digits)) { setError("Введите 4 цифры"); return; }
    setError(""); setJoin(""); setPairPin(digits); onDone?.();
  }
  return (
    <div className="space-y-3">
      <Button className="w-full" onClick={create}>Создать пин-код</Button>
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid min-w-[10rem] flex-1 gap-1.5">
          <span className="text-xs uppercase tracking-[0.14em] text-steel">Или ввести код</span>
          <Input inputMode="numeric" autoComplete="one-time-code" autoFocus={autoFocus} maxLength={5} placeholder="00 00" value={formatPin(join)} onChange={(e) => { setError(""); setJoin(e.target.value.replace(/\D/g, "").slice(0, 4)); }} onKeyDown={(e) => { if (e.key === "Enter") connect(); }} />
        </label>
        <Button variant="secondary" onClick={connect} disabled={join.replace(/\D/g, "").length !== 4}>Подключить</Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function PairPanel() {
  const [pin, setPin] = useState<string | null>(null);
  useEffect(() => {
    setPin(readPairPin());
    const on = () => setPin(readPairPin());
    window.addEventListener("doborka-pair", on);
    return () => window.removeEventListener("doborka-pair", on);
  }, []);
  return (
    <section className="panel space-y-3 p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-foreground"><Link2 className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-medium">Связь устройств</h2>
          <p className="mt-1 text-sm text-muted-foreground">Один пин-код на телефоне и компьютере. Тогда объект, чертежи и история общие только у этой пары, а не у всех.</p>
        </div>
      </div>
      {pin ? (
        <>
          <p className="text-xs uppercase tracking-[0.14em] text-steel">Пин-код этой пары</p>
          <p className="font-display text-4xl tabular tracking-[0.18em] text-foreground">{formatPin(pin)}</p>
          <p className="text-sm text-muted-foreground">На другом устройстве введите этот код при запуске или в настройках.</p>
          <Button variant="outline" onClick={() => setPairPin(null)}><Unplug /> Отключить устройство</Button>
        </>
      ) : <PairConnectForm />}
    </section>
  );
}
