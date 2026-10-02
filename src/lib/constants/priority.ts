import type { Priority } from "@/types/domain";

/** Monochrome priority encoding: glyph density instead of color. */
export const PRIORITY_META: Record<Priority, { glyph: string; label: string; rank: number }> = {
  none: { glyph: "·", label: "none", rank: 0 },
  low: { glyph: "!", label: "low", rank: 1 },
  medium: { glyph: "!!", label: "medium", rank: 2 },
  high: { glyph: "!!!", label: "high", rank: 3 },
  urgent: { glyph: "!!!!", label: "urgent", rank: 4 },
};
