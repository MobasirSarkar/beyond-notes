import { idSchema } from "@/lib/schemas/input";
import { authedGet, jsonError, noQuery } from "@/server/api";
import { getNote } from "@/server/dal/notes";

export async function GET(request: Request, ctx: RouteContext<"/api/v1/notes/[noteId]">) {
  const { noteId } = await ctx.params;
  if (!idSchema.safeParse(noteId).success) return jsonError(404, "Not found");
  return authedGet(noQuery, ({ userId }) => getNote(userId, noteId))(request);
}
