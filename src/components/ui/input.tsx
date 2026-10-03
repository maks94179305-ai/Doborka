import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-lg border border-input bg-background/70 px-3 text-sm text-foreground",
        "placeholder:text-muted-foreground",
        "transition-colors duration-150",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
