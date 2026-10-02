import { cn } from "@/lib/utils/cn";

type Props = { value: number; max: number; width?: number; className?: string; label?: string };

/** ASCII progress bar `■■■■□□□□` that stays crisp at any zoom level. */
export function Progress({ value, max, width = 10, className, label }: Props) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const filled = Math.round(ratio * width);
  return (
    <span
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className={cn("tracking-tighter whitespace-pre", className)}
    >
      <span className="text-fg">{"■".repeat(filled)}</span>
      <span className="text-line">{"■".repeat(width - filled)}</span>
    </span>
  );
}
