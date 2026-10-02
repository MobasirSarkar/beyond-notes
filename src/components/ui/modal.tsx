"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

import { Kbd } from "./kbd";

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Visually hide the title row (still announced to screen readers). */
  bare?: boolean;
  placement?: "center" | "top" | "sheet";
  className?: string;
};

const PLACEMENT = {
  center: "m-auto w-[min(40rem,calc(100vw-2rem))]",
  top: "mx-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))]",
  sheet: "my-0 mr-0 ml-auto h-dvh w-[min(36rem,100vw)]",
} as const;

const MOTION = {
  center: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
  },
  top: {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  sheet: { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } },
} as const;

/**
 * Mark the element that should receive focus on open with `data-autofocus`.
 *
 * Accessible modal on the native <dialog> (focus trap, Esc, inert page) with
 * Motion enter/exit. `sheet` slides in from the right for detail views.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  bare,
  placement = "center",
  className,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog || dialog.open) return;
    dialog.showModal();
    // Prefer an explicit target over the browser's "first focusable" default.
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, [open]);

  return (
    // Backdrop click closes; keyboard users close with Esc (native `cancel` event).
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "max-h-none max-w-none overflow-visible bg-transparent p-0 text-fg backdrop:bg-overlay",
        PLACEMENT[placement],
      )}
    >
      <AnimatePresence onExitComplete={() => ref.current?.close()}>
        {open ? (
          <motion.div
            key="panel"
            {...MOTION[placement]}
            transition={{ duration: placement === "sheet" ? 0.26 : 0.16, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn(
              "flex flex-col rule-strong bg-bg hairline",
              placement === "sheet" ? "h-full" : "max-h-[80vh]",
              className,
            )}
          >
            <div
              className={cn("flex h-11 shrink-0 items-center gap-3 px-4 rule-b", bare && "sr-only")}
            >
              <h2 id={titleId} className="truncate label text-fg">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="ml-auto flex items-center gap-2 text-xs text-muted hover:text-fg"
                aria-label="Close"
              >
                <Kbd>esc</Kbd>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
}
