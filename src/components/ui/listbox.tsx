"use client";

import { Check, ChevronDown } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";

import { anchorTo, POPOVER_MOTION, type AnchoredPlacement } from "@/lib/browser/anchor";
import { cn } from "@/lib/utils/cn";
import type { ListboxOption } from "@/types/ui";

import { Icon } from "./icon";

type Props<T extends string> = {
  value: T;
  options: readonly ListboxOption<T>[];
  onChange: (value: T) => void;
  /** Accessible name when no `<label htmlFor={id}>` points at the trigger. */
  label?: string;
  id?: string;
  size?: "sm" | "md";
  className?: string;
};

const OPTION_H = 36; // px, matches h-9 below (layout math only)

/**
 * Styled replacement for a native <select>. The menu lives in the browser's
 * top layer (Popover API), so frames with `overflow: hidden` and open modals
 * never clip it; light-dismiss and Esc come for free. Keyboard: arrows, Home,
 * End, type-ahead, Enter/Space to pick, Esc/Tab to close.
 */
export function Listbox<T extends string>({
  value,
  options,
  onChange,
  label,
  id,
  size = "md",
  className,
}: Props<T>) {
  const autoId = useId();
  const triggerId = id ?? `${autoId}-trigger`;
  const listId = `${autoId}-list`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ text: "", at: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState<AnchoredPlacement | null>(null);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  const measure = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setPlace(
      anchorTo(trigger, {
        wantedHeight: Math.min(288, options.length * OPTION_H + 10),
        width: trigger.getBoundingClientRect().width,
      }),
    );
  };

  const close = (refocus: boolean) => {
    listRef.current?.hidePopover();
    if (refocus) triggerRef.current?.focus();
  };

  const pick = (index: number) => {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    close(true);
  };

  const move = (index: number) => {
    const next = Math.min(options.length - 1, Math.max(0, index));
    setActive(next);
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${next}"]`)
      ?.scrollIntoView({ block: "nearest" });
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      listRef.current?.showPopover();
    }
  };

  const onListKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(active + 1),
      ArrowUp: () => move(active - 1),
      Home: () => move(0),
      End: () => move(options.length - 1),
      Enter: () => pick(active),
      " ": () => pick(active),
      Tab: () => close(true),
    };
    const action = keys[e.key];
    if (action) {
      e.preventDefault();
      action();
      return;
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const t = typeahead.current;
      t.text = e.timeStamp - t.at > 600 ? e.key : t.text + e.key;
      t.at = e.timeStamp;
      const needle = t.text.toLowerCase();
      const hit = options.findIndex((o) => o.label.toLowerCase().startsWith(needle));
      if (hit >= 0) move(hit);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        popoverTarget={listId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onKeyDown={onTriggerKey}
        className={cn(
          "flex w-full min-w-0 items-center gap-2 rounded-control lift px-3 text-left text-sm transition-[border-color,box-shadow] duration-(--dur-2) hover:rule-strong focus-visible:rule-strong focus-visible:shadow-glow focus-visible:outline-none",
          size === "sm" ? "h-8" : "h-9",
          open && "rule-strong",
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <Icon
          icon={ChevronDown}
          className={cn(
            "size-3.5 text-muted transition-transform duration-(--dur-2)",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        ref={listRef}
        id={listId}
        popover="auto"
        role="listbox"
        tabIndex={-1}
        aria-labelledby={triggerId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onBeforeToggle={(e) => {
          if (e.newState === "open") {
            measure();
            setActive(selectedIndex);
          }
        }}
        onToggle={(e) => {
          const isOpen = e.newState === "open";
          setOpen(isOpen);
          if (isOpen) {
            listRef.current?.focus();
            move(selectedIndex);
          }
        }}
        onKeyDown={onListKey}
        style={place ? { ...place, width: place.minWidth } : undefined}
        className={cn(
          "m-0 overflow-y-auto overscroll-contain rounded-card glass-strong p-1 text-sm text-fg outline-none",
          POPOVER_MOTION,
        )}
      >
        {options.map((o, i) => (
          // Options are picked with the pointer here and with the keyboard on the
          // listbox (aria-activedescendant), as the ARIA listbox pattern prescribes.
          // oxlint-disable-next-line jsx-a11y/click-events-have-key-events
          <div
            key={o.value}
            id={`${listId}-${i}`}
            data-index={i}
            role="option"
            tabIndex={-1}
            aria-selected={o.value === value}
            onPointerMove={() => active !== i && setActive(i)}
            onClick={() => pick(i)}
            className={cn(
              "flex h-9 cursor-pointer items-center gap-3 rounded-lg px-3",
              i === active && "bg-surface-2",
            )}
          >
            <span className="min-w-0 flex-1 truncate">{o.label}</span>
            {o.hint ? <span className="shrink-0 text-xs text-subtle">{o.hint}</span> : null}
            <Icon
              icon={Check}
              className={cn("size-3.5", o.value === value ? "opacity-100" : "opacity-0")}
            />
          </div>
        ))}
      </div>
    </>
  );
}
