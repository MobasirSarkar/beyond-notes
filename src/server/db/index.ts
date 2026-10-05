import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { env } from "@/env";

import * as schema from "./schema";

declare global {
  var __bnPgPool: Pool | undefined;
}

/**
 * A pooled WebSocket client per server instance (reused across hot reloads in dev).
 * Compatible with Cloudflare Workers (workerd), Node.js, and Neon serverless.
 */
const pool =
  globalThis.__bnPgPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: env.NODE_ENV === "production" ? 10 : 5,
  });

if (env.NODE_ENV !== "production") globalThis.__bnPgPool = pool;

export const db = drizzle(pool, { schema, casing: "snake_case" });

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
