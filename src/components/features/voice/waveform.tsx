"use client";

import { createTimer } from "animejs";
import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils/cn";

const BARS = 20;
const IDLE_SCALE = 0.12;
const STATIC = Array.from({ length: BARS }, (_, i) => 0.35 + 0.45 * Math.abs(Math.sin(i * 0.9)));

/** Live level meter: thin bars scaled by an anime.js timer at 24fps while listening. */
export function Waveform({ active, className }: { active: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const bars = [...el.children].filter((c) => c instanceof HTMLElement);
    const paint = (level: (i: number) => number) =>
      bars.forEach((bar, i) => {
        bar.style.transform = `scaleY(${level(i).toFixed(3)})`;
      });
    if (!active || reduced) {
      paint((i) => (active ? (STATIC[i] ?? IDLE_SCALE) : IDLE_SCALE));
      return;
    }
    const timer = createTimer({
      frameRate: 24,
      loop: true,
      duration: 100_000,
      onUpdate: (self) => {
        const t = self.currentTime / 1000;
        paint((i) => {
          // Two drifting sines shape the envelope; a little noise keeps it alive.
          const centre = 1 - Math.abs(i / (BARS - 1) - 0.5) * 1.2;
          const env = (Math.sin(t * 7 + i * 0.55) + Math.sin(t * 3.1 - i * 0.3) + 2) / 4;
          return Math.max(
            IDLE_SCALE,
            Math.min(1, centre * (0.25 + env * 0.6 + Math.random() * 0.25)),
          );
        });
      },
    });
    return () => {
      timer.revert();
      paint(() => IDLE_SCALE);
    };
  }, [active, reduced]);

  return (
    <span ref={ref} aria-hidden className={cn("flex h-5 shrink-0 items-center gap-0.5", className)}>
      {STATIC.map((_, i) => (
        <span
          key={i}
          className="h-full w-0.5 origin-center rounded-full bg-current transition-transform duration-(--dur-1)"
          style={{ transform: `scaleY(${IDLE_SCALE})` }}
        />
      ))}
    </span>
  );
}
