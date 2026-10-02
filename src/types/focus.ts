import type { FocusKind } from "./domain";

/** Persisted focus-timer state (survives reloads and navigation). */
export type TimerState = {
  kind: FocusKind;
  taskId: string | null;
  /** Epoch ms when the running segment ends (null while paused/idle). */
  endsAt: number | null;
  /** Remaining ms while paused/idle. */
  remainingMs: number;
  /** Active ms accumulated in this segment (excludes pauses). */
  elapsedMs: number;
  /** Epoch ms when the current run leg started. */
  legStartedAt: number | null;
  completedFocus: number;
};

/** Emitted when a segment ends (or is reset with enough focus to log). */
export type SegmentEndEvent = {
  kind: FocusKind;
  taskId: string | null;
  activeMs: number;
  /** True when the user reset early; false when the timer ran out. */
  partial: boolean;
  next: FocusKind;
};
