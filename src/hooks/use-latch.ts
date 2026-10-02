"use client";

import { useState } from "react";

/**
 * Returns true once `value` has been true at least once. Used to mount
 * lazily-loaded overlays on first open and keep them for exit animations.
 */
export function useLatch(value: boolean): boolean {
  const [latched, setLatched] = useState(value);
  if (value && !latched) setLatched(true);
  return latched || value;
}
