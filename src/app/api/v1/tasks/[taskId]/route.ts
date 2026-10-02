import { idSchema } from "@/lib/validation";
import { authedGet, jsonError } from "@/server/api";
import { getTask } from "@/server/dal/tasks";

export async function GET(request: Request, ctx: RouteContext<"/api/v1/tasks/[taskId]">) {
  const { taskId } = await ctx.params;
  if (!idSchema.safeParse(taskId).success) return jsonError(404, "Not found");
  return authedGet(null, ({ userId }) => getTask(userId, taskId))(request);
}
