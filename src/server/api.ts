import "server-only";

import { NextResponse } from "next/server";
import type { z } from "zod";

import { consumeRateLimit } from "./rate-limit";
import { getSession } from "./session";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" } as const;

export function jsonError(status: number, error: string): NextResponse {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

/**
 * Wraps a read endpoint: authenticates from the session cookie, rate limits per
 * user, validates query params and never leaks internal error details.
 */
export function authedGet<S extends z.ZodType, T>(
  querySchema: S | null,
  handler: (args: { userId: string; query: z.infer<S>; request: Request }) => Promise<T>,
) {
  return async (request: Request): Promise<NextResponse> => {
    const session = await getSession();
    if (!session) return jsonError(401, "Unauthorized");

    if (!(await consumeRateLimit(`read:${session.user.id}`, { max: 600, windowSec: 60 }))) {
      return jsonError(429, "Too many requests");
    }

    let query: z.infer<S> = undefined as z.infer<S>;
    if (querySchema) {
      const params = Object.fromEntries(new URL(request.url).searchParams);
      const parsed = querySchema.safeParse(params);
      if (!parsed.success) return jsonError(400, "Invalid query");
      query = parsed.data;
    }

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
