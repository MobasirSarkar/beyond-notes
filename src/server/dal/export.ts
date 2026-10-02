import "server-only";

import { eq } from "drizzle-orm";

import { db } from "../db";
import { board, boardColumn, focusSession, note, subtask, task, user } from "../db/schema";

/** Full JSON export of everything a user owns (GDPR-style data portability). */
export async function exportUserData(userId: string) {
  const [profile, boards, columns, tasks, subtasks, notes, sessions] = await Promise.all([
    db
      .select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt })
      .from(user)
      .where(eq(user.id, userId)),
    db.select().from(board).where(eq(board.userId, userId)),
    db.select().from(boardColumn).where(eq(boardColumn.userId, userId)),
    db
      .select({
        id: task.id,
        boardId: task.boardId,
        columnId: task.columnId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        labels: task.labels,
        position: task.position,
        estimate: task.estimate,
        dueAt: task.dueAt,
        remindAt: task.remindAt,
        completedAt: task.completedAt,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })
      .from(task)
      .where(eq(task.userId, userId)),
    db.select().from(subtask).where(eq(subtask.userId, userId)),
    db
      .select({
        id: note.id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        pinned: note.pinned,
        archivedAt: note.archivedAt,
        taskId: note.taskId,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })
      .from(note)
      .where(eq(note.userId, userId)),
    db.select().from(focusSession).where(eq(focusSession.userId, userId)),
  ]);
  return {
    format: "beyond-notes/v1",
    exportedAt: new Date().toISOString(),
    profile: profile[0] ?? null,
    boards,
    columns,
    tasks,
    subtasks,
    notes,
    focusSessions: sessions,
  };
}
