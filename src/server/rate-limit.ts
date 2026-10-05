import "server-only";

import { sql } from "drizzle-orm";

import { db } from "./db";

/**
 * Fixed-window rate limiter stored in the shared `rate_limit` table, so limits
 * hold across serverless instances. A single atomic upsert per call.
 * Returns `true` when the request is allowed.
 */
export async function consumeRateLimit(
  key: string,
  { max, windowSec }: { max: number; windowSec: number },
): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowSec * 1000;
  const rows = await db.execute<{ count: number }>(sql`
    insert into rate_limit (id, key, count, last_request)
    values (${crypto.randomUUID()}, ${key}, 1, ${now})
    on conflict (key) do update set
      count = case when rate_limit.last_request < ${windowStart} then 1 else rate_limit.count + 1 end,
      last_request = case when rate_limit.last_request < ${windowStart} then ${now} else rate_limit.last_request end
    returning count
  `);
  const count = rows.rows[0]?.count ?? 0;
  return count <= max;
}
