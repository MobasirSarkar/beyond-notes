"use client";

import { animate, steps } from "animejs";
import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

const FONT: Record<string, readonly string[]> = {
  "0": ["███", "█ █", "█ █", "█ █", "███"],
  "1": [" █ ", "██ ", " █ ", " █ ", "███"],
  "2": ["███", "  █", "███", "█  ", "███"],
  "3": ["███", "  █", "███", "  █", "███"],
  "4": ["█ █", "█ █", "███", "  █", "  █"],
  "5": ["███", "█  ", "███", "  █", "███"],
  "6": ["███", "█  ", "███", "█ █", "███"],
  "7": ["███", "  █", "  █", "  █", "  █"],
  "8": ["███", "█ █", "███", "█ █", "███"],
  "9": ["███", "█ █", "███", "  █", "███"],
  ":": [" ", "█", " ", "█", " "],
};

/** Each pixel is doubled horizontally so glyph cells come out roughly square. */
const render = (ch: string) =>
  (FONT[ch] ?? FONT["0"] ?? [])
    .map((row) => [...row].map((c) => (c === "█" ? "██" : "  ")).join(""))
    .join("\n");

/**
 * Giant block-pixel clock. When a digit changes, anime.js drops the new glyph
 * in with a stepped ease, like a split-flap display.
 */
export function BigClock({
  value,
  className,
  blink,
}: {
  value: string;
  className?: string;
  blink?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef(value);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    const before = prev.current;
    prev.current = value;
    if (!el || reduced || before === value) return;
    const changed = [...value]
      .map((ch, i) => (ch !== before[i] ? el.querySelector<HTMLElement>(`[data-i="${i}"]`) : null))
      .filter((n): n is HTMLElement => n !== null);
    if (changed.length === 0) return;
    const anim = animate(changed, {
      translateY: [{ from: "-35%", to: "0%" }],
      opacity: [{ from: 0.2, to: 1 }],
      duration: 260,
      ease: steps(5),
    });
    return () => {
      anim.revert();
    };
  }, [value, reduced]);

  return (
    <div
      ref={ref}
      role="timer"
      aria-live="off"
      aria-label={value}
      className={cn("flex items-center justify-center gap-[1ch] overflow-hidden", className)}
    >
      {[...value].map((ch, i) => (
        <pre
          key={i}
          data-i={i}
          aria-hidden
          className={cn("glow leading-[1] text-fg", ch === ":" && blink && "animate-blink")}
        >
          {render(ch)}
        </pre>
      ))}
    </div>
  );
}
