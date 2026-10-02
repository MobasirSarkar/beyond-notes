"use client";

import { useEffect, useEffectEvent } from "react";

import { SHORTCUTS } from "@/lib/constants/shortcuts";
import type { ShortcutId } from "@/types/shortcuts";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

const BY_KEY = new Map<string, ShortcutId>(
  SHORTCUTS.filter((s) => s.keys[0] !== "mod+k").map((s) => [s.keys[0], s.id]),
);

/**
 * Global single-key shortcuts. Ignored while typing or when a dialog is open;
 * `mod+k` works everywhere.
 */
export function useHotkeys(handlers: Partial<Record<ShortcutId, () => void>>): void {
  // Always sees the latest handlers without re-binding the listener.
  const run = useEffectEvent((id: ShortcutId): boolean => {
    const handler = handlers[id];
    if (!handler) return false;
    handler();
    return true;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.isComposing) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        run("palette");
        return;
      }
      if (mod || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector("dialog[open]")) return;
      const id = BY_KEY.get(e.key.toLowerCase());
      if (id && run(id)) e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
