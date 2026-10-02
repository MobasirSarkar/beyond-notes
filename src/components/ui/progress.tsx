import { cn } from "@/lib/utils/cn";

type Props = { value: number; max: number; className?: string; label?: string };

/** Hairline progress bar. */
export function Progress({ value, max, className, label }: Props) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <span
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className={cn("relative block h-(--bw-strong) w-full overflow-hidden bg-line", className)}
    >
      <span
        className="absolute inset-y-0 left-0 bg-fg transition-[width] duration-(--dur-3) ease-out"
        style={{ width: `${ratio * 100}%` }}
      />
    </span>
  );
}
