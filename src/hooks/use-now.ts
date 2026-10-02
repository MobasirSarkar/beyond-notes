"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 30_000;
const listeners = new Set<() => void>();
let now = 0;
let timer: number | undefined;

function tick() {
  now = Date.now();
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (listeners.size === 1) {
    // Refresh a value that went stale while nothing was subscribed;
    // React re-reads the snapshot right after subscribing.
    now = Date.now();
    timer = window.setInterval(tick, TICK_MS);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.clearInterval(timer);
  };
}

const read = () => (now ||= Date.now());

/**
 * Shared wall-clock (ms) for relative times, refreshed every 30s. `null` on the
 * server and during hydration, so time-derived text never causes a mismatch.
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
