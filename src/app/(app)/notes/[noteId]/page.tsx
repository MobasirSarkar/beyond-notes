import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NoteEditor } from "@/components/notes/note-editor";
import { idSchema } from "@/lib/validation";
import { getNote } from "@/server/dal/notes";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Note" };

export default async function NotePage({ params }: PageProps<"/notes/[noteId]">) {
  const { noteId } = await params;
  if (!idSchema.safeParse(noteId).success) notFound();
  const user = await requireUser();
  const note = await getNote(user.id, noteId);
  if (!note) notFound();
  return <NoteEditor initial={note} />;
}
