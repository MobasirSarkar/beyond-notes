"use client";

import { useEffect, useEffectEvent } from "react";

import { SHORTCUTS, type ShortcutId } from "@/lib/shortcuts";

const SEQUENCE_TIMEOUT = 1000;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/**
 * Global keyboard shortcuts with key sequences (e.g. `g b`). Single-key
 * shortcuts are ignored while typing; `mod+k` works everywhere.
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
    let buffer: string[] = [];
    let timer: number | undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.isComposing) return;
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        run("palette");
        return;
      }
      if (mod || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector("dialog[open], [role=dialog][aria-modal=true]")) return;

      buffer = [...buffer, e.key.toLowerCase()].slice(-2);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        buffer = [];
      }, SEQUENCE_TIMEOUT);

      const match =
        SHORTCUTS.find(
          (s) => s.keys.length === 2 && s.keys[0] === buffer[0] && s.keys[1] === buffer[1],
        ) ??
        (buffer[0] === "g" && buffer.length === 1
          ? undefined
          : SHORTCUTS.find((s) => s.keys.length === 1 && s.keys[0] === buffer.at(-1)));
      if (!match) return;
      if (run(match.id)) {
        e.preventDefault();
        buffer = [];
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
    };
  }, []);
}
