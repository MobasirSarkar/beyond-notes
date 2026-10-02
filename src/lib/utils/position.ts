import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

import type { Positioned } from "@/types/domain";

/**
 * Fractional-index ordering keys. Keys are base62 ASCII strings that sort by
 * code unit (JS default sort / Postgres `COLLATE "C"`), so inserting between
 * two items never requires renumbering siblings.
 */
export function keyBetween(a: string | null | undefined, b: string | null | undefined): string {
  const lo = a ?? null;
  const hi = b ?? null;
  // Guard against inverted/equal neighbours caused by concurrent edits.
  if (lo !== null && hi !== null && lo >= hi) return generateKeyBetween(lo, null);
  return generateKeyBetween(lo, hi);
}

export function keysAfter(last: string | null | undefined, n: number): string[] {
  return generateNKeysBetween(last ?? null, null, n);
}

export function comparePosition(a: Positioned, b: Positioned): number {
  if (a.position < b.position) return -1;
  if (a.position > b.position) return 1;
  return 0;
}
