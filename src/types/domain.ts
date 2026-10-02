import type { FOCUS_KINDS, PRIORITIES } from "@/lib/schemas/input";

export type Priority = (typeof PRIORITIES)[number];
export type FocusKind = (typeof FOCUS_KINDS)[number];

/** Result of parsing free text (typed or dictated) into a capture. */
export type ParsedCapture = {
  kind: "task" | "note";
  title: string;
  dueAt: Date | null;
  remindAt: Date | null;
  priority: Priority;
  labels: string[];
};

export type DueTone = "overdue" | "soon" | "later";
export type RelativeDue = { label: string; tone: DueTone };

export type Positioned = { position: string };
