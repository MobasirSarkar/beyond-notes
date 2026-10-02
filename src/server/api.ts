import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { consumeRateLimit } from "./rate-limit";
import { getSession } from "./session";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" } as const;

export function jsonError(status: number, error: string): NextResponse {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

/** Use for endpoints without query parameters (unknown params are stripped). */
export const noQuery = z.object({});

/**
 * Wraps a read endpoint: authenticates from the session cookie, rate limits per
 * user, validates query params and never leaks internal error details.
 */
export function authedGet<S extends z.ZodType, T>(
  querySchema: S,
  handler: (args: { userId: string; query: z.infer<S>; request: Request }) => Promise<T>,
) {
  return async (request: Request): Promise<NextResponse> => {
    const session = await getSession();
    if (!session) return jsonError(401, "Unauthorized");

    if (!(await consumeRateLimit(`read:${session.user.id}`, { max: 600, windowSec: 60 }))) {
      return jsonError(429, "Too many requests");
    }

    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return jsonError(400, "Invalid query");
    const query = parsed.data;

    try {
      const data = await handler({ userId: session.user.id, query, request });
      if (data === null) return jsonError(404, "Not found");
      return NextResponse.json(data, { headers: NO_STORE });
    } catch (error) {
      console.error("[api]", request.url, error);
      return jsonError(500, "Internal error");
    }
  };
}
