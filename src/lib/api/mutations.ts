"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  createBoardAction,
  createColumnAction,
  deleteBoardAction,
  deleteColumnAction,
  moveColumnAction,
  renameBoardAction,
  updateColumnAction,
} from "@/server/actions/boards";
import { logFocusAction } from "@/server/actions/focus";
import { createNoteAction, deleteNoteAction, updateNoteAction } from "@/server/actions/notes";
import {
  createSubtaskAction,
  createTaskAction,
  deleteSubtaskAction,
  deleteTaskAction,
  moveTaskAction,
  updateSubtaskAction,
  updateTaskAction,
} from "@/server/actions/tasks";

import type {
  BoardDto,
  CalendarTaskDto,
  NoteDto,
  NotesResponse,
  NoteSummaryDto,
  TaskDto,
} from "@/types/dto";
import type {
  CreateBoardInput,
  CreateColumnInput,
  CreateNoteInput,
  CreateSubtaskInput,
  CreateTaskInput,
  LogFocusInput,
  MoveColumnInput,
  MoveTaskInput,
  UpdateColumnInput,
  UpdateNoteInput,
  UpdateSubtaskInput,
  UpdateTaskInput,
} from "@/types/input";
import { comparePosition, keyBetween } from "@/lib/utils/position";

import { unwrap } from "./client";
import { qk } from "./query-keys";

/* -------------------------------------------------------------------------- */
/*  Mutation registry. Keys + functions are registered as query-client         */
/*  defaults so mutations paused while offline can be persisted to IndexedDB   */
/*  and resumed after a reload.                                                */
/* -------------------------------------------------------------------------- */

export const mutationFns = {
  "task.create": (v: CreateTaskInput) => unwrap(createTaskAction(v)),
  "task.update": (v: UpdateTaskInput) => unwrap(updateTaskAction(v)),
  "task.move": (v: MoveTaskInput) => unwrap(moveTaskAction(v)),
  "task.delete": (v: { taskId: string }) => unwrap(deleteTaskAction(v)),
  "subtask.create": (v: CreateSubtaskInput) => unwrap(createSubtaskAction(v)),
  "subtask.update": (v: UpdateSubtaskInput) => unwrap(updateSubtaskAction(v)),
  "subtask.delete": (v: { subtaskId: string }) => unwrap(deleteSubtaskAction(v)),
  "note.create": (v: CreateNoteInput) => unwrap(createNoteAction(v)),
  "note.update": (v: UpdateNoteInput) => unwrap(updateNoteAction(v)),
  "note.delete": (v: { noteId: string }) => unwrap(deleteNoteAction(v)),
  "focus.log": (v: LogFocusInput) => unwrap(logFocusAction(v)),
  "board.create": (v: CreateBoardInput) => unwrap(createBoardAction(v)),
  "board.rename": (v: { boardId: string; name: string }) => unwrap(renameBoardAction(v)),
  "board.delete": (v: { boardId: string }) => unwrap(deleteBoardAction(v)),
  "column.create": (v: CreateColumnInput) => unwrap(createColumnAction(v)),
  "column.update": (v: UpdateColumnInput) => unwrap(updateColumnAction(v)),
  "column.move": (v: MoveColumnInput) => unwrap(moveColumnAction(v)),
  "column.delete": (v: { columnId: string }) => unwrap(deleteColumnAction(v)),
} as const;

/**
 * Registers every mutation function as a query-client default so mutations
 * paused while offline can be persisted and resumed after a reload.
 */
export function registerMutationDefaults(qc: QueryClient): void {
  for (const [name, mutationFn] of Object.entries(mutationFns)) {
    // `never` variables: every typed mutation function is assignable to it.
    qc.setMutationDefaults<unknown, Error, never>([name], { mutationFn });
  }
}

/* --------------------------------- Helpers --------------------------------- */

const nowIso = () => new Date().toISOString();

function patchBoards(qc: QueryClient, fn: (board: BoardDto) => BoardDto) {
  qc.setQueriesData<BoardDto>({ queryKey: ["board"] }, (b) => (b ? fn(b) : b));
}

function patchTask(qc: QueryClient, taskId: string, fn: (t: TaskDto) => TaskDto) {
  patchBoards(qc, (b) =>
    b.tasks.some((t) => t.id === taskId)
      ? { ...b, tasks: b.tasks.map((t) => (t.id === taskId ? fn(t) : t)) }
      : b,
  );
  qc.setQueryData<TaskDto>(qk.task(taskId), (t) => (t ? fn(t) : t));
}

async function snapshot(qc: QueryClient, prefixes: readonly (readonly unknown[])[]) {
  await Promise.all(prefixes.map((queryKey) => qc.cancelQueries({ queryKey })));
  const snaps = prefixes.flatMap((queryKey) => qc.getQueriesData({ queryKey }));
  return () => {
    for (const [key, data] of snaps) qc.setQueryData(key, data);
  };
}

function invalidateTaskViews(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: ["board"] });
  void qc.invalidateQueries({ queryKey: qk.boards });
  void qc.invalidateQueries({ queryKey: qk.calendarAll });
  void qc.invalidateQueries({ queryKey: qk.openTasks });
  void qc.invalidateQueries({ queryKey: qk.statsAll });
}

