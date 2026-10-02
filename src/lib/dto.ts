import { z } from "zod";

import { FOCUS_KINDS, PRIORITIES } from "./validation";

/**
 * Response contracts for the read API (`/api/v1/*`). The server builds values
 * of these types and the client parses responses with the same schemas, so
 * the JSON boundary stays type safe in both directions.
 */

const date = z.iso.datetime({ offset: true });

export const columnDto = z.object({
  id: z.uuid(),
  name: z.string(),
  position: z.string(),
  wipLimit: z.number().int().nullable(),
  isDone: z.boolean(),
});
export type ColumnDto = z.infer<typeof columnDto>;

export const subtaskDto = z.object({
  id: z.uuid(),
  title: z.string(),
  done: z.boolean(),
  position: z.string(),
});
export type SubtaskDto = z.infer<typeof subtaskDto>;

export const taskDto = z.object({
  id: z.uuid(),
  boardId: z.uuid(),
  columnId: z.uuid(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(PRIORITIES),
  labels: z.array(z.string()),
  position: z.string(),
  estimate: z.number().int().nullable(),
  dueAt: date.nullable(),
  remindAt: date.nullable(),
  completedAt: date.nullable(),
  createdAt: date,
  updatedAt: date,
  subtasks: z.array(subtaskDto),
  focusSeconds: z.number().int(),
});
export type TaskDto = z.infer<typeof taskDto>;

export const boardSummaryDto = z.object({
  id: z.uuid(),
  name: z.string(),
  position: z.string(),
  openTasks: z.number().int(),
});
export type BoardSummaryDto = z.infer<typeof boardSummaryDto>;

export const boardDto = z.object({
  id: z.uuid(),
  name: z.string(),
  columns: z.array(columnDto),
  tasks: z.array(taskDto),
});
export type BoardDto = z.infer<typeof boardDto>;

export const noteSummaryDto = z.object({
  id: z.uuid(),
  title: z.string(),
  excerpt: z.string(),
  tags: z.array(z.string()),
  pinned: z.boolean(),
  archived: z.boolean(),
  updatedAt: date,
});
export type NoteSummaryDto = z.infer<typeof noteSummaryDto>;

export const noteDto = z.object({
  id: z.uuid(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  pinned: z.boolean(),
  archived: z.boolean(),
  taskId: z.uuid().nullable(),
  createdAt: date,
  updatedAt: date,
});
export type NoteDto = z.infer<typeof noteDto>;

export const searchHitDto = z.object({
  kind: z.enum(["task", "note"]),
  id: z.uuid(),
  title: z.string(),
  snippet: z.string(),
  boardId: z.uuid().nullable(),
});
export type SearchHitDto = z.infer<typeof searchHitDto>;

export const calendarTaskDto = z.object({
  id: z.uuid(),
  boardId: z.uuid(),
  title: z.string(),
  priority: z.enum(PRIORITIES),
  dueAt: date,
  remindAt: date.nullable(),
  completedAt: date.nullable(),
});
export type CalendarTaskDto = z.infer<typeof calendarTaskDto>;

export const openTaskDto = z.object({
  id: z.uuid(),
  boardId: z.uuid(),
  boardName: z.string(),
  title: z.string(),
  priority: z.enum(PRIORITIES),
  remindAt: date.nullable(),
});
export type OpenTaskDto = z.infer<typeof openTaskDto>;

export const focusStatsDto = z.object({
  /** Seconds of focus per local day, oldest first (84 days). */
  daily: z.array(z.object({ day: z.string(), seconds: z.number().int() })),
  /** Completed tasks per ISO week, oldest first (8 weeks). */
  weekly: z.array(z.object({ week: z.string(), completed: z.number().int() })),
  topTasks: z.array(z.object({ taskId: z.uuid(), title: z.string(), seconds: z.number().int() })),
  totals: z.object({
    focusSeconds: z.number().int(),
    sessions: z.number().int(),
    completedTasks: z.number().int(),
    openTasks: z.number().int(),
    notes: z.number().int(),
    currentStreak: z.number().int(),
    longestStreak: z.number().int(),
  }),
});
export type FocusStatsDto = z.infer<typeof focusStatsDto>;

export const focusSessionDto = z.object({
  id: z.uuid(),
  taskId: z.uuid().nullable(),
  kind: z.enum(FOCUS_KINDS),
  startedAt: date,
  endedAt: date,
  durationSec: z.number().int(),
});
export type FocusSessionDto = z.infer<typeof focusSessionDto>;
