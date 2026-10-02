import { calendarQuery } from "@/lib/validation";
import { authedGet } from "@/server/api";
import { listCalendarTasks } from "@/server/dal/tasks";

export const GET = authedGet(calendarQuery, ({ userId, query }) =>
  listCalendarTasks(userId, new Date(query.from), new Date(query.to)),
);
