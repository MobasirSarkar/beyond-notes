"use client";

import { useRef, type ElementType } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { GLYPHS, gsap, useGSAP } from "@/lib/gsap";

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  /** Scramble on mount, on hover, or both. */
  trigger?: "mount" | "hover" | "both";
  duration?: number;
  delay?: number;
  chars?: keyof typeof GLYPHS;
};

/** Text that "decodes" itself via GSAP ScrambleText. Static when motion is reduced. */
export function ScrambleText({
  text,
  as: Tag = "span",
  className,
  trigger = "mount",
  duration = 0.8,
  delay = 0,
  chars = "blocks",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { contextSafe } = useGSAP(
    () => {
      if (reduced || !ref.current || trigger === "hover") return;
      ref.current.textContent = "";
      gsap.to(ref.current, {
        duration,
        delay,
        scrambleText: { text, chars: GLYPHS[chars], speed: 0.6, revealDelay: 0.1 },
      });
    },
    { dependencies: [text, reduced], scope: ref, revertOnUpdate: true },
  );

  const onEnter = () => {
    if (reduced || trigger === "mount") return;
    // contextSafe at event time so the tween is reverted with the component.
    contextSafe(() => {
      if (!ref.current) return;
      gsap.to(ref.current, {
        duration: 0.45,
        overwrite: true,
        scrambleText: { text, chars: GLYPHS[chars], speed: 1 },
      });
    })();
  };

  return (
    // `key` remounts on text change because GSAP owns the text node while animating.
    <Tag key={text} ref={ref} className={className} onMouseEnter={onEnter} aria-label={text}>
      {text}
    </Tag>
  );
}
