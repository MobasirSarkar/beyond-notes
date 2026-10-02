import type { Priority } from "@/types/domain";
import type { SliderStep } from "@/types/ui";

/** Monochrome priority encoding: rank drives the signal-bar mark, not color. */
export const PRIORITY_META: Record<Priority, { label: string; rank: number }> = {
  none: { label: "none", rank: 0 },
  low: { label: "low", rank: 1 },
  medium: { label: "medium", rank: 2 },
  high: { label: "high", rank: 3 },
  urgent: { label: "urgent", rank: 4 },
};

/** Priority as set on a task, least to most pressing. */
export const PRIORITY_STEPS: readonly SliderStep<Priority>[] = [
  { value: "none", label: "none", hint: "someday" },
  { value: "low", label: "low", hint: "when there's time" },
  { value: "medium", label: "medium", hint: "this week" },
  { value: "high", label: "high", hint: "next up" },
  { value: "urgent", label: "urgent", hint: "drop everything" },
];

/** Priority as a board filter: show tasks at or above the chosen level. */
export const PRIORITY_STEPS_AT_LEAST: readonly SliderStep<Priority>[] = [
  { value: "none", label: "all" },
  { value: "low", label: "low +" },
  { value: "medium", label: "medium +" },
  { value: "high", label: "high +" },
  { value: "urgent", label: "urgent only" },
];
