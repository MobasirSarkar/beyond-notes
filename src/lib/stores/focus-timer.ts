"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";

import { FOCUS_KINDS } from "@/lib/schemas/input";
import type { FocusKind } from "@/types/domain";
import type { SegmentEndEvent, TimerState } from "@/types/focus";

import { createStore } from "./create-store";
import { getPrefs } from "./prefs";

/**
 * Focus timer as an app-wide store: it keeps running across navigation, is
 * persisted to localStorage (survives reloads/closed tabs) and emits events
 * when a segment ends so a controller can log, notify and play sounds.
 */

const KEY = "bn:focus-timer";
const MIN_LOG_MS = 60_000;
const LONG_BREAK_EVERY = 4;

const timerSchema = z.object({
  kind: z.enum(FOCUS_KINDS),
  taskId: z.uuid().nullable(),
  endsAt: z.number().nullable(),
  remainingMs: z.number().nonnegative(),
  elapsedMs: z.number().nonnegative(),
  legStartedAt: z.number().nullable(),
  completedFocus: z.number().int().nonnegative(),
});

export function durationFor(kind: FocusKind): number {
  const p = getPrefs();
  const minutes =
    kind === "focus"
      ? p.focusMinutes
      : kind === "short_break"
        ? p.shortBreakMinutes
        : p.longBreakMinutes;
  return minutes * 60_000;
}

const idle = (kind: FocusKind, completedFocus = 0, taskId: string | null = null): TimerState => ({
  kind,
  taskId,
  endsAt: null,
  remainingMs: durationFor(kind),
  elapsedMs: 0,
  legStartedAt: null,
  completedFocus,
});

const store = createStore<TimerState>(
  {
    kind: "focus",
    taskId: null,
    endsAt: null,
    remainingMs: 25 * 60_000,
    elapsedMs: 0,
    legStartedAt: null,
    completedFocus: 0,
  },
  (state) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
    schedule(state);
  },
);

/* ------------------------------ Events ----------------------------------- */

const endListeners = new Set<(event: SegmentEndEvent) => void>();
export function onSegmentEnd(listener: (event: SegmentEndEvent) => void): () => void {
  endListeners.add(listener);
  return () => {
    endListeners.delete(listener);
  };
}
const emit = (event: SegmentEndEvent) => {
  for (const l of endListeners) l(event);
};

const activeMs = (s: TimerState, now = Date.now()) =>
  s.elapsedMs + (s.legStartedAt === null ? 0 : now - s.legStartedAt);

const nextKind = (s: TimerState, completed: number): FocusKind =>
  s.kind === "focus"
    ? completed % LONG_BREAK_EVERY === 0
      ? "long_break"
      : "short_break"
    : "focus";

/* ----------------------------- Scheduling --------------------------------- */

let timeout: number | undefined;
function schedule(state: TimerState): void {
  if (typeof window === "undefined") return;
  window.clearTimeout(timeout);
  if (state.endsAt === null) return;
  timeout = window.setTimeout(complete, Math.max(0, state.endsAt - Date.now()));
}

function complete(): void {
  const s = store.get();
  if (s.endsAt === null) return;
  const completed = s.kind === "focus" ? s.completedFocus + 1 : s.completedFocus;
  const next = nextKind(s, completed);
  emit({
    kind: s.kind,
    taskId: s.taskId,
    activeMs: Math.min(activeMs(s), durationFor(s.kind)),
    partial: false,
    next,
  });
  store.set(idle(next, completed, s.taskId));
}

/* ------------------------------- Actions ---------------------------------- */

export const focusTimer = {
  start: (): void => {
    const now = Date.now();
    store.set((s) => ({ endsAt: now + s.remainingMs, legStartedAt: now }));
  },
  pause: (): void => {
    const now = Date.now();
    store.set((s) => ({
      endsAt: null,
      remainingMs: Math.max(0, (s.endsAt ?? now) - now),
      elapsedMs: activeMs(s, now),
      legStartedAt: null,
    }));
  },
  /** Resets the segment; partial focus of at least a minute is still logged. */
  reset: (): void => {
    const s = store.get();
    const ms = activeMs(s);
    if (s.kind === "focus" && ms >= MIN_LOG_MS) {
      emit({ kind: s.kind, taskId: s.taskId, activeMs: ms, partial: true, next: s.kind });
    }
    store.set(idle(s.kind, s.completedFocus, s.taskId));
  },
  skip: (): void => {
    const s = store.get();
    store.set(idle(nextKind(s, s.completedFocus + 1), s.completedFocus, s.taskId));
  },
  switchTo: (kind: FocusKind): void => {
    const s = store.get();
    if (s.endsAt !== null) return;
    store.set(idle(kind, s.completedFocus, s.taskId));
  },
  setTask: (taskId: string | null): void => {
    store.set({ taskId });
  },
  /** Re-reads the configured length when prefs change while idle. */
  syncLength: (): void => {
    const s = store.get();
    if (s.endsAt === null && s.elapsedMs === 0) store.set({ remainingMs: durationFor(s.kind) });
  },
};

let hydrated = false;
/** Restores persisted state once; completes immediately if it ran out while closed. */
export function hydrateFocusTimer(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    const data: unknown = raw ? JSON.parse(raw) : null;
    const parsed = timerSchema.safeParse(data);
    store.set(parsed.success ? parsed.data : idle("focus"));
  } catch {
    store.set(idle("focus"));
  }
}

export const useFocusTimer = store.useStore;

/* ------------------------------- Ticking ---------------------------------- */

const subscribeSecond = (cb: () => void) => {
  const id = window.setInterval(cb, 1000);
  return () => window.clearInterval(id);
};
const noopSubscribe = () => () => {};

/** Remaining ms, re-rendering once per second only while the timer runs. */
export function useRemainingMs(): number {
  const endsAt = store.useStore((s) => s.endsAt);
  const remaining = store.useStore((s) => s.remainingMs);
  const now = useSyncExternalStore(
    endsAt === null ? noopSubscribe : subscribeSecond,
    () => (endsAt === null ? 0 : Math.floor(Date.now() / 1000) * 1000),
    () => 0,
  );
  return endsAt === null ? remaining : Math.max(0, endsAt - now);
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const mm = Math.min(99, Math.floor(total / 60));
  const ss = total % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export const FOCUS_LABEL: Record<FocusKind, string> = {
  focus: "focus",
  short_break: "short break",
  long_break: "long break",
};

export const LONG_BREAK_INTERVAL = LONG_BREAK_EVERY;
