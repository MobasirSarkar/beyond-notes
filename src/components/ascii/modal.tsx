"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  /** Visually hide the title bar (still announced to screen readers). */
  bare?: boolean;
  position?: "center" | "top" | "right";
};

/**
 * Accessible modal on top of the native <dialog> element (focus trap, Esc,
 * inert background for free) with a pixel "power-on" Motion transition.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  bare,
  position = "center",
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  const variants =
    position === "right"
      ? { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } }
      : {
          initial: { opacity: 0, scaleY: 0.02, scaleX: 0.6 },
          animate: { opacity: 1, scaleY: 1, scaleX: 1 },
          exit: { opacity: 0, scaleY: 0.02, scaleX: 0.8 },
        };

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
        "max-h-none max-w-none overflow-visible bg-transparent p-0 text-fg backdrop:bg-black/60 backdrop:backdrop-blur-[1px]",
        position === "center" && "m-auto w-[min(42rem,calc(100vw-2rem))]",
        position === "top" && "mx-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))]",
        position === "right" && "my-0 mr-0 ml-auto h-dvh w-[min(36rem,100vw)]",
      )}
    >
      <AnimatePresence onExitComplete={() => ref.current?.close()}>
        {open ? (
          <motion.div
            key="modal"
            {...variants}
            transition={
              position === "right"
                ? { type: "tween", ease: [0.7, 0, 0.3, 1], duration: 0.25 }
                : { duration: 0.18, ease: [0.2, 0.9, 0.1, 1] }
            }
            className={cn(
              "px-panel flex flex-col",
              position === "right" ? "h-full overflow-y-auto shadow-none" : "max-h-[85vh]",
              className,
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between gap-3 border-b-2 border-line bg-fg px-3 py-0.5 text-bg",
                bare && "sr-only",
              )}
            >
              <h2 id={titleId} className="term truncate text-xl uppercase">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="term text-xl hover:text-accent"
                aria-label="Close"
              >
                [x]
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  );
}
