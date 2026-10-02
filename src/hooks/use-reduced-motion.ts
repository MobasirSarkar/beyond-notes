"use client";

import { useSyncExternalStore } from "react";

import { usePrefs } from "@/lib/stores/prefs";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

/**
 * Single source of truth for GSAP, anime.js and Motion: honours the OS
 * setting unless the user overrides it in settings.
 */
export function useReducedMotion(): boolean {
  const pref = usePrefs((p) => p.motion);
  const osReduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
  if (pref === "full") return false;
  if (pref === "reduced") return true;
  return osReduced;
}
