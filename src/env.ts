import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validated, typed environment. Importing this module fails fast at boot when a
 * required variable is missing or malformed. Server-only values are never
 * exposed to the client bundle (enforced by `@t3-oss/env-nextjs`).
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.url().refine((u) => u.startsWith("postgres"), "Must be a Postgres URL"),
    BETTER_AUTH_SECRET: z.string().min(32, "Use at least 32 random characters"),
    BETTER_AUTH_URL: z.url(),
    GITHUB_CLIENT_ID: z.string().min(1).optional(),
    GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
    VAPID_PRIVATE_KEY: z.string().min(1).optional(),
    VAPID_SUBJECT: z
      .string()
      .regex(/^(mailto:|https:\/\/)/, "Must be a mailto: or https: URL")
      .optional(),
    CRON_SECRET: z.string().min(32).optional(),
  },
  client: {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env["NEXT_PUBLIC_VAPID_PUBLIC_KEY"],
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env["SKIP_ENV_VALIDATION"] === "1",
});
