"use client";

import { animate, stagger } from "animejs";
import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils/cn";

const LOGO = [
  "██████╗ ███████╗██╗   ██╗ ██████╗ ███╗   ██╗██████╗ ",
  "██╔══██╗██╔════╝╚██╗ ██╔╝██╔═══██╗████╗  ██║██╔══██╗",
  "██████╔╝█████╗   ╚████╔╝ ██║   ██║██╔██╗ ██║██║  ██║",
  "██╔══██╗██╔══╝    ╚██╔╝  ██║   ██║██║╚██╗██║██║  ██║",
  "██████╔╝███████╗   ██║   ╚██████╔╝██║ ╚████║██████╔╝",
  "╚═════╝ ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ",
];

/**
 * FIGlet wordmark revealed row by row (anime.js stagger on 6 elements rather
 * than hundreds of glyph spans).
 */
export function AsciiLogo({ className }: { className?: string }) {
  const ref = useRef<HTMLPreElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const anim = animate(el.children, {
      opacity: [0, 1],
      clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"],
      delay: stagger(70, { start: 150 }),
      duration: 520,
      ease: "outQuad",
    });
    return () => {
      anim.revert();
    };
  }, [reduced]);

  return (
    <pre
      ref={ref}
      role="img"
      aria-label="Beyond"
      className={cn("leading-[1.05] select-none", className)}
    >
      {LOGO.map((row) => (
        <span key={row} className="reveal block">
          {row}
        </span>
      ))}
    </pre>
  );
}