/* ---------------------------------- Tasks ---------------------------------- */

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["task.create"],
    mutationFn: mutationFns["task.create"],
    onMutate: async (vars) => {
      const rollback = await snapshot(qc, [["board"]]);
      if (vars.id && vars.boardId) {
        const id = vars.id;
        patchBoards(qc, (b) => {
          if (b.id !== vars.boardId) return b;
          const column =
            b.columns.find((c) => c.id === vars.columnId) ?? b.columns.find((c) => !c.isDone);
          if (!column) return b;
          const last = b.tasks
            .filter((t) => t.columnId === column.id)
            .toSorted(comparePosition)
            .at(-1);
          const optimistic: TaskDto = {
            id,
            boardId: b.id,
            columnId: column.id,
            title: vars.title,
            description: vars.description ?? "",
            priority: vars.priority ?? "none",
            labels: vars.labels ?? [],
            position: keyBetween(last?.position, null),
            estimate: null,
            dueAt: vars.dueAt ?? null,
            remindAt: vars.remindAt ?? null,
            completedAt: column.isDone ? nowIso() : null,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            subtasks: [],
            focusSeconds: 0,
          };
          return { ...b, tasks: [...b.tasks, optimistic] };
        });
      }
      return { rollback };
    },
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: () => invalidateTaskViews(qc),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["task.update"],
    mutationFn: mutationFns["task.update"],
    onMutate: async (vars) => {
      const rollback = await snapshot(qc, [["board"], qk.task(vars.taskId), qk.calendarAll]);
      qc.setQueriesData<CalendarTaskDto[]>({ queryKey: qk.calendarAll }, (list) =>
        list?.map((t) =>
          t.id === vars.taskId
            ? {
                ...t,
                ...(vars.title !== undefined ? { title: vars.title } : {}),
                ...(vars.priority !== undefined ? { priority: vars.priority } : {}),
                ...(vars.dueAt ? { dueAt: vars.dueAt } : {}),
                ...(vars.remindAt !== undefined ? { remindAt: vars.remindAt } : {}),
              }
            : t,
        ),
      );
      patchTask(qc, vars.taskId, (t) => ({
        ...t,
        ...(vars.title !== undefined ? { title: vars.title } : {}),
        ...(vars.description !== undefined ? { description: vars.description } : {}),
        ...(vars.priority !== undefined ? { priority: vars.priority } : {}),
        ...(vars.labels !== undefined ? { labels: vars.labels } : {}),
        ...(vars.estimate !== undefined ? { estimate: vars.estimate } : {}),
        ...(vars.dueAt !== undefined ? { dueAt: vars.dueAt } : {}),
        ...(vars.remindAt !== undefined ? { remindAt: vars.remindAt } : {}),
        updatedAt: nowIso(),
      }));
      return { rollback };
    },
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSuccess: (task) => patchTask(qc, task.id, () => task),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.calendarAll });
      void qc.invalidateQueries({ queryKey: qk.openTasks });
    },
  });
}

export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["task.move"],
    mutationFn: mutationFns["task.move"],
    onMutate: async (vars) => {
      const rollback = await snapshot(qc, [["board"]]);
      patchBoards(qc, (b) => {
        const moving = b.tasks.find((t) => t.id === vars.taskId);
        const column = b.columns.find((c) => c.id === vars.columnId);
        if (!moving || !column) return b;
        const pos = (id: string | null) => (id ? b.tasks.find((t) => t.id === id)?.position : null);
        const position = keyBetween(pos(vars.afterTaskId), pos(vars.beforeTaskId));
        return {
          ...b,
          tasks: b.tasks.map((t) =>
            t.id === vars.taskId
              ? {
                  ...t,
                  columnId: column.id,
                  position,
                  completedAt: column.isDone ? (t.completedAt ?? nowIso()) : null,
                }
              : t,
          ),
        };
      });
      return { rollback };
    },
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: () => invalidateTaskViews(qc),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["task.delete"],
    mutationFn: mutationFns["task.delete"],
    onMutate: async ({ taskId }) => {
      const rollback = await snapshot(qc, [["board"]]);
      patchBoards(qc, (b) => ({ ...b, tasks: b.tasks.filter((t) => t.id !== taskId) }));
      return { rollback };
    },
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: () => invalidateTaskViews(qc),
  });
}

/* --------------------------------- Subtasks -------------------------------- */

export function useCreateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["subtask.create"],
    mutationFn: mutationFns["subtask.create"],
    onMutate: async (vars) => {
      const rollback = await snapshot(qc, [["board"], qk.task(vars.taskId)]);
      if (vars.id) {
        const id = vars.id;
        patchTask(qc, vars.taskId, (t) => ({
          ...t,
          subtasks: [
            ...t.subtasks,
            {
              id,
              title: vars.title,
              done: false,
              position: keyBetween(t.subtasks.at(-1)?.position, null),
            },
          ],
        }));
      }
      return { rollback };
    },
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: () => void qc.invalidateQueries({ queryKey: ["board"] }),
  });
}

