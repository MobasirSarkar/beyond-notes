"use client";

import { createTimer } from "animejs";
import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

const LEVELS = "▁▂▃▄▅▆▇█";
const BARS = 12;

/** Animated ASCII VU-meter (anime.js timer @14fps) shown while listening. */
export function Waveform({ active, className }: { active: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!active || reduced) {
      el.textContent = active ? "▃▅▇▅▃▅▇▅▃▅▇▅" : "▁".repeat(BARS);
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
          const v = Math.min(
            LEVELS.length - 1,
            Math.floor((env * 0.6 + Math.random() * 0.4) * LEVELS.length),
          );
          s += LEVELS[v] ?? "▁";
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
      className={cn("term text-2xl leading-none tracking-tighter whitespace-pre", className)}
    >
      {"▁".repeat(BARS)}
    </span>
  );
}

export function MicButton({
  listening,
  supported,
  onClick,
  className,
}: {
  listening: boolean;
  supported: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!supported}
      aria-pressed={listening}
      aria-label={listening ? "Stop dictation" : "Start dictation"}
      title={
        supported ? "Dictate (Web Speech API)" : "Voice input is not supported in this browser"
      }
      className={cn("px-btn gap-2", listening && "border-danger! bg-danger! text-bg!", className)}
    >
      <span className={cn(listening && "animate-blink")}>◉</span>
      {listening ? "REC" : "MIC"}
    </button>
  );
}
