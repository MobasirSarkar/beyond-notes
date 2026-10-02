import { PRIORITY_META } from "@/lib/constants/priority";
import { cn } from "@/lib/utils/cn";
import type { Priority } from "@/types/domain";

const BARS = [1, 2, 3, 4] as const;

/** Four ascending bars, filled up to the priority rank (like signal strength). */
export function PriorityMark({ priority, className }: { priority: Priority; className?: string }) {
  const rank = PRIORITY_META[priority].rank;
  return (
    <span
      role="img"
      aria-label={`${PRIORITY_META[priority].label} priority`}
      className={cn("inline-flex h-3 items-end gap-0.5", className)}
    >
      {BARS.map((bar) => (
        <span
          key={bar}
          className={cn("w-0.5", bar <= rank ? "bg-current" : "bg-line")}
          style={{ height: `${bar * 25}%` }}
        />
      ))}
    </span>
  );
}
