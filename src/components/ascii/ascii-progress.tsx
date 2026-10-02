import { cn } from "@/lib/cn";

type Props = {
  value: number;
  max: number;
  width?: number;
  className?: string;
  label?: string;
};

/** `▓▓▓▓░░░░ 50%` style progress bar that stays crisp at any zoom level. */
export function AsciiProgress({ value, max, width = 10, className, label }: Props) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const filled = Math.round(ratio * width);
  return (
    <span
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className={cn("term whitespace-pre", className)}
    >
      <span className="text-accent">{"▓".repeat(filled)}</span>
      <span className="text-muted">{"░".repeat(width - filled)}</span>
    </span>
  );
}
