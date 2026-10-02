import "server-only";

import { and, count, desc, eq, gt, isNull, lt, sql } from "drizzle-orm";

import type { BoardDto, BoardSummaryDto, ColumnDto, TaskDto } from "@/lib/dto";
import { comparePosition, keyBetween, keysAfter } from "@/lib/position";

import { db } from "../db";
import { board, boardColumn, focusSession, subtask, task } from "../db/schema";
import { ActionError, NotFoundError } from "../errors";
import { byPosition, definedOnly, iso, isoOrNull, maxPosition } from "./util";

type TaskRow = typeof task.$inferSelect;
type SubtaskRow = typeof subtask.$inferSelect;

export function toTaskDto(t: TaskRow, subtasks: SubtaskRow[], focusSeconds: number): TaskDto {
  return {
    id: t.id,
    boardId: t.boardId,
    columnId: t.columnId,
    title: t.title,
    description: t.description,
    priority: t.priority,
    labels: t.labels,
    position: t.position,
    estimate: t.estimate,
    dueAt: isoOrNull(t.dueAt),
    remindAt: isoOrNull(t.remindAt),
    completedAt: isoOrNull(t.completedAt),
    createdAt: iso(t.createdAt),
    updatedAt: iso(t.updatedAt),
    subtasks: subtasks
      .filter((s) => s.taskId === t.id)
      .toSorted(comparePosition)
      .map((s) => ({ id: s.id, title: s.title, done: s.done, position: s.position })),
    focusSeconds,
  };
}

const toColumnDto = (c: typeof boardColumn.$inferSelect): ColumnDto => ({
  id: c.id,
  name: c.name,
  position: c.position,
  wipLimit: c.wipLimit,
  isDone: c.isDone,
});

/* ---------------------------------- Reads ---------------------------------- */

export async function listBoards(userId: string): Promise<BoardSummaryDto[]> {
  const rows = await db
    .select({
      id: board.id,
      name: board.name,
      position: board.position,
      openTasks: sql<number>`(select count(*)::int from ${task} where ${task.boardId} = ${board.id} and ${task.completedAt} is null)`,
    })
    .from(board)
    .where(eq(board.userId, userId))
    .orderBy(byPosition(board.position));
  return rows;
}

export async function getFirstBoardId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: board.id })
    .from(board)
    .where(eq(board.userId, userId))
    .orderBy(byPosition(board.position))
    .limit(1);
  return row?.id ?? null;
}

export async function getBoard(userId: string, boardId: string): Promise<BoardDto | null> {
  const [b] = await db
    .select({ id: board.id, name: board.name })
    .from(board)
    .where(and(eq(board.id, boardId), eq(board.userId, userId)));
  if (!b) return null;

  const [columns, tasks, subtasks, focus] = await Promise.all([
    db
      .select()
      .from(boardColumn)
      .where(and(eq(boardColumn.userId, userId), eq(boardColumn.boardId, boardId)))
      .orderBy(byPosition(boardColumn.position)),
    db
      .select()
      .from(task)
      .where(and(eq(task.userId, userId), eq(task.boardId, boardId)))
      .orderBy(byPosition(task.position)),
    db
      .select()
      .from(subtask)
      .innerJoin(task, eq(task.id, subtask.taskId))
      .where(and(eq(subtask.userId, userId), eq(task.boardId, boardId)))
      .then((rows) => rows.map((r) => r.subtask)),
    db
      .select({
        taskId: focusSession.taskId,
        seconds: sql<number>`coalesce(sum(${focusSession.durationSec}), 0)::int`,
      })
      .from(focusSession)
      .innerJoin(task, eq(task.id, focusSession.taskId))
      .where(
        and(
          eq(focusSession.userId, userId),
          eq(focusSession.kind, "focus"),
          eq(task.boardId, boardId),
        ),
      )
      .groupBy(focusSession.taskId),
  ]);

  const focusByTask = new Map(focus.map((f) => [f.taskId, f.seconds]));
  return {
    id: b.id,
    name: b.name,
    columns: columns.map(toColumnDto),
    tasks: tasks.map((t) => toTaskDto(t, subtasks, focusByTask.get(t.id) ?? 0)),
  };
}

/* ---------------------------------- Boards --------------------------------- */

export async function createBoard(userId: string, name: string): Promise<{ id: string }> {
  return db.transaction(async (tx) => {
    const [last] = await tx
      .select({ max: maxPosition(board.position) })
      .from(board)
      .where(eq(board.userId, userId));
    const [created] = await tx
      .insert(board)
      .values({ userId, name, position: keyBetween(last?.max, null) })
      .returning({ id: board.id });
    if (!created) throw new ActionError("Could not create board");

    const names = ["To Do", "Doing", "Done"] as const;
    const positions = keysAfter(null, names.length);
    await tx.insert(boardColumn).values(
      names.map((n, i) => ({
        userId,
        boardId: created.id,
        name: n,
        position: positions[i] ?? `a${i}`,
        isDone: n === "Done",
      })),
    );
    return created;
  });
}

