"use client";

import { prefsSchema } from "@/lib/schemas/prefs";
import type { Prefs } from "@/types/prefs";

import { createStore } from "./create-store";

const KEY = "bn:prefs";
export const DEFAULT_PREFS: Prefs = prefsSchema.parse({});

function load(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(KEY);
    const data: unknown = raw ? JSON.parse(raw) : {};
    return prefsSchema.parse(data);
  } catch {
    return DEFAULT_PREFS;
  }
}

export function applyPrefsToDocument(p: Prefs): void {
  const root = document.documentElement;
  if (p.theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", p.theme);
  if (p.motion === "system") root.removeAttribute("data-motion");
  else root.setAttribute("data-motion", p.motion);
}

const store = createStore<Prefs>(DEFAULT_PREFS, (next) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode): keep in memory */
  }
  applyPrefsToDocument(next);
});

function onStorage(e: StorageEvent): void {
  if (e.key !== KEY) return;
  const next = load();
  store.replace(next);
  applyPrefsToDocument(next);
}

let hydrated = false;
/** Loads persisted prefs once on the client and keeps tabs in sync. */
export function hydratePrefs(): () => void {
  if (!hydrated) {
    store.replace(load());
    hydrated = true;
  }
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export const usePrefs = store.useStore;
export const getPrefs = store.get;
export const setPrefs = (patch: Partial<Prefs>): void =>
  store.set((s) => prefsSchema.parse({ ...s, ...patch }));

/** Inline, render-blocking script that applies theme/motion before first paint. */
export const PREFS_BOOTSTRAP = `try{var p=JSON.parse(localStorage.getItem("${KEY}")||"{}"),r=document.documentElement;if(p.theme==="light"||p.theme==="dark")r.setAttribute("data-theme",p.theme);if(p.motion==="full"||p.motion==="reduced")r.setAttribute("data-motion",p.motion)}catch(e){}`;
