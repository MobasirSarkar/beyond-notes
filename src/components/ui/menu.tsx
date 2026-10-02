"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import type { MenuItemDef } from "@/types/ui";

type Props = {
  label: ReactNode;
  /** Accessible name for the trigger when `label` is an icon. */
  ariaLabel: string;
  items: readonly (MenuItemDef | false | null | undefined)[];
  align?: "left" | "right";
  className?: string;
};

/** Menu button with outside-click / Escape to close and roving arrow-key focus. */
export function Menu({ label, ariaLabel, items, align = "right", className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const visible = items.filter((i): i is MenuItemDef => Boolean(i));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (e.target instanceof Node && !ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const nodes = [
        ...(ref.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not(:disabled)") ??
          []),
      ];
      const index = nodes.findIndex((n) => n === document.activeElement);
      const next =
        e.key === "ArrowDown"
          ? (index + 1) % nodes.length
          : (index - 1 + nodes.length) % nodes.length;
      nodes[next]?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="flex size-7 items-center justify-center rounded-full text-muted hover:bg-surface-2/60 hover:text-fg"
      >
        {label}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "absolute top-full z-(--z-overlay) mt-2 flex min-w-48 flex-col rounded-card glass-strong p-1",
              align === "right" ? "right-0" : "left-0",
            )}
          >
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "flex h-8 items-center rounded-lg px-3 text-left text-sm hover:bg-fg hover:text-bg focus-visible:bg-fg focus-visible:text-bg focus-visible:outline-none disabled:opacity-40",
                  item.danger && "text-muted",
                )}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
