import { idSchema } from "@/lib/validation";
import { authedGet, jsonError } from "@/server/api";
import { getBoard } from "@/server/dal/boards";

export async function GET(request: Request, ctx: RouteContext<"/api/v1/boards/[boardId]">) {
  const { boardId } = await ctx.params;
  if (!idSchema.safeParse(boardId).success) return jsonError(404, "Not found");
  return authedGet(null, ({ userId }) => getBoard(userId, boardId))(request);
}
