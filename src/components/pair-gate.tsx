import { useEffect, useState } from "react";
import { markPairSeen, pairPromptPending, setPairPin } from "@/lib/pair-pin";
import { useWorkspace } from "@/lib/store";

export function PairGate() {
  const ready = useWorkspace((s) => s.ready);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    setOpen(pairPromptPending());
    const on = () => setOpen(pairPromptPending());
    const skipOnTab = () => { markPairSeen(); setOpen(false); };
    window.addEventListener("doborka-pair", on);
    window.addEventListener("doborka-skip-pair", skipOnTab);
    return () => { window.removeEventListener("doborka-pair", on); window.removeEventListener("doborka-skip-pair", skipOnTab); };
  }, [ready]);

  if (!open) return null;

  function connect() {
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 4) {
      setError("Введите 4 цифры");
      return;
    }
    setPairPin(digits);
    markPairSeen();
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#161618] px-6" style={{ pointerEvents: "auto" }}>
      <img src="/icon-192.png?v=pc" alt="" width={96} height={96} className="size-24 rounded-[1.6rem]" />
      <h1 className="mt-6 font-display text-3xl font-medium text-[#f3f1ec]">Доборка</h1>
      <p className="mt-2 max-w-sm text-center text-sm text-[#b7b1a6]">Введите пин-код и нажмите «Подключить».</p>
      <input
        value={code}
        inputMode="numeric"
        autoFocus
        maxLength={4}
        placeholder="0000"
        onChange={(e) => { setError(""); setCode(e.target.value.replace(/\D/g, "").slice(0, 4)); }}
        onKeyDown={(e) => { if (e.key === "Enter") connect(); }}
        className="mt-6 h-14 w-full max-w-sm rounded-xl border border-[#d7d1c6] bg-[#111] px-4 text-center text-2xl tracking-[0.3em] text-[#f3f1ec]"
      />
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      <button type="button" onClick={connect} className="mt-4 h-12 w-full max-w-sm rounded-xl bg-[#e8e4d8] text-base font-medium text-[#141816]">Подключить</button>
      <button type="button" onClick={() => { markPairSeen(); setOpen(false); }} className="mt-3 h-11 text-base text-[#f3f1ec] underline">Позже</button>
    </div>
  );
}
