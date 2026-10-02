import "server-only";

import { and, asc, eq, gte, isNotNull, isNull, lt, sql } from "drizzle-orm";
import type { z } from "zod";

import type { CalendarTaskDto, OpenTaskDto, SubtaskDto, TaskDto } from "@/lib/dto";
import { keyBetween } from "@/lib/position";
import type { createTaskInput, moveTaskInput, updateTaskInput } from "@/lib/validation";

import { db, type Tx } from "../db";
import { board, boardColumn, focusSession, subtask, task } from "../db/schema";
import { ActionError, NotFoundError } from "../errors";
import { toTaskDto } from "./boards";
import { byPosition, dateOrNull, definedOnly, iso, isoOrNull, maxPosition } from "./util";

async function loadTaskDto(tx: Tx | typeof db, userId: string, taskId: string): Promise<TaskDto> {
  const [t] = await tx
    .select()
    .from(task)
    .where(and(eq(task.id, taskId), eq(task.userId, userId)));
  if (!t) throw new NotFoundError("Task");
  const [subs, [focus]] = await Promise.all([
    tx
      .select()
      .from(subtask)
      .where(and(eq(subtask.userId, userId), eq(subtask.taskId, taskId))),
    tx
      .select({ seconds: sql<number>`coalesce(sum(${focusSession.durationSec}), 0)::int` })
      .from(focusSession)
      .where(
        and(
          eq(focusSession.userId, userId),
          eq(focusSession.taskId, taskId),
          eq(focusSession.kind, "focus"),
        ),
      ),
  ]);
  return toTaskDto(t, subs, focus?.seconds ?? 0);
}

export async function getTask(userId: string, taskId: string): Promise<TaskDto | null> {
  try {
    return await loadTaskDto(db, userId, taskId);
  } catch (e) {
    if (e instanceof NotFoundError) return null;
    throw e;
  }
}

/** Resolves the destination column for a new task, verifying ownership. */
async function resolveColumn(
  tx: Tx,
  userId: string,
  boardId: string | undefined,
  columnId: string | undefined,
) {
  if (columnId) {
    const [col] = await tx
      .select()
      .from(boardColumn)
      .where(and(eq(boardColumn.id, columnId), eq(boardColumn.userId, userId)));
    if (!col || (boardId && col.boardId !== boardId)) throw new NotFoundError("Column");
    return col;
  }
  const targetBoardId =
    boardId ??
    (
      await tx
        .select({ id: board.id })
        .from(board)
        .where(eq(board.userId, userId))
        .orderBy(byPosition(board.position))
        .limit(1)
    )[0]?.id;
  if (!targetBoardId) throw new ActionError("Create a board first.");

  const cols = await tx
    .select()
    .from(boardColumn)
    .where(and(eq(boardColumn.userId, userId), eq(boardColumn.boardId, targetBoardId)))
    .orderBy(byPosition(boardColumn.position));
  const col = cols.find((c) => !c.isDone) ?? cols[0];
  if (!col) throw new NotFoundError("Board");
  return col;
}

export async function createTask(
  userId: string,
  input: z.infer<typeof createTaskInput>,
): Promise<TaskDto> {
  return db.transaction(async (tx) => {
    if (input.id) {
      // Idempotent replay of an offline/optimistic create.
      const [existing] = await tx
        .select({ id: task.id, userId: task.userId })
        .from(task)
        .where(eq(task.id, input.id));
      if (existing) {
        if (existing.userId !== userId) throw new ActionError("Invalid id");
        return loadTaskDto(tx, userId, existing.id);
      }
    }

    const col = await resolveColumn(tx, userId, input.boardId, input.columnId);
    const [last] = await tx
      .select({ max: maxPosition(task.position) })
      .from(task)
      .where(and(eq(task.userId, userId), eq(task.columnId, col.id)));

    const [created] = await tx
      .insert(task)
      .values({
        ...(input.id ? { id: input.id } : {}),
        userId,
        boardId: col.boardId,
        columnId: col.id,
        title: input.title,
        description: input.description ?? "",
        priority: input.priority ?? "none",
        labels: input.labels ?? [],
        position: keyBetween(last?.max, null),
        dueAt: dateOrNull(input.dueAt),
        remindAt: dateOrNull(input.remindAt),
        completedAt: col.isDone ? new Date() : null,
      })
      .returning({ id: task.id });
    if (!created) throw new ActionError("Could not create task");
    return loadTaskDto(tx, userId, created.id);
  });
}

export async function updateTask(
  userId: string,
  input: z.infer<typeof updateTaskInput>,
): Promise<TaskDto> {
  const { taskId, dueAt, remindAt, ...rest } = input;
  const patch = {
    ...definedOnly(rest),
    ...(dueAt !== undefined ? { dueAt: dateOrNull(dueAt) } : {}),
    // Changing the reminder re-arms it.
    ...(remindAt !== undefined ? { remindAt: dateOrNull(remindAt), reminderSentAt: null } : {}),
  };
  return db.transaction(async (tx) => {
    const res = await tx
      .update(task)
      .set(patch)
      .where(and(eq(task.id, taskId), eq(task.userId, userId)))
      .returning({ id: task.id });
    if (res.length === 0) throw new NotFoundError("Task");
    return loadTaskDto(tx, userId, taskId);
  });
}

