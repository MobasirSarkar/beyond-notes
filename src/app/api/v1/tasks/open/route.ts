import { authedGet, noQuery } from "@/server/api";
import { listOpenTasks } from "@/server/dal/tasks";

export const GET = authedGet(noQuery, ({ userId }) => listOpenTasks(userId));
