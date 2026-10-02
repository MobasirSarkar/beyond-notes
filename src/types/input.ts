import type { z } from "zod";

import type {
  createBoardInput,
  createColumnInput,
  createNoteInput,
  createSubtaskInput,
  createTaskInput,
  logFocusInput,
  moveColumnInput,
  moveTaskInput,
  pushSubscriptionInput,
  updateColumnInput,
  updateNoteInput,
  updateSubtaskInput,
  updateTaskInput,
} from "@/lib/schemas/input";

/** Raw (client-side) shapes accepted by server actions. */
export type CreateBoardInput = z.input<typeof createBoardInput>;
export type CreateColumnInput = z.input<typeof createColumnInput>;
export type UpdateColumnInput = z.input<typeof updateColumnInput>;
export type MoveColumnInput = z.input<typeof moveColumnInput>;
export type CreateTaskInput = z.input<typeof createTaskInput>;
export type UpdateTaskInput = z.input<typeof updateTaskInput>;
export type MoveTaskInput = z.input<typeof moveTaskInput>;
export type CreateSubtaskInput = z.input<typeof createSubtaskInput>;
export type UpdateSubtaskInput = z.input<typeof updateSubtaskInput>;
export type CreateNoteInput = z.input<typeof createNoteInput>;
export type UpdateNoteInput = z.input<typeof updateNoteInput>;
export type LogFocusInput = z.input<typeof logFocusInput>;
export type PushSubscriptionInput = z.input<typeof pushSubscriptionInput>;

/** Validated (server-side) shapes after Zod transforms. */
export type CreateTaskData = z.output<typeof createTaskInput>;
export type UpdateTaskData = z.output<typeof updateTaskInput>;
export type MoveTaskData = z.output<typeof moveTaskInput>;
export type CreateSubtaskData = z.output<typeof createSubtaskInput>;
export type UpdateSubtaskData = z.output<typeof updateSubtaskInput>;
export type UpdateColumnData = z.output<typeof updateColumnInput>;
export type CreateNoteData = z.output<typeof createNoteInput>;
export type UpdateNoteData = z.output<typeof updateNoteInput>;
export type LogFocusData = z.output<typeof logFocusInput>;
export type PushSubscriptionData = z.output<typeof pushSubscriptionInput>;
