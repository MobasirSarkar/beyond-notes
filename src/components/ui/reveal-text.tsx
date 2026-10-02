"use client";

import { useRef, type ElementType } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { gsap, SplitText, useGSAP } from "@/lib/animation/gsap";

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  /** Seconds before the reveal starts. */
  delay?: number;
  /** Seconds between characters. */
  stagger?: number;
};

/**
 * Splits text into characters (GSAP SplitText) and lets them drift up out of
 * a soft blur, like starlight coming into focus. Static under reduced motion.
 */
export function RevealText({
  text,
  as: Tag = "span",
  className,
  delay = 0,
  stagger = 0.025,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      const split = SplitText.create(ref.current, { type: "chars", charsClass: "inline-block" });
      gsap.from(split.chars, {
        opacity: 0,
        yPercent: 35,
        filter: "blur(0.35em)",
        duration: 0.9,
        delay,
        stagger,
        ease: "expo.out",
        onComplete: () => split.revert(),
      });
    },
    { dependencies: [text, reduced], scope: ref, revertOnUpdate: true },
  );

  return (
    // `key` remounts on text change because SplitText rewrites the DOM.
    <Tag key={text} ref={ref} className={className} aria-label={text}>
      {text}
    </Tag>
  );
}
