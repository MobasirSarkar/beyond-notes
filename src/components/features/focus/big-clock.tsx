"use client";

import { animate } from "animejs";
import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils/cn";

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

// Pre-rendered glyphs: each pixel doubled horizontally so cells look square.
const GLYPHS = new Map(
  Object.entries(FONT).map(([ch, rows]) => [
    ch,
    rows.map((row) => [...row].map((c) => (c === "█" ? "██" : "  ")).join("")).join("\n"),
  ]),
);

/** Block-pixel clock; changed digits drop in via anime.js like a split-flap display. */
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
    const changed = [...value].flatMap((ch, i) =>
      ch === before[i] ? [] : [...el.querySelectorAll<HTMLElement>(`[data-i="${i}"]`)],
    );
    if (changed.length === 0) return;
    const anim = animate(changed, {
      translateY: [{ from: "-0.5em", to: "0em" }],
      opacity: [{ from: 0, to: 1 }],
      duration: 240,
      ease: "outQuad",
    });
    return () => {
      anim.revert();
    };
  }, [value, reduced]);

  return (
    <div
      ref={ref}
      role="timer"
      aria-label={value}
      className={cn("flex items-center justify-center gap-[1ch] overflow-hidden", className)}
    >
      {[...value].map((ch, i) => (
        <pre
          key={i}
          data-i={i}
          aria-hidden
          className={cn("leading-none", ch === ":" && blink && "animate-blink")}
        >
          {GLYPHS.get(ch) ?? ""}
        </pre>
      ))}
    </div>
  );
}
