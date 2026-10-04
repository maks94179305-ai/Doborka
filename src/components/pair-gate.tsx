import { useEffect, useState } from "react";
import { PairConnectForm } from "@/components/pair-panel";
import { Button } from "@/components/ui/button";
import { markPairSeen, pairPromptPending } from "@/lib/pair-pin";
import { useWorkspace } from "@/lib/store";

export function PairGate() {
  const ready = useWorkspace((s) => s.ready);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    setOpen(pairPromptPending());
    const on = () => setOpen(pairPromptPending());
    window.addEventListener("doborka-pair", on);
    return () => window.removeEventListener("doborka-pair", on);
  }, [ready]);

  if (!open) return null;

  function skip() {
    markPairSeen();
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#161618] px-6" style={{ pointerEvents: "auto", WebkitAppRegion: "no-drag" }}>
      <img src="/icon-192.png?v=pc" alt="" width={96} height={96} className="size-24 rounded-[1.6rem] shadow-[0_18px_40px_rgba(0,0,0,.45)]" />
      <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-[#f3f1ec]">Доборка</h1>
      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        Свяжите телефон и компьютер одним пин-кодом — объект и история будут общими.
      </p>
      <div className="mt-6 w-full max-w-sm">
        <PairConnectForm autoFocus onDone={() => setOpen(false)} />
      </div>
      <Button type="button" variant="ghost" className="mt-4 text-muted-foreground" onClick={skip} onPointerDown={skip}>
        Позже
      </Button>
    </div>
  );
}
