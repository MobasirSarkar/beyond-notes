/**
 * Computes streaks from a chronological list of "active day" flags where the
 * last element is today. The current streak may end yesterday (today still
 * counts as in progress).
 */
export function computeStreaks(activeDays: readonly boolean[]): {
  current: number;
  longest: number;
} {
  let longest = 0;
  let run = 0;
  for (const active of activeDays) {
    run = active ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  let current = 0;
  let i = activeDays.length - 1;
  if (i >= 0 && !activeDays[i]) i -= 1; // today not started yet
  while (i >= 0 && activeDays[i]) {
    current += 1;
    i -= 1;
  }
  return { current, longest };
}
