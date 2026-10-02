import { cn } from "@/lib/utils/cn";

/** A small moon orbiting a ring. Stops automatically under reduced motion (global CSS). */
export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("relative inline-block size-3.5 align-[-0.125em]", className)}
    >
      <span aria-hidden className="absolute inset-0 rounded-full hairline" />
      <span aria-hidden className="absolute inset-0 animate-spin [animation-duration:900ms]">
        <span className="absolute -top-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-fg" />
      </span>
    </span>
  );
}
