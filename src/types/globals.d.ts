import type { Sql } from "postgres";

declare global {
  /** Reused Postgres client across dev hot-reloads (see `src/server/db`). */
  var __bnPgClient: Sql | undefined;
}
