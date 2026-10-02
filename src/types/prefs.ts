import type { z } from "zod";

import type { prefsSchema } from "@/lib/schemas/prefs";

export type Prefs = z.infer<typeof prefsSchema>;
export type ThemePref = Prefs["theme"];
export type MotionPref = Prefs["motion"];
export type TimerLengthKey = "focusMinutes" | "shortBreakMinutes" | "longBreakMinutes";
