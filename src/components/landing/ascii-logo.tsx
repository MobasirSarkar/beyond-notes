"use client";

import { animate, stagger, steps } from "animejs";
import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

const LOGO = [
  "██████╗ ███████╗██╗   ██╗ ██████╗ ███╗   ██╗██████╗ ",
  "██╔══██╗██╔════╝╚██╗ ██╔╝██╔═══██╗████╗  ██║██╔══██╗",
  "██████╔╝█████╗   ╚████╔╝ ██║   ██║██╔██╗ ██║██║  ██║",
  "██╔══██╗██╔══╝    ╚██╔╝  ██║   ██║██║╚██╗██║██║  ██║",
  "██████╔╝███████╗   ██║   ╚██████╔╝██║ ╚████║██████╔╝",
  "╚═════╝ ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ",
  "                                                    ",
  "    ███╗   ██╗ ██████╗ ████████╗███████╗███████╗    ",
  "    ████╗  ██║██╔═══██╗╚══██╔══╝██╔════╝██╔════╝    ",
  "    ██╔██╗ ██║██║   ██║   ██║   █████╗  ███████╗    ",
  "    ██║╚██╗██║██║   ██║   ██║   ██╔══╝  ╚════██║    ",
  "    ██║ ╚████║╚██████╔╝   ██║   ███████╗███████║    ",
  "    ╚═╝  ╚═══╝ ╚═════╝    ╚═╝   ╚══════╝╚══════╝    ",
];
const COLS = Math.max(...LOGO.map((l) => [...l].length));
const GRID = LOGO.map((l) => [...l.padEnd(COLS, " ")]);

/** FIGlet-style logo whose glyphs materialise from the centre (anime.js grid stagger). */
export function AsciiLogo({ className, delay = 0 }: { className?: string; delay?: number }) {
  const ref = useRef<HTMLPreElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const cells = el.querySelectorAll<HTMLElement>("[data-c]");
    const anim = animate(cells, {
      opacity: [0, 1],
      translateY: [{ from: -6, to: 0 }],
      color: [{ from: "var(--accent)", to: "var(--fg)" }],
      delay: stagger(4, { grid: [COLS, GRID.length], from: "center", start: delay }),
      duration: 420,
      ease: steps(4),
    });
    return () => {
      anim.revert();
    };
  }, [reduced, delay]);

  return (
    <pre
      ref={ref}
      role="img"
      aria-label="Beyond Notes"
      className={cn("glow font-mono leading-[1.05] text-fg select-none", className)}
    >
      {GRID.map((row, y) => (
        <span key={y} className="block">
          {row.map((ch, x) => (
            <span key={x} data-c="" className="inline-block">
              {ch === " " ? " " : ch}
            </span>
          ))}
        </span>
      ))}
    </pre>
  );
}
