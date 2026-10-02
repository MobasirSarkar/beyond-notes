import { NextResponse } from "next/server";

import { jsonError } from "@/server/api";
import { exportUserData } from "@/server/dal/export";
import { consumeRateLimit } from "@/server/rate-limit";
import { getSession } from "@/server/session";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, "Unauthorized");
  if (!(await consumeRateLimit(`export:${session.user.id}`, { max: 5, windowSec: 600 }))) {
    return jsonError(429, "Too many exports, try again later");
  }
  const data = await exportUserData(session.user.id);
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="beyond-notes-${stamp}.json"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
