"use client";

import { useSyncExternalStore } from "react";

import { usePrefs } from "@/lib/prefs";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

/**
 * Single source of truth for all three animation libraries (GSAP, anime.js,
 * Motion): honours the OS setting unless the user overrides it in settings.
 */
export function useReducedMotion(): boolean {
  const prefs = usePrefs();
  const osReduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
  if (prefs.motion === "full") return false;
  if (prefs.motion === "reduced") return true;
  return osReduced;
}
