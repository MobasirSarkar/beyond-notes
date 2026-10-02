import type { Priority } from "@/types/domain";
import type { SliderStep } from "@/types/ui";

/** Monochrome priority encoding: rank drives the signal-bar mark, not color. */
export const PRIORITY_META: Record<Priority, { label: string; rank: number }> = {
  none: { label: "None", rank: 0 },
  low: { label: "Low", rank: 1 },
  medium: { label: "Medium", rank: 2 },
  high: { label: "High", rank: 3 },
  urgent: { label: "Urgent", rank: 4 },
};

/** Priority as set on a task, least to most pressing. */
export const PRIORITY_STEPS: readonly SliderStep<Priority>[] = [
  { value: "none", label: "None", hint: "Someday" },
  { value: "low", label: "Low", hint: "When there’s time" },
  { value: "medium", label: "Medium", hint: "This week" },
  { value: "high", label: "High", hint: "Next up" },
  { value: "urgent", label: "Urgent", hint: "Drop everything" },
];

/** Priority as a board filter: show tasks at or above the chosen level. */
export const PRIORITY_STEPS_AT_LEAST: readonly SliderStep<Priority>[] = [
  { value: "none", label: "All" },
  { value: "low", label: "Low and up" },
  { value: "medium", label: "Medium and up" },
  { value: "high", label: "High and up" },
  { value: "urgent", label: "Urgent only" },
];
