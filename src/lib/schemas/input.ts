import { z } from "zod";

/**
 * Shared input schemas. Every server action and route handler validates its
 * input with one of these. Lengths are capped to bound storage and payload size.
 */

export const LIMITS = {
  boardName: 60,
  columnName: 40,
  taskTitle: 200,
  taskDescription: 20_000,
  noteTitle: 200,
  noteContent: 200_000,
  label: 24,
  labels: 12,
  subtaskTitle: 200,
  search: 120,
} as const;

export const PRIORITIES = ["none", "low", "medium", "high", "urgent"] as const;
export const prioritySchema = z.enum(PRIORITIES);

export const idSchema = z.uuid();

const trimmed = (max: number) => z.string().trim().max(max);
const required = (max: number) => trimmed(max).min(1, "Required.");

const labelSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(LIMITS.label)
  .regex(/^[\p{L}\p{N}_-]+$/u, "Use letters, numbers, hyphens and underscores only.");

export const labelsSchema = z
  .array(labelSchema)
  .max(LIMITS.labels)
  .transform((l) => [...new Set(l)]);

const isoDate = z.iso.datetime({ offset: true });
const nullableDate = isoDate.nullable();

/* ---------------------------------- Boards --------------------------------- */

export const createBoardInput = z.object({ name: required(LIMITS.boardName) });
export const renameBoardInput = z.object({ boardId: idSchema, name: required(LIMITS.boardName) });
export const deleteBoardInput = z.object({ boardId: idSchema });

export const createColumnInput = z.object({
  boardId: idSchema,
  name: required(LIMITS.columnName),
});
export const updateColumnInput = z.object({
  columnId: idSchema,
  name: required(LIMITS.columnName).optional(),
  wipLimit: z.number().int().min(1).max(99).nullable().optional(),
  isDone: z.boolean().optional(),
});
export const moveColumnInput = z.object({
  columnId: idSchema,
  direction: z.enum(["left", "right"]),
});
export const deleteColumnInput = z.object({ columnId: idSchema });

/* ---------------------------------- Tasks ---------------------------------- */

export const createTaskInput = z.object({
  /** Client-generated id so optimistic UI and offline replay are idempotent. */
  id: idSchema.optional(),
  boardId: idSchema.optional(),
  columnId: idSchema.optional(),
  title: required(LIMITS.taskTitle),
  description: trimmed(LIMITS.taskDescription).optional(),
  priority: prioritySchema.optional(),
  labels: labelsSchema.optional(),
  dueAt: nullableDate.optional(),
  remindAt: nullableDate.optional(),
});

export const updateTaskInput = z.object({
  taskId: idSchema,
  title: required(LIMITS.taskTitle).optional(),
  description: trimmed(LIMITS.taskDescription).optional(),
  priority: prioritySchema.optional(),
  labels: labelsSchema.optional(),
  estimate: z.number().int().min(1).max(50).nullable().optional(),
  dueAt: nullableDate.optional(),
  remindAt: nullableDate.optional(),
});

export const moveTaskInput = z.object({
  taskId: idSchema,
  columnId: idSchema,
  /** Neighbours in the destination column after the move (null = edge). */
  afterTaskId: idSchema.nullable(),
  beforeTaskId: idSchema.nullable(),
});

export const deleteTaskInput = z.object({ taskId: idSchema });

export const createSubtaskInput = z.object({
  id: idSchema.optional(),
  taskId: idSchema,
  title: required(LIMITS.subtaskTitle),
});
export const updateSubtaskInput = z.object({
  subtaskId: idSchema,
  title: required(LIMITS.subtaskTitle).optional(),
  done: z.boolean().optional(),
});
export const deleteSubtaskInput = z.object({ subtaskId: idSchema });

/* ---------------------------------- Notes ---------------------------------- */

export const createNoteInput = z.object({
  id: idSchema.optional(),
  title: trimmed(LIMITS.noteTitle).optional(),
  content: z.string().max(LIMITS.noteContent).optional(),
  tags: labelsSchema.optional(),
  taskId: idSchema.nullable().optional(),
});

export const updateNoteInput = z.object({
  noteId: idSchema,
  title: trimmed(LIMITS.noteTitle).optional(),
  content: z.string().max(LIMITS.noteContent).optional(),
  tags: labelsSchema.optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
  taskId: idSchema.nullable().optional(),
});

export const deleteNoteInput = z.object({ noteId: idSchema });

export const noteListQuery = z.object({
  q: trimmed(LIMITS.search).optional(),
  tag: labelSchema.optional(),
  archived: z.enum(["true", "false"]).optional(),
});

/* ---------------------------------- Focus ---------------------------------- */

export const FOCUS_KINDS = ["focus", "short_break", "long_break"] as const;

export const logFocusInput = z
  .object({
    id: idSchema.optional(),
    taskId: idSchema.nullable(),
    kind: z.enum(FOCUS_KINDS),
    startedAt: isoDate,
    endedAt: isoDate,
  })
  .refine((v) => Date.parse(v.endedAt) > Date.parse(v.startedAt), "endedAt must follow startedAt")
  .refine(
    (v) => Date.parse(v.endedAt) - Date.parse(v.startedAt) <= 4 * 60 * 60 * 1000,
    "Session too long",
  )
  .refine((v) => Date.parse(v.endedAt) <= Date.now() + 60_000, "endedAt is in the future");

/* ---------------------------------- Search --------------------------------- */

export const searchQuery = z.object({ q: trimmed(LIMITS.search).min(1) });

export const calendarQuery = z
  .object({ from: isoDate, to: isoDate })
  .refine((v) => Date.parse(v.to) > Date.parse(v.from), "to must follow from")
  .refine(
    (v) => Date.parse(v.to) - Date.parse(v.from) <= 62 * 24 * 60 * 60 * 1000,
    "Range too large",
  );

/* ----------------------------------- Push ---------------------------------- */

export const pushSubscriptionInput = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});

export const unsubscribePushInput = z.object({ endpoint: z.url().max(2048) });
