import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BoardView } from "@/components/features/kanban/board-view";
import { idSchema } from "@/lib/schemas/input";
import { getBoard } from "@/server/dal/boards";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Board" };

export default async function BoardPage({ params }: PageProps<"/boards/[boardId]">) {
  const { boardId } = await params;
  if (!idSchema.safeParse(boardId).success) notFound();
  const user = await requireUser();
  const board = await getBoard(user.id, boardId);
  if (!board) notFound();
  return <BoardView initial={board} />;
}
