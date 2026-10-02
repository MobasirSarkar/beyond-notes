"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { RevealText } from "@/components/ui/reveal-text";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Landing hero over the live galaxy: a giant Geist Pixel wordmark resolves
 * out of a blur (GSAP SplitText), then copy and calls to action rise in (Motion).
 */
export function Hero({ signedIn }: { signedIn: boolean }) {
  const reduced = useReducedMotion();
  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section className="relative page flex min-h-[calc(100dvh-var(--header-h))] flex-col justify-center gap-8 py-20">
      <motion.p className="type-overline" {...rise(0.2)}>
        A workspace for tasks, notes and deep focus
      </motion.p>

      <h1 className="-ml-[0.04em] pb-[0.12em] type-hero">
        <RevealText text="beyond" delay={0.35} stagger={0.07} />
      </h1>

      <motion.p className="max-w-md text-lg text-muted" {...rise(0.9)}>
        Plan on boards, think in notes, and disappear into focus — in a calm, keyboard-first space
        that works offline.
      </motion.p>

      <motion.div className="flex flex-wrap items-center gap-3" {...rise(1.1)}>
        {signedIn ? (
          <Link href="/boards" className={buttonStyles({ variant: "solid", size: "lg" })}>
            Open workspace <ArrowRight aria-hidden className="size-4" />
          </Link>
        ) : (
          <>
            <Link href="/sign-up" className={buttonStyles({ variant: "solid", size: "lg" })}>
              Start for free <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link href="/sign-in" className={buttonStyles({ variant: "ghost", size: "lg" })}>
              Sign in
            </Link>
          </>
        )}
      </motion.div>

      <motion.div
        aria-hidden
        className="absolute inset-x-(--gutter) bottom-8 flex items-end justify-between type-overline text-subtle"
        {...rise(1.6)}
      >
        <span className="flex items-center gap-3">
          <span className="w-10 rule-t" />
          Scroll
        </span>
        <span className="hidden text-right sm:block">
          Grand-design spiral · ~40,000 particles
          <br />
          Rendered live in your browser
        </span>
      </motion.div>
    </section>
  );
}
