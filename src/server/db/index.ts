import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";

import * as schema from "./schema";

/**
 * A single pooled client per server instance (reused across hot reloads in dev).
 * `prepare: false` keeps it compatible with PgBouncer/Neon pooled endpoints.
 */
const client =
  globalThis.__bnPgClient ??
  postgres(env.DATABASE_URL, {
    prepare: false,
    max: env.NODE_ENV === "production" ? 10 : 5,
    idle_timeout: 20,
    connect_timeout: 15,
  });

if (env.NODE_ENV !== "production") globalThis.__bnPgClient = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
