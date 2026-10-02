"use client";

import { createTimeline, steps } from "animejs";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ScrambleText } from "@/components/ascii/scramble-text";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

import { AsciiLogo } from "./ascii-logo";

const BOOT_LINES = [
  ["BEYOND-BIOS v16.3 (c) 1986-2026", ""],
  ["Detecting brain.............", "OK"],
  ["Mounting /dev/notes.........", "OK"],
  ["Loading kanban.sys..........", "OK"],
  ["Calibrating microphone......", "OK"],
  ["Spinning up focus engine....", "OK"],
  ["Establishing offline cache..", "OK"],
] as const;

/**
 * Landing hero: an anime.js timeline "boots" the terminal line by line, then
 * the logo assembles, GSAP decodes the tagline and Motion springs in the CTAs.
 */
export function BootSequence({ signedIn }: { signedIn: boolean }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [booted, setBooted] = useState(false);
  const ready = booted || reduced;

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const lines = el.querySelectorAll<HTMLElement>("[data-boot]");
    const oks = el.querySelectorAll<HTMLElement>("[data-ok]");
    const tl = createTimeline({ onComplete: () => setBooted(true) })
      .add(lines, {
        opacity: [0, 1],
        clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"],
        duration: 220,
        ease: steps(8),
        delay: (_el: unknown, i = 0) => i * 140,
      })
      .add(
        oks,
        {
          opacity: [0, 1],
          scale: [1.6, 1],
          duration: 160,
          ease: steps(2),
          delay: (_el: unknown, i = 0) => i * 140,
        },
        "-=900",
      );
    return () => {
      tl.revert();
    };
  }, [reduced]);

  return (
    <div
      ref={ref}
      className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4"
    >
      <div className="term w-full max-w-xl text-lg leading-tight text-fg-dim" aria-hidden>
        {BOOT_LINES.map(([text, ok], i) => (
          <div key={i} data-boot="" className="reveal flex justify-between gap-4">
            <span>{text}</span>
            {ok ? (
              <span data-ok="" className="text-ok">
                [ {ok} ]
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {ready ? (
        <>
          <AsciiLogo className="text-[6px] sm:text-[9px] md:text-[12px]" />
          <ScrambleText
            as="p"
            text="A pixel-perfect brain for your tasks, notes & focus."
            className="term max-w-2xl text-center text-2xl text-fg-dim sm:text-3xl"
            duration={1.4}
            chars="upper"
          />
          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={reduced ? false : { opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.6 }}
          >
            {signedIn ? (
              <Link href="/boards" className="px-btn text-2xl" data-variant="primary">
                [ OPEN TERMINAL ]
              </Link>
            ) : (
              <>
                <Link href="/sign-up" className="px-btn text-2xl" data-variant="primary">
                  [ PRESS START ]
                </Link>
                <Link href="/sign-in" className="px-btn text-2xl">
                  [ CONTINUE ]
                </Link>
              </>
            )}
          </motion.div>
          <p className="term caret text-lg text-muted">
            no credit card. no tracking. just you and the cursor
          </p>
        </>
      ) : (
        <div className="h-72" aria-hidden />
      )}
    </div>
  );
}
