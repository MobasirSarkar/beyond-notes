import { authedGet } from "@/server/api";
import { listOpenTasks } from "@/server/dal/tasks";

export const GET = authedGet(null, ({ userId }) => listOpenTasks(userId));
