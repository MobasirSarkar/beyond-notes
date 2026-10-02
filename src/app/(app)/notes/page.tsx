import type { Metadata } from "next";

import { NotesList } from "@/components/features/notes/notes-list";

export const metadata: Metadata = { title: "Notes" };

export default function NotesPage() {
  return <NotesList />;
}
