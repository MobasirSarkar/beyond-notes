import type { Priority } from "@/types/domain";

/** Monochrome priority encoding: rank drives the signal-bar mark, not color. */
export const PRIORITY_META: Record<Priority, { label: string; rank: number }> = {
  none: { label: "none", rank: 0 },
  low: { label: "low", rank: 1 },
  medium: { label: "medium", rank: 2 },
  high: { label: "high", rank: 3 },
  urgent: { label: "urgent", rank: 4 },
};
