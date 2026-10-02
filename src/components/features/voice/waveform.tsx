"use client";

import { createTimer } from "animejs";
import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils/cn";

const LEVELS = "▁▂▃▄▅▆▇█";
const BARS = 16;
const IDLE = "▁".repeat(BARS);

/** ASCII VU meter driven by an anime.js timer at 14fps while listening. */
export function Waveform({ active, className }: { active: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!active || reduced) {
      el.textContent = active ? "▃▅▇▅▃▅▇▅▃▅▇▅▃▅▇▅" : IDLE;
      return;
    }
    const timer = createTimer({
      frameRate: 14,
      loop: true,
      duration: 100_000,
      onUpdate: (self) => {
        const t = self.currentTime / 1000;
        let s = "";
        for (let i = 0; i < BARS; i++) {
          const env = (Math.sin(t * 9 + i * 0.7) + 1) / 2;
          const v = Math.floor((env * 0.6 + Math.random() * 0.4) * LEVELS.length);
          s += LEVELS[Math.min(LEVELS.length - 1, v)] ?? "▁";
        }
        el.textContent = s;
      },
    });
    return () => {
      timer.revert();
    };
  }, [active, reduced]);

  return (
    <span
      ref={ref}
      aria-hidden
      className={cn("leading-none tracking-tighter whitespace-pre", className)}
    >
      {IDLE}
    </span>
  );
}
