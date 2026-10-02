import { noteListQuery } from "@/lib/schemas/input";
import { authedGet } from "@/server/api";
import { listNotes, listNoteTags } from "@/server/dal/notes";

export const GET = authedGet(noteListQuery, async ({ userId, query }) => {
  const [notes, tags] = await Promise.all([
    listNotes(userId, { q: query.q, tag: query.tag, archived: query.archived === "true" }),
    listNoteTags(userId),
  ]);
  return { notes, tags };
});
