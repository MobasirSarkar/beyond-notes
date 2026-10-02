"use client";

import { useSyncExternalStore } from "react";

function subscribeMinute(cb: () => void) {
  const id = window.setInterval(cb, 15_000);
  return () => window.clearInterval(id);
}

const read = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** `HH:MM`, refreshed a few times a minute; `--:--` during SSR. */
export function useClock(): string {
  return useSyncExternalStore(subscribeMinute, read, () => "--:--");
}
