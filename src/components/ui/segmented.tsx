"use client";

import { cn } from "@/lib/utils/cn";
import type { SegmentOption } from "@/types/ui";

type Props<T extends string> = {
  label: string;
  value: T;
  options: readonly SegmentOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
};

/** Single-choice segmented control (radiogroup) with arrow-key support. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  className,
  size = "md",
}: Props<T>) {
  /** Arrow keys move selection and focus together (roving tabindex). */
  const move = (delta: number, from: HTMLElement) => {
    const index = options.findIndex((o) => o.value === value);
    const nextIndex = (index + delta + options.length) % options.length;
    const next = options[nextIndex];
    if (!next) return;
    onChange(next.value);
    from.parentElement?.querySelectorAll<HTMLElement>("[role=radio]")[nextIndex]?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex max-w-full overflow-x-auto bg-bg hairline", className)}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") move(1, e.currentTarget);
              if (e.key === "ArrowLeft" || e.key === "ArrowUp") move(-1, e.currentTarget);
            }}
            className={cn(
              "flex-1 px-3 whitespace-nowrap transition-colors duration-(--dur-1) disabled:cursor-not-allowed",
              size === "sm" ? "h-7 text-xs" : "h-9 text-sm",
              selected ? "bg-fg text-bg" : "text-muted hover:bg-surface hover:text-fg",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
