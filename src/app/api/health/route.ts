import { sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/server/db";

export const dynamic = "force-dynamic";

const READY_TIMEOUT_MS = 2_000;

/**
 * Health probe for containers and load balancers.
 * - `GET /api/health`: liveness — the server process answers.
 * - `GET /api/health?ready=1`: readiness — the database answers too.
 * Never exposes internals; failures report only which check failed.
 */
export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (!request.nextUrl.searchParams.has("ready")) {
    return NextResponse.json({ status: "ok" }, { headers });
  }
  try {
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), READY_TIMEOUT_MS)),
    ]);
    return NextResponse.json({ status: "ok", database: "ok" }, { headers });
  } catch {
    return NextResponse.json(
      { status: "error", database: "unavailable" },
      { status: 503, headers },
    );
  }
}