export function useUpdateSubtask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["subtask.update"],
    mutationFn: mutationFns["subtask.update"],
    onMutate: async (vars) => {
      const rollback = await snapshot(qc, [["board"], qk.task(taskId)]);
      patchTask(qc, taskId, (t) => ({
        ...t,
        subtasks: t.subtasks.map((s) =>
          s.id === vars.subtaskId
            ? {
                ...s,
                ...(vars.title !== undefined ? { title: vars.title } : {}),
                ...(vars.done !== undefined ? { done: vars.done } : {}),
              }
            : s,
        ),
      }));
      return { rollback };
    },
    onError: (_e, _v, ctx) => ctx?.rollback(),
  });
}

export function useDeleteSubtask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["subtask.delete"],
    mutationFn: mutationFns["subtask.delete"],
    onMutate: async ({ subtaskId }) => {
      const rollback = await snapshot(qc, [["board"], qk.task(taskId)]);
      patchTask(qc, taskId, (t) => ({
        ...t,
        subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
      }));
      return { rollback };
    },
    onError: (_e, _v, ctx) => ctx?.rollback(),
  });
}

/* ---------------------------------- Notes ---------------------------------- */

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["note.create"],
    mutationFn: mutationFns["note.create"],
    onSuccess: (note) => {
      qc.setQueryData(qk.note(note.id), note);
      void qc.invalidateQueries({ queryKey: qk.notesAll });
    },
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["note.update"],
    mutationFn: mutationFns["note.update"],
    onMutate: async (vars) => {
      const rollback = await snapshot(qc, [qk.note(vars.noteId), qk.notesAll]);
      const apply = <T extends NoteDto | NoteSummaryDto>(n: T): T => ({
        ...n,
        ...(vars.title !== undefined ? { title: vars.title } : {}),
        ...(vars.tags !== undefined ? { tags: vars.tags } : {}),
        ...(vars.pinned !== undefined ? { pinned: vars.pinned } : {}),
        ...(vars.archived !== undefined ? { archived: vars.archived } : {}),
        updatedAt: nowIso(),
      });
      qc.setQueryData<NoteDto>(qk.note(vars.noteId), (n) =>
        n ? { ...apply(n), ...(vars.content !== undefined ? { content: vars.content } : {}) } : n,
      );
      qc.setQueriesData<NotesResponse>({ queryKey: qk.notesAll }, (d) =>
        d ? { ...d, notes: d.notes.map((n) => (n.id === vars.noteId ? apply(n) : n)) } : d,
      );
      return { rollback };
    },
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSuccess: (note) => qc.setQueryData(qk.note(note.id), note),
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.notesAll }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["note.delete"],
    mutationFn: mutationFns["note.delete"],
    onSuccess: (_d, { noteId }) => {
      qc.removeQueries({ queryKey: qk.note(noteId) });
      void qc.invalidateQueries({ queryKey: qk.notesAll });
    },
  });
}

/* ---------------------------------- Focus ---------------------------------- */

export function useLogFocus() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["focus.log"],
    mutationFn: mutationFns["focus.log"],
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.statsAll });
      void qc.invalidateQueries({ queryKey: ["board"] });
    },
  });
}

/* ------------------------------ Boards/columns ----------------------------- */

function useInvalidate(keys: readonly (readonly unknown[])[]) {
  const qc = useQueryClient();
  return () => {
    for (const queryKey of keys) void qc.invalidateQueries({ queryKey });
  };
}

export function useCreateBoard() {
  const onSettled = useInvalidate([qk.boards]);
  return useMutation({
    mutationKey: ["board.create"],
    mutationFn: mutationFns["board.create"],
    onSettled,
  });
}
export function useRenameBoard() {
  const onSettled = useInvalidate([qk.boards, ["board"]]);
  return useMutation({
    mutationKey: ["board.rename"],
    mutationFn: mutationFns["board.rename"],
    onSettled,
  });
}
export function useDeleteBoard() {
  const onSettled = useInvalidate([qk.boards]);
  return useMutation({
    mutationKey: ["board.delete"],
    mutationFn: mutationFns["board.delete"],
    onSettled,
  });
}
export function useCreateColumn() {
  const onSettled = useInvalidate([["board"]]);
  return useMutation({
    mutationKey: ["column.create"],
    mutationFn: mutationFns["column.create"],
    onSettled,
  });
}
export function useUpdateColumn() {
  const onSettled = useInvalidate([["board"]]);
  return useMutation({
    mutationKey: ["column.update"],
    mutationFn: mutationFns["column.update"],
    onSettled,
  });
}
export function useMoveColumn() {
  const onSettled = useInvalidate([["board"]]);
  return useMutation({
    mutationKey: ["column.move"],
    mutationFn: mutationFns["column.move"],
    onSettled,
  });
}
export function useDeleteColumn() {
  const onSettled = useInvalidate([["board"], qk.boards]);
  return useMutation({
    mutationKey: ["column.delete"],
    mutationFn: mutationFns["column.delete"],
    onSettled,
  });
}
