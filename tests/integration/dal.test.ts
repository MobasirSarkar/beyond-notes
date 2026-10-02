import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type * as BoardsDal from "@/server/dal/boards";
import type * as FocusDal from "@/server/dal/focus";
import type * as NotesDal from "@/server/dal/notes";
import type * as PushDal from "@/server/dal/push";
import type * as SearchDal from "@/server/dal/search";
import type * as SeedDal from "@/server/dal/seed";
import type * as TasksDal from "@/server/dal/tasks";
import type * as DbModule from "@/server/db";
import type * as Schema from "@/server/db/schema";
import type * as Errors from "@/server/errors";
import type * as RateLimit from "@/server/rate-limit";

const hasDb = Boolean(process.env["TEST_DATABASE_URL"]);

/**
 * Data-access-layer tests against a real Postgres (TEST_DATABASE_URL).
 * The key property: every read and write is scoped to its owner, so user B
 * can never see or mutate user A's rows even with valid ids.
 */
describe.skipIf(!hasDb)("data access layer (Postgres)", () => {
  // Imported lazily so the suite is skippable without a database.
  let mod: {
    db: typeof DbModule.db;
    schema: typeof Schema;
    boards: typeof BoardsDal;
    tasks: typeof TasksDal;
    notes: typeof NotesDal;
    focus: typeof FocusDal;
    push: typeof PushDal;
    search: typeof SearchDal;
    seed: typeof SeedDal;
    rate: typeof RateLimit;
    errors: typeof Errors;
  };
  const A = "user_a";
  const B = "user_b";
  let boardA: string;

  beforeAll(async () => {
    mod = {
      db: (await import("@/server/db")).db,
      schema: await import("@/server/db/schema"),
      boards: await import("@/server/dal/boards"),
      tasks: await import("@/server/dal/tasks"),
      notes: await import("@/server/dal/notes"),
      focus: await import("@/server/dal/focus"),
      push: await import("@/server/dal/push"),
      search: await import("@/server/dal/search"),
      seed: await import("@/server/dal/seed"),
      rate: await import("@/server/rate-limit"),
      errors: await import("@/server/errors"),
    };
    const { db, schema } = mod;
    await db.insert(schema.user).values([
      { id: A, name: "alice", email: "a@example.com" },
      { id: B, name: "bob", email: "b@example.com" },
    ]);
    await mod.seed.seedWorkspace(A);
    await mod.seed.seedWorkspace(B);
    const id = await mod.boards.getFirstBoardId(A);
    if (!id) throw new Error("seed failed");
    boardA = id;
  });

  afterAll(async () => {
    if (!hasDb) return;
    const { db, schema } = mod;
    await db.delete(schema.user).where(eq(schema.user.id, A));
    await db.delete(schema.user).where(eq(schema.user.id, B));
  });

  it("seeds a starter board with columns, tasks and a welcome note", async () => {
    const board = await mod.boards.getBoard(A, boardA);
    expect(board?.columns.map((c) => c.name)).toEqual(["Backlog", "To Do", "Doing", "Done"]);
    expect(board?.tasks.length).toBe(2);
    const notes = await mod.notes.listNotes(A, {});
    expect(notes[0]?.title).toBe("README.txt");
  });

  it("isolates boards between users", async () => {
    expect(await mod.boards.getBoard(B, boardA)).toBeNull();
    await expect(mod.boards.renameBoard(B, boardA, "pwned")).rejects.toBeInstanceOf(
      mod.errors.NotFoundError,
    );
    await expect(mod.boards.createColumn(B, boardA, "x")).rejects.toBeInstanceOf(
      mod.errors.NotFoundError,
    );
  });

  it("prevents creating tasks in another user's column", async () => {
    const board = await mod.boards.getBoard(A, boardA);
    const col = board?.columns[0];
    if (!col) throw new Error("no column");
    await expect(mod.tasks.createTask(B, { title: "x", columnId: col.id })).rejects.toBeInstanceOf(
      mod.errors.NotFoundError,
    );
  });

  it("rejects id reuse across users (idempotent create)", async () => {
    const t = await mod.tasks.createTask(A, {
      id: crypto.randomUUID(),
      boardId: boardA,
      title: "mine",
    });
    // Same id replayed by the owner returns the same task.
    expect((await mod.tasks.createTask(A, { id: t.id, boardId: boardA, title: "mine" })).id).toBe(
      t.id,
    );
    // Another user cannot claim it.
    await expect(mod.tasks.createTask(B, { id: t.id, title: "theirs" })).rejects.toBeInstanceOf(
      mod.errors.ActionError,
    );
    expect(await mod.tasks.getTask(B, t.id)).toBeNull();
  });

  it("moves tasks between neighbours and tracks completion via done columns", async () => {
    const board = await mod.boards.getBoard(A, boardA);
    const todo = board?.columns.find((c) => c.name === "To Do");
    const done = board?.columns.find((c) => c.isDone);
    if (!todo || !done) throw new Error("columns missing");

    const t1 = await mod.tasks.createTask(A, { columnId: todo.id, title: "one" });
    const t2 = await mod.tasks.createTask(A, { columnId: todo.id, title: "two" });
    const t3 = await mod.tasks.createTask(A, { columnId: todo.id, title: "three" });

    // Move "three" between "one" and "two".
    const moved = await mod.tasks.moveTask(A, {
      taskId: t3.id,
      columnId: todo.id,
      afterTaskId: t1.id,
      beforeTaskId: t2.id,
    });
    expect(moved.position > t1.position && moved.position < t2.position).toBe(true);

    const completed = await mod.tasks.moveTask(A, {
      taskId: t1.id,
      columnId: done.id,
      afterTaskId: null,
      beforeTaskId: null,
    });
    expect(completed.completedAt).not.toBeNull();

    const reopened = await mod.tasks.moveTask(A, {
      taskId: t1.id,
      columnId: todo.id,
      afterTaskId: null,
      beforeTaskId: null,
    });
    expect(reopened.completedAt).toBeNull();

    // B cannot move A's task, nor use A's tasks as neighbours.
    await expect(
      mod.tasks.moveTask(B, {
        taskId: t1.id,
        columnId: todo.id,
        afterTaskId: null,
        beforeTaskId: null,
      }),
    ).rejects.toBeInstanceOf(mod.errors.NotFoundError);
  });

  it("scopes subtasks, notes and focus sessions to their owner", async () => {
    const t = await mod.tasks.createTask(A, { boardId: boardA, title: "with subtasks" });
    const sub = await mod.tasks.createSubtask(A, { taskId: t.id, title: "step" });
    await expect(
      mod.tasks.updateSubtask(B, { subtaskId: sub.id, done: true }),
    ).rejects.toBeInstanceOf(mod.errors.NotFoundError);
    await expect(mod.tasks.createSubtask(B, { taskId: t.id, title: "x" })).rejects.toBeInstanceOf(
      mod.errors.NotFoundError,
    );

    const note = await mod.notes.createNote(A, {
      title: "secret plans",
      content: "pixel world domination",
    });
    expect(await mod.notes.getNote(B, note.id)).toBeNull();
    await expect(mod.notes.updateNote(B, { noteId: note.id, content: "x" })).rejects.toBeInstanceOf(
      mod.errors.NotFoundError,
    );
    // B can't link their note to A's task.
    await expect(mod.notes.createNote(B, { title: "x", taskId: t.id })).rejects.toBeInstanceOf(
      mod.errors.NotFoundError,
    );

    const now = Date.now();
    await expect(
      mod.focus.logFocusSession(B, {
        taskId: t.id,
        kind: "focus",
        startedAt: new Date(now - 60_000).toISOString(),
        endedAt: new Date(now).toISOString(),
      }),
    ).rejects.toBeInstanceOf(mod.errors.NotFoundError);
  });

  it("full-text search only returns the caller's rows", async () => {
    const hitsA = await mod.search.searchEverything(A, "domina");
    expect(hitsA.some((h) => h.title === "secret plans")).toBe(true);
    expect(hitsA[0]?.snippet).toContain("«");
    expect(await mod.search.searchEverything(B, "domina")).toEqual([]);
  });

  it("computes focus stats for 84 days and 8 weeks", async () => {
    const now = Date.now();
    await mod.focus.logFocusSession(A, {
      taskId: null,
      kind: "focus",
      startedAt: new Date(now - 25 * 60_000).toISOString(),
      endedAt: new Date(now).toISOString(),
    });
    const stats = await mod.focus.getFocusStats(A, "UTC");
    expect(stats.daily).toHaveLength(84);
    expect(stats.weekly).toHaveLength(8);
    expect(stats.totals.focusSeconds).toBeGreaterThanOrEqual(1500);
    expect(stats.totals.currentStreak).toBeGreaterThanOrEqual(1);
  });

  it("claims due reminders exactly once", async () => {
    const t = await mod.tasks.createTask(A, {
      boardId: boardA,
      title: "ping me",
      remindAt: new Date(Date.now() - 1000).toISOString(),
    });
    const first = await mod.push.claimDueReminders();
    expect(first.map((r) => r.taskId)).toContain(t.id);
    const second = await mod.push.claimDueReminders();
    expect(second.map((r) => r.taskId)).not.toContain(t.id);
    // Re-arming the reminder makes it deliverable again.
    await mod.tasks.updateTask(A, {
      taskId: t.id,
      remindAt: new Date(Date.now() - 500).toISOString(),
    });
    expect((await mod.push.claimDueReminders()).map((r) => r.taskId)).toContain(t.id);
  });

  it("enforces the Postgres-backed rate limiter", async () => {
    const key = `test:${crypto.randomUUID()}`;
    const results = [];
    for (let i = 0; i < 4; i++)
      results.push(await mod.rate.consumeRateLimit(key, { max: 3, windowSec: 60 }));
    expect(results).toEqual([true, true, true, false]);
  });

  it("refuses to delete the last board or last column", async () => {
    await expect(mod.boards.deleteBoard(A, boardA)).rejects.toThrow(/at least one board/);
    const created = await mod.boards.createBoard(A, "Temp");
    const temp = await mod.boards.getBoard(A, created.id);
    for (const col of temp?.columns.slice(1) ?? []) await mod.boards.deleteColumn(A, col.id);
    const last = temp?.columns[0];
    if (!last) throw new Error("no column");
    await expect(mod.boards.deleteColumn(A, last.id)).rejects.toThrow(/at least one column/);
    await mod.boards.deleteBoard(A, created.id);
  });
});
