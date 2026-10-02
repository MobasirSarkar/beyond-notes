import { redirect } from "next/navigation";

import { getFirstBoardId } from "@/server/dal/boards";
import { requireUser } from "@/server/session";

export default async function BoardsIndex() {
  const user = await requireUser();
  const id = await getFirstBoardId(user.id);
  if (!id) redirect("/settings");
  redirect(`/boards/${id}`);
}
