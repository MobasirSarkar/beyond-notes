"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { anchorTo, POPOVER_MOTION, type AnchoredPlacement } from "@/lib/browser/anchor";
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

const ITEM_H = 36; // px, matches h-9 below (layout math only)
const MENU_W = 208; // px, matches min-w-52

/**
 * Menu button whose menu renders in the browser's top layer (Popover API):
 * never clipped by `overflow: hidden` panels, flips above the trigger when
 * there's no room below and scrolls when tall. Light-dismiss and Esc are
 * native; arrows / Home / End move focus between items.
 */
export function Menu({ label, ariaLabel, items, align = "right", className }: Props) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<AnchoredPlacement | null>(null);
  const visible = items.filter((i): i is MenuItemDef => Boolean(i));

  const itemNodes = () => [
    ...(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not(:disabled)") ??
      []),
  ];

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const nodes = itemNodes();
    if (nodes.length === 0) return;
    const index = nodes.findIndex((n) => n === document.activeElement);
    const target: Record<string, number> = {
      ArrowDown: (index + 1) % nodes.length,
      ArrowUp: (index - 1 + nodes.length) % nodes.length,
      Home: 0,
      End: nodes.length - 1,
    };
    const next = target[e.key];
    if (next === undefined) {
      if (e.key === "Tab") menuRef.current?.hidePopover();
      return;
    }
    e.preventDefault();
    nodes[next]?.focus();
  };

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={menuId}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={cn(
          "flex size-7 items-center justify-center rounded-full text-muted hover:bg-surface-2/60 hover:text-fg",
          open && "bg-surface-2/60 text-fg",
        )}
      >
        {label}
      </button>
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        tabIndex={-1}
        aria-label={ariaLabel}
        onBeforeToggle={(e) => {
          if (e.newState !== "open" || !triggerRef.current) return;
          setPlace(
            anchorTo(triggerRef.current, {
              wantedHeight: visible.length * ITEM_H + 10,
              width: MENU_W,
              align,
            }),
          );
        }}
        onToggle={(e) => {
          const isOpen = e.newState === "open";
          setOpen(isOpen);
          if (isOpen) itemNodes()[0]?.focus();
        }}
        onKeyDown={onMenuKey}
        style={place ?? undefined}
        className={cn(
          "m-0 min-w-52 flex-col overflow-y-auto overscroll-contain rounded-card glass-strong p-1 text-fg open:flex",
          POPOVER_MOTION,
        )}
      >
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              menuRef.current?.hidePopover();
              item.onSelect();
            }}
            className={cn(
              "flex h-9 shrink-0 items-center rounded-lg px-3 text-left text-sm hover:bg-surface-2 focus-visible:bg-fg focus-visible:text-bg focus-visible:outline-none disabled:opacity-40",
              item.danger && "text-muted hover:text-fg",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
