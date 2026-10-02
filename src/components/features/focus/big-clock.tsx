"use client";

import { animate } from "animejs";
import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils/cn";

// Applied last: tailwind-merge drops a `leading-*` that precedes a `text-*` size.
const LEADING = "leading-[1.1]";

/** Geist Pixel countdown; each changed digit rises out of a blur via anime.js. */
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
      translateY: [{ from: "0.28em", to: "0em" }],
      opacity: [{ from: 0, to: 1 }],
      filter: [{ from: "blur(0.12em)", to: "blur(0em)" }],
      duration: 420,
      ease: "outExpo",
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
      className={cn("flex items-center justify-center heading", className, LEADING)}
    >
      {[...value].map((ch, i) =>
        ch === ":" ? (
          <span
            key={i}
            aria-hidden
            className={cn("w-[0.36em] text-center text-muted", blink && "animate-blink")}
          >
            :
          </span>
        ) : (
          <span key={i} data-i={i} aria-hidden className="inline-block w-[0.62em] text-center">
            {ch}
          </span>
        ),
      )}
    </div>
  );
}
