import type { ComponentProps } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

function fromNumpad(e: { target: EventTarget | null; detail?: { originalEvent?: Event } }) {
  const t = (e.detail?.originalEvent?.target ?? e.target) as HTMLElement | null;
  return !!t?.closest?.("[data-numpad]");
}

export function DialogContent({
  className,
  children,
  title,
  ref,
  instant = false,
  onPointerDownOutside,
  onInteractOutside,
  onFocusOutside,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { title?: string; instant?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-background/70", !instant && "backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0")} />
      <DialogPrimitive.Content
        ref={ref}
        {...props}
        className={cn("fixed left-1/2 top-1/2 z-50 w-[min(28rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/80 bg-card p-6 shadow-float", instant ? "duration-0 animate-none transition-none" : "data-[state=open]:animate-in data-[state=closed]:animate-out", className)}
        style={{ ...(typeof props.style === "object" ? props.style : null), ...(instant ? { animation: "none", transition: "none" } : null) }}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => { if (fromNumpad(e)) e.preventDefault(); onPointerDownOutside?.(e); }}
        onInteractOutside={(e) => { if (fromNumpad(e)) e.preventDefault(); onInteractOutside?.(e); }}
        onFocusOutside={(e) => { if (fromNumpad(e)) e.preventDefault(); onFocusOutside?.(e); }}
      >
        {title ? <DialogPrimitive.Title className="mb-5 font-display text-lg font-medium">{title}</DialogPrimitive.Title> : <DialogPrimitive.Title className="sr-only">Диалог</DialogPrimitive.Title>}
        <DialogPrimitive.Description className="sr-only">Форма приложения Доборка</DialogPrimitive.Description>
        {children}
        <DialogPrimitive.Close data-share-ignore="1" aria-label="Закрыть" className="absolute right-3 top-3 z-30 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
