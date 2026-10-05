import "server-only";

import { and, arrayContains, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import type { NoteDto, NoteSummaryDto } from "@/types/dto";
import type { CreateNoteData, UpdateNoteData } from "@/types/input";

import { db } from "../db";
import { note, task } from "../db/schema";
import { ActionError, NotFoundError } from "../errors";
import { definedOnly, iso, toPrefixTsQuery } from "./util";

type NoteRow = typeof note.$inferSelect;

const toNoteDto = (n: NoteRow): NoteDto => ({
  id: n.id,
  title: n.title,
  content: n.content,
  tags: n.tags,
  pinned: n.pinned,
  archived: n.archivedAt !== null,
  taskId: n.taskId,
  createdAt: iso(n.createdAt),
  updatedAt: iso(n.updatedAt),
});

export async function listNotes(
  userId: string,
  opts: { q?: string | undefined; tag?: string | undefined; archived?: boolean | undefined },
): Promise<NoteSummaryDto[]> {
  const tsq = opts.q ? toPrefixTsQuery(opts.q) : null;
  const where = and(
    eq(note.userId, userId),
    opts.archived ? isNotNull(note.archivedAt) : isNull(note.archivedAt),
    opts.tag ? arrayContains(note.tags, [opts.tag]) : undefined,
    tsq ? sql`${note.search} @@ to_tsquery('simple', ${tsq})` : undefined,
  );

  const rows = await db
    .select({
      id: note.id,
      title: note.title,
      excerpt: sql<string>`left(${note.content}, 280)`,
      tags: note.tags,
      pinned: note.pinned,
      archivedAt: note.archivedAt,
      updatedAt: note.updatedAt,
    })
    .from(note)
    .where(where)
    .orderBy(
      ...(tsq ? [desc(sql`ts_rank(${note.search}, to_tsquery('simple', ${tsq}))`)] : []),
      desc(note.pinned),
      desc(note.updatedAt),
    )
    .limit(300);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    tags: r.tags,
    pinned: r.pinned,
    archived: r.archivedAt !== null,
    updatedAt: iso(r.updatedAt),
  }));
}

export async function listNoteTags(userId: string): Promise<{ tag: string; count: number }[]> {
  const rows = await db.execute<{ tag: string; count: number }>(sql`
    select t.tag, count(*)::int as count
    from ${note}, unnest(${note.tags}) as t(tag)
    where ${note.userId} = ${userId} and ${note.archivedAt} is null
    group by t.tag order by count desc, t.tag asc limit 100
  `);
  return [...rows.rows];
}

export async function getNote(userId: string, noteId: string): Promise<NoteDto | null> {
  const [n] = await db
    .select()
    .from(note)
    .where(and(eq(note.id, noteId), eq(note.userId, userId)));
  return n ? toNoteDto(n) : null;
}

async function assertTaskOwned(userId: string, taskId: string | null | undefined) {
  if (!taskId) return;
  const [t] = await db
    .select({ id: task.id })
    .from(task)
    .where(and(eq(task.id, taskId), eq(task.userId, userId)));
  if (!t) throw new NotFoundError("Task");
}

export async function createNote(userId: string, input: CreateNoteData): Promise<NoteDto> {
  await assertTaskOwned(userId, input.taskId);
  if (input.id) {
    const [existing] = await db.select().from(note).where(eq(note.id, input.id));
    if (existing) {
      if (existing.userId !== userId) throw new ActionError("Invalid id");
      return toNoteDto(existing);
    }
  }
  const [created] = await db
    .insert(note)
    .values({
      ...(input.id ? { id: input.id } : {}),
      userId,
      title: input.title ?? "",
      content: input.content ?? "",
      tags: input.tags ?? [],
      taskId: input.taskId ?? null,
    })
    .returning();
  if (!created) throw new ActionError("Could not create note");
  return toNoteDto(created);
}

export async function updateNote(userId: string, input: UpdateNoteData): Promise<NoteDto> {
  const { noteId, archived, taskId, ...rest } = input;
  await assertTaskOwned(userId, taskId);
  const [updated] = await db
    .update(note)
    .set({
      ...definedOnly(rest),
      ...(taskId !== undefined ? { taskId } : {}),
      ...(archived !== undefined ? { archivedAt: archived ? new Date() : null } : {}),
    })
    .where(and(eq(note.id, noteId), eq(note.userId, userId)))
    .returning();
  if (!updated) throw new NotFoundError("Note");
  return toNoteDto(updated);
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const res = await db
    .delete(note)
    .where(and(eq(note.id, noteId), eq(note.userId, userId)))
    .returning({ id: note.id });
  if (res.length === 0) throw new NotFoundError("Note");
}
