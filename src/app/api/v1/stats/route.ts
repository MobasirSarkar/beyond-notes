import { z } from "zod";

import { authedGet } from "@/server/api";
import { getFocusStats } from "@/server/dal/focus";
import { isValidTimeZone } from "@/server/dal/util";

const statsQuery = z.object({
  tz: z.string().max(64).refine(isValidTimeZone, "Invalid time zone").default("UTC"),
});

export const GET = authedGet(statsQuery, ({ userId, query }) => getFocusStats(userId, query.tz));
