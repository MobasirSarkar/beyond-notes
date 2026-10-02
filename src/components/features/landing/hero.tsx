"use client";

import { createTimeline } from "animejs";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { buttonStyles } from "@/components/ui/button";
import { ScrambleText } from "@/components/ui/scramble-text";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

import { AsciiField } from "./ascii-field";
import { AsciiLogo } from "./ascii-logo";

const BOOT = [
  "mounting /notes",
  "loading kanban",
  "calibrating microphone",
  "warming offline cache",
] as const;

/**
 * Landing hero: anime.js "boots" a few log lines, the wordmark reveals row by
 * row, GSAP decodes the tagline and Motion brings in the calls to action.
 */
export function Hero({ signedIn }: { signedIn: boolean }) {
  const reduced = useReducedMotion();
  const bootRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = bootRef.current;
    if (!el || reduced) return;
    const tl = createTimeline().add(el.children, {
      opacity: [0, 1],
      translateX: ["-0.5rem", "0rem"],
      duration: 240,
      delay: (_el: unknown, i = 0) => 900 + i * 110,
      ease: "outQuad",
    });
    return () => {
      tl.revert();
    };
  }, [reduced]);

  return (
    <section className="relative isolate overflow-hidden">
      <AsciiField className="absolute inset-0 -z-10 size-full opacity-60" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,var(--bg)_25%,transparent_75%)]" />

      <div className="page flex min-h-[calc(100dvh-var(--header-h))] flex-col justify-center gap-10 py-16">
        <AsciiLogo className="text-[clamp(0.3125rem,1.55vw,0.875rem)]" />

        <div className="flex max-w-2xl flex-col gap-5">
          <ScrambleText
            as="h1"
            text="tasks, notes and focus — in plain text."
            className="text-2xl leading-tight font-bold tracking-tight sm:text-display"
            duration={1}
          />
          <p className="max-w-xl text-md leading-relaxed text-muted">
            A keyboard-first workspace with kanban boards, Markdown notes, voice capture and a focus
            timer. Works offline, installs like an app.
          </p>
        </div>

        <motion.div
          className="flex flex-wrap items-center gap-3"
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: reduced ? 0 : 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {signedIn ? (
            <Link href="/boards" className={buttonStyles({ variant: "solid", size: "lg" })}>
              open workspace →
            </Link>
          ) : (
            <>
              <Link href="/sign-up" className={buttonStyles({ variant: "solid", size: "lg" })}>
                start for free →
              </Link>
              <Link href="/sign-in" className={buttonStyles({ variant: "ghost", size: "lg" })}>
                sign in
              </Link>
            </>
          )}
        </motion.div>

        <ul ref={bootRef} aria-hidden className="flex flex-col gap-1 text-xs text-subtle">
          {BOOT.map((line) => (
            <li key={line} className="reveal flex max-w-xs justify-between gap-6">
              <span>{line}</span>
              <span>ok</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
