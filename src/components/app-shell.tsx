import { useEffect } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Archive, Boxes, LayoutGrid, Ruler, Settings2 } from "lucide-react";
import { useWorkspace } from "@/lib/store";
import { useTeamSync } from "@/lib/team-sync";
import { PairGate } from "@/components/pair-gate";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Откосы", icon: LayoutGrid },
  { to: "/elementy", label: "Другие элементы", icon: Boxes },
  { to: "/raschet", label: "Раскрой", icon: Ruler },
  { to: "/arxiv", label: "История", icon: Archive },
  { to: "/esche", label: "Настройки", icon: Settings2 },
] as const;

function NavWords({ label }: { label: string }) {
  const parts = label.split(" ");
  if (parts.length < 2) return label;
  return (
    <span className="flex flex-col leading-tight">
      {parts.map((part, i) => (
        <span key={`${part}-${i}`}>{part}</span>
      ))}
    </span>
  );
}

function Mark() {
  return (
    <span
      className="grid size-9 place-items-center overflow-hidden rounded-[12px] shadow-[0_10px_18px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.2)] ring-1 ring-white/15"
      aria-hidden
    >
      <img src="/icon-192.png?v=pc" alt="" className="size-9 object-cover" />
    </span>
  );
}

export function AppShell() {
  const markReady = useWorkspace((s) => s.markReady);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useTeamSync();
  const onOpenings = pathname === "/";

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      document.documentElement.classList.add("app-ready");
      markReady();
    };
    const timer = window.setTimeout(finish, 1500);
    void Promise.resolve(useWorkspace.persist.rehydrate()).finally(() => {
      window.clearTimeout(timer);
      finish();
    });
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, [markReady]);

  return (
    <div className="flex min-h-dvh flex-col bg-transparent text-foreground">
      <PairGate />
      <header className={cn("no-print px-3 pt-3 md:px-4", !onOpenings && "hidden md:block")}>
        <div className={cn("mx-auto flex max-w-5xl items-center gap-3 rounded-2xl border border-border/70 bg-card/85 px-3 py-2 shadow-panel backdrop-blur-md", onOpenings ? "justify-between" : "justify-end")}>
          {onOpenings ? (
            <Link to="/" className="flex items-center gap-2.5">
              <Mark />
              <span className="flex flex-col leading-none">
                <span className="font-display text-base font-medium tracking-tight">Доборка</span>
                <span className="mt-0.5 hidden text-[11px] text-muted-foreground sm:inline">откосы и раскрой</span>
              </span>
            </Link>
          ) : null}
          <nav className="hidden rounded-full bg-secondary/70 p-1 md:flex">
            {NAV.map((item) => {
              const active = pathname === item.to;
              return (
                <Link key={item.to} to={item.to} className={cn("flex min-h-9 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm leading-tight transition-colors duration-150", active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
                  <item.icon className="size-4 shrink-0" />
                  <NavWords label={item.label} />
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 pb-28 md:pb-10">
        <Outlet />
      </main>
      <nav className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] md:hidden">
        <ul className="pointer-events-auto mx-auto grid max-w-lg grid-cols-5 rounded-2xl border border-border/80 bg-card/92 p-1.5 shadow-float backdrop-blur-md">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <li key={item.to}>
                <Link to={item.to} className={cn("flex h-16 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-center text-[10px] font-medium leading-tight transition-colors duration-150", active ? "bg-primary/10 text-foreground" : "text-muted-foreground")}>
                  <item.icon className={cn("size-5", active && "text-steel")} />
                  <NavWords label={item.label} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
