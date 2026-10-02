import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { env } from "@/env";
import { jsonError } from "@/server/api";
import { dispatchDueReminders } from "@/server/push";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Sends due task reminders via Web Push. Call every minute from a scheduler
 * (Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically).
 */
async function handle(request: Request) {
  if (!authorized(request)) return jsonError(401, "Unauthorized");
  const result = await dispatchDueReminders();
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}

export { handle as GET, handle as POST };
