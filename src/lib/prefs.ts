"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";

/**
 * Per-device UI preferences (theme, CRT effect, motion, sound, timer lengths),
 * kept in localStorage. Reads are validated so a tampered/corrupt value can
 * never break the app; storage failures (private mode) fall back to defaults.
 */
export const prefsSchema = z.object({
  theme: z.enum(["system", "phosphor", "amber", "paper"]).catch("system"),
  crt: z.boolean().catch(true),
  motion: z.enum(["system", "full", "reduced"]).catch("system"),
  sound: z.boolean().catch(true),
  focusMinutes: z.number().int().min(1).max(120).catch(25),
  shortBreakMinutes: z.number().int().min(1).max(60).catch(5),
  longBreakMinutes: z.number().int().min(1).max(60).catch(15),
});
export type Prefs = z.infer<typeof prefsSchema>;

const KEY = "bn:prefs";
export const DEFAULT_PREFS: Prefs = prefsSchema.parse({});

let cache: Prefs | null = null;
const listeners = new Set<() => void>();

function read(): Prefs {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = prefsSchema.parse(raw ? (JSON.parse(raw) as unknown) : {});
  } catch {
    cache = DEFAULT_PREFS;
  }
  return cache;
}

export function applyPrefsToDocument(p: Prefs): void {
  const root = document.documentElement;
  if (p.theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", p.theme);
  if (p.motion === "system") root.removeAttribute("data-motion");
  else root.setAttribute("data-motion", p.motion);
}

export function setPrefs(patch: Partial<Prefs>): void {
  const next = prefsSchema.parse({ ...read(), ...patch });
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: keep in memory */
  }
  applyPrefsToDocument(next);
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      applyPrefsToDocument(read());
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_PREFS);
}

/** Inline, render-blocking script that applies the theme before first paint. */
export const PREFS_BOOTSTRAP = `try{var p=JSON.parse(localStorage.getItem("${KEY}")||"{}");var r=document.documentElement;if(["phosphor","amber","paper"].indexOf(p.theme)>-1)r.setAttribute("data-theme",p.theme);if(["full","reduced"].indexOf(p.motion)>-1)r.setAttribute("data-motion",p.motion)}catch(e){}`;
