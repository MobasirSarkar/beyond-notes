"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import type { SliderStep } from "@/types/ui";

type Props<T extends string> = {
  label: string;
  value: T;
  steps: readonly SliderStep<T>[];
  onChange: (value: T) => void;
  /** Captions under the track's ends, e.g. "all" … "urgent only". */
  start?: ReactNode;
  end?: ReactNode;
  /** `stacked` is a small panel (title, track, captions); `inline` fits a toolbar row. */
  layout?: "stacked" | "inline";
  className?: string;
};

/** Track position of a step as a CSS length: the ends are inset by `--slider-pad`. */
const at = (ratio: number) =>
  `calc(var(--slider-pad) + (100% - 2 * var(--slider-pad)) * ${ratio.toFixed(4)})`;

/**
 * Discrete "glider": a track with a dot per step and a thumb that snaps
 * between them. Drag, click or use the keyboard (arrows, Home/End).
 */
export function StepSlider<T extends string>({
  label,
  value,
  steps,
  onChange,
  start,
  end,
  layout = "stacked",
  className,
}: Props<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const index = Math.max(
    0,
    steps.findIndex((s) => s.value === value),
  );
  const last = Math.max(1, steps.length - 1);
  const current = steps[index];

  const set = (i: number) => {
    const step = steps[Math.min(steps.length - 1, Math.max(0, i))];
    if (step && step.value !== value) onChange(step.value);
  };

  // Snap to the dot nearest the pointer (dots carry the exact geometry).
  const fromPointer = (clientX: number) => {
    const dots = trackRef.current?.querySelectorAll<HTMLElement>("[data-step]") ?? [];
    let best = index;
    let bestDistance = Number.POSITIVE_INFINITY;
    dots.forEach((dot, i) => {
      const r = dot.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - clientX);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    set(best);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    setDragging(true);
    fromPointer(e.clientX);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowUp: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: index - 1,
      Home: 0,
      End: steps.length - 1,
    };
    const next = keys[e.key];
    if (next === undefined) return;
    e.preventDefault();
    set(next);
  };

  const track = (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={steps.length - 1}
      aria-valuenow={index}
      aria-valuetext={current?.label}
      onPointerDown={onPointerDown}
      onPointerMove={(e) => dragging && fromPointer(e.clientX)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={onKeyDown}
      className={cn(
        "group relative h-8 cursor-pointer touch-none rounded-full bg-surface-2/80 shadow-[inset_0_var(--bw)_0.25rem_var(--shadow-color)] select-none focus-visible:outline-none",
        layout === "inline" && "min-w-40 flex-1",
      )}
    >
      {steps.map((s, i) => (
        <span
          key={s.value}
          data-step=""
          aria-hidden
          style={{ left: at(i / last) }}
          className={cn(
            "absolute top-1/2 size-1 -translate-1/2 rounded-full transition-colors duration-(--dur-2)",
            i <= index ? "bg-muted" : "bg-subtle/60",
          )}
        />
      ))}
      <span
        aria-hidden
        style={{ left: at(index / last) }}
        className={cn(
          "absolute top-1/2 h-5 w-7 -translate-1/2 rounded-full bg-fg shadow-float transition-[left,scale,box-shadow] duration-(--dur-3) ease-out",
          "group-focus-visible:shadow-glow group-active:scale-95",
          dragging && "duration-(--dur-1)",
        )}
      />
    </div>
  );

  if (layout === "inline") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <span className="shrink-0 text-xs text-muted">
          {label} <span className="font-medium text-fg">{current?.label}</span>
        </span>
        {track}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2.5 rounded-card lift p-3.5", className)}>
      <p className="flex items-baseline gap-2 text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-medium text-fg">{current?.label}</span>
        {current?.hint ? <span className="ml-auto text-xs text-subtle">{current.hint}</span> : null}
      </p>
      {start || end ? (
        <p className="flex justify-between text-xs text-subtle" aria-hidden>
          <span>{start}</span>
          <span>{end}</span>
        </p>
      ) : null}
      {track}
    </div>
  );
}