export async function renameBoard(userId: string, boardId: string, name: string): Promise<void> {
  const res = await db
    .update(board)
    .set({ name })
    .where(and(eq(board.id, boardId), eq(board.userId, userId)))
    .returning({ id: board.id });
  if (res.length === 0) throw new NotFoundError("Board");
}

export async function deleteBoard(userId: string, boardId: string): Promise<void> {
  const [{ value } = { value: 0 }] = await db
    .select({ value: count() })
    .from(board)
    .where(eq(board.userId, userId));
  if (value <= 1) throw new ActionError("You need at least one board.");
  const res = await db
    .delete(board)
    .where(and(eq(board.id, boardId), eq(board.userId, userId)))
    .returning({ id: board.id });
  if (res.length === 0) throw new NotFoundError("Board");
}

/* --------------------------------- Columns --------------------------------- */

export async function assertBoardOwned(userId: string, boardId: string): Promise<void> {
  const [b] = await db
    .select({ id: board.id })
    .from(board)
    .where(and(eq(board.id, boardId), eq(board.userId, userId)));
  if (!b) throw new NotFoundError("Board");
}

export async function createColumn(
  userId: string,
  boardId: string,
  name: string,
): Promise<ColumnDto> {
  await assertBoardOwned(userId, boardId);
  const [last] = await db
    .select({ max: maxPosition(boardColumn.position) })
    .from(boardColumn)
    .where(and(eq(boardColumn.userId, userId), eq(boardColumn.boardId, boardId)));
  const [created] = await db
    .insert(boardColumn)
    .values({ userId, boardId, name, position: keyBetween(last?.max, null) })
    .returning();
  if (!created) throw new ActionError("Could not create column");
  return toColumnDto(created);
}

export async function updateColumn(
  userId: string,
  columnId: string,
  patch: {
    name?: string | undefined;
    wipLimit?: number | null | undefined;
    isDone?: boolean | undefined;
  },
): Promise<ColumnDto> {
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(boardColumn)
      .set(definedOnly(patch))
      .where(and(eq(boardColumn.id, columnId), eq(boardColumn.userId, userId)))
      .returning();
    if (!updated) throw new NotFoundError("Column");

    // Keep completion state consistent with the column's "done" flag.
    if (patch.isDone === true) {
      await tx
        .update(task)
        .set({ completedAt: new Date() })
        .where(and(eq(task.userId, userId), eq(task.columnId, columnId), isNull(task.completedAt)));
    } else if (patch.isDone === false) {
      await tx
        .update(task)
        .set({ completedAt: null })
        .where(and(eq(task.userId, userId), eq(task.columnId, columnId)));
    }
    return toColumnDto(updated);
  });
}

export async function moveColumn(
  userId: string,
  columnId: string,
  direction: "left" | "right",
): Promise<void> {
  await db.transaction(async (tx) => {
    const [col] = await tx
      .select()
      .from(boardColumn)
      .where(and(eq(boardColumn.id, columnId), eq(boardColumn.userId, userId)));
    if (!col) throw new NotFoundError("Column");

    const siblings = await tx
      .select({ id: boardColumn.id, position: boardColumn.position })
      .from(boardColumn)
      .where(
        and(
          eq(boardColumn.userId, userId),
          eq(boardColumn.boardId, col.boardId),
          direction === "left"
            ? lt(sql`${boardColumn.position} collate "C"`, col.position)
            : gt(sql`${boardColumn.position} collate "C"`, col.position),
        ),
      )
      .orderBy(
        direction === "left"
          ? desc(sql`${boardColumn.position} collate "C"`)
          : byPosition(boardColumn.position),
      )
      .limit(2);

    const [first, second] = siblings;
    if (!first) return; // already at the edge
    const position =
      direction === "left"
        ? keyBetween(second?.position ?? null, first.position)
        : keyBetween(first.position, second?.position ?? null);
    await tx.update(boardColumn).set({ position }).where(eq(boardColumn.id, col.id));
  });
}

export async function deleteColumn(userId: string, columnId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [col] = await tx
      .select({ boardId: boardColumn.boardId })
      .from(boardColumn)
      .where(and(eq(boardColumn.id, columnId), eq(boardColumn.userId, userId)));
    if (!col) throw new NotFoundError("Column");
    const [{ value } = { value: 0 }] = await tx
      .select({ value: count() })
      .from(boardColumn)
      .where(and(eq(boardColumn.userId, userId), eq(boardColumn.boardId, col.boardId)));
    if (value <= 1) throw new ActionError("A board needs at least one column.");
    await tx.delete(boardColumn).where(eq(boardColumn.id, columnId));
  });
}
