import "server-only";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";

import { ActionError } from "./errors";
import { consumeRateLimit } from "./rate-limit";
import { getSession } from "./session";

export { ActionError, NotFoundError } from "./errors";

const baseClient = createSafeActionClient({
  defineMetadataSchema: () => z.object({ name: z.string().min(1) }),
  handleServerError(error, { metadata }) {
    if (error instanceof ActionError) return error.message;
    console.error(`[action:${metadata.name}]`, error);
    return "Something went wrong. Please try again.";
  },
});

/**
 * Authenticated action client. Every mutation runs through this:
 *  - resolves the user from the server-side session (never from client input)
 *  - applies a per-user write rate limit backed by Postgres
 */
export const authedAction = baseClient.use(async ({ next, metadata }) => {
  const session = await getSession();
  if (!session) throw new ActionError("You must be signed in.");

  const allowed = await consumeRateLimit(`action:${session.user.id}`, { max: 240, windowSec: 60 });
  if (!allowed) throw new ActionError("Too many requests. Slow down a little.");

  return next({ ctx: { userId: session.user.id, action: metadata.name } });
});