export async function moveTask(
  userId: string,
  input: z.infer<typeof moveTaskInput>,
): Promise<TaskDto> {
  return db.transaction(async (tx) => {
    const [t] = await tx
      .select({ id: task.id, boardId: task.boardId, completedAt: task.completedAt })
      .from(task)
      .where(and(eq(task.id, input.taskId), eq(task.userId, userId)));
    if (!t) throw new NotFoundError("Task");

    const [col] = await tx
      .select()
      .from(boardColumn)
      .where(
        and(
          eq(boardColumn.id, input.columnId),
          eq(boardColumn.userId, userId),
          eq(boardColumn.boardId, t.boardId),
        ),
      );
    if (!col) throw new NotFoundError("Column");

    // Neighbour positions are looked up server-side; the client never sends keys.
    const neighbour = async (id: string | null) => {
      if (!id || id === t.id) return null;
      const [n] = await tx
        .select({ position: task.position })
        .from(task)
        .where(and(eq(task.id, id), eq(task.userId, userId), eq(task.columnId, col.id)));
      return n?.position ?? null;
    };
    const [after, before] = await Promise.all([
      neighbour(input.afterTaskId),
      neighbour(input.beforeTaskId),
    ]);

    let position: string;
    if (after === null && before === null && (input.afterTaskId || input.beforeTaskId)) {
      // Neighbours moved concurrently: append to the end of the column.
      const [last] = await tx
        .select({ max: maxPosition(task.position) })
        .from(task)
        .where(and(eq(task.userId, userId), eq(task.columnId, col.id)));
      position = keyBetween(last?.max, null);
    } else {
      position = keyBetween(after, before);
    }

    await tx
      .update(task)
      .set({
        columnId: col.id,
        position,
        completedAt: col.isDone ? (t.completedAt ?? new Date()) : null,
      })
      .where(eq(task.id, t.id));
    return loadTaskDto(tx, userId, t.id);
  });
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const res = await db
    .delete(task)
    .where(and(eq(task.id, taskId), eq(task.userId, userId)))
    .returning({ id: task.id });
  if (res.length === 0) throw new NotFoundError("Task");
}

/* --------------------------------- Subtasks -------------------------------- */

export async function createSubtask(
  userId: string,
  input: { id?: string | undefined; taskId: string; title: string },
): Promise<SubtaskDto> {
  return db.transaction(async (tx) => {
    const [parent] = await tx
      .select({ id: task.id })
      .from(task)
      .where(and(eq(task.id, input.taskId), eq(task.userId, userId)));
    if (!parent) throw new NotFoundError("Task");

    if (input.id) {
      const [existing] = await tx.select().from(subtask).where(eq(subtask.id, input.id));
      if (existing) {
        if (existing.userId !== userId) throw new ActionError("Invalid id");
        return {
          id: existing.id,
          title: existing.title,
          done: existing.done,
          position: existing.position,
        };
      }
    }

    const [last] = await tx
      .select({ max: maxPosition(subtask.position) })
      .from(subtask)
      .where(and(eq(subtask.userId, userId), eq(subtask.taskId, input.taskId)));
    const [created] = await tx
      .insert(subtask)
      .values({
        ...(input.id ? { id: input.id } : {}),
        userId,
        taskId: input.taskId,
        title: input.title,
        position: keyBetween(last?.max, null),
      })
      .returning();
    if (!created) throw new ActionError("Could not add subtask");
    return { id: created.id, title: created.title, done: created.done, position: created.position };
  });
}

export async function updateSubtask(
  userId: string,
  input: { subtaskId: string; title?: string | undefined; done?: boolean | undefined },
): Promise<SubtaskDto> {
  const [updated] = await db
    .update(subtask)
    .set(definedOnly({ title: input.title, done: input.done }))
    .where(and(eq(subtask.id, input.subtaskId), eq(subtask.userId, userId)))
    .returning();
  if (!updated) throw new NotFoundError("Subtask");
  return { id: updated.id, title: updated.title, done: updated.done, position: updated.position };
}

export async function deleteSubtask(userId: string, subtaskId: string): Promise<void> {
  const res = await db
    .delete(subtask)
    .where(and(eq(subtask.id, subtaskId), eq(subtask.userId, userId)))
    .returning({ id: subtask.id });
  if (res.length === 0) throw new NotFoundError("Subtask");
}

/* ------------------------------ Cross-board reads --------------------------- */

export async function listOpenTasks(userId: string): Promise<OpenTaskDto[]> {
  const rows = await db
    .select({
      id: task.id,
      boardId: task.boardId,
      boardName: board.name,
      title: task.title,
      priority: task.priority,
      remindAt: task.remindAt,
    })
    .from(task)
    .innerJoin(board, eq(board.id, task.boardId))
    .where(and(eq(task.userId, userId), isNull(task.completedAt)))
    .orderBy(asc(task.dueAt), byPosition(task.position))
    .limit(500);
  return rows.map((r) => ({ ...r, remindAt: isoOrNull(r.remindAt) }));
}

export async function listCalendarTasks(
  userId: string,
  from: Date,
  to: Date,
): Promise<CalendarTaskDto[]> {
  const rows = await db
    .select({
      id: task.id,
      boardId: task.boardId,
      title: task.title,
      priority: task.priority,
      dueAt: task.dueAt,
      remindAt: task.remindAt,
      completedAt: task.completedAt,
    })
    .from(task)
    .where(
      and(
        eq(task.userId, userId),
        isNotNull(task.dueAt),
        gte(task.dueAt, from),
        lt(task.dueAt, to),
      ),
    )
    .orderBy(asc(task.dueAt))
    .limit(1000);
  return rows.flatMap((r) =>
    r.dueAt
      ? [
          {
            id: r.id,
            boardId: r.boardId,
            title: r.title,
            priority: r.priority,
            dueAt: iso(r.dueAt),
            remindAt: isoOrNull(r.remindAt),
            completedAt: isoOrNull(r.completedAt),
          },
        ]
      : [],
  );
}
