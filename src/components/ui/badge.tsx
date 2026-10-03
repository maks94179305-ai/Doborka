import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"span"> & {
  tone?: "default" | "ok" | "waste" | "steel";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        tone === "default" && "bg-secondary text-secondary-foreground",
        tone === "ok" && "bg-ok/20 text-ok",
        tone === "waste" && "bg-waste/20 text-waste",
        tone === "steel" && "bg-steel/20 text-steel",
        className,
      )}
      {...props}
    />
  );
}
