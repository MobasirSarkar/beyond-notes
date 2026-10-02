// Applies the SQL migrations in ./drizzle without drizzle-kit (a dev
// dependency). The Docker `migrator` image runs it bundled (`pnpm
// build:migrate` → dist/migrate.mjs), so it needs no node_modules.
// Usage: DATABASE_URL=postgres://… node scripts/migrate.mjs
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

// One connection, no prepared statements (works through PgBouncer / Neon pooler).
const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  await migrate(drizzle(client), {
    migrationsFolder: new URL("../drizzle", import.meta.url).pathname,
  });
  console.log("Migrations applied");
} catch (error) {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}
