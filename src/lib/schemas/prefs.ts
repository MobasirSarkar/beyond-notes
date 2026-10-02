import { z } from "zod";

/**
 * Per-device UI preferences. `.catch()` on every field means corrupt or
 * tampered storage silently falls back to defaults instead of crashing.
 */
export const prefsSchema = z.object({
  theme: z.enum(["system", "light", "dark"]).catch("system"),
  motion: z.enum(["system", "full", "reduced"]).catch("system"),
  sound: z.boolean().catch(true),
  /** Animated ASCII background behind the app. */
  ambient: z.boolean().catch(true),
  focusMinutes: z.number().int().min(1).max(120).catch(25),
  shortBreakMinutes: z.number().int().min(1).max(60).catch(5),
  longBreakMinutes: z.number().int().min(1).max(60).catch(15),
});
