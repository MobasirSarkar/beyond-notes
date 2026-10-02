# syntax=docker/dockerfile:1.7
#
# Production image for Beyond (Next.js standalone output).
#
#   docker build -t beyond-notes .                     # app (default target)
#   docker build -t beyond-notes-migrate --target migrator .
#
# Stages: base → deps → builder → runner, plus deps → migrate-build → migrator.
# One Debian (glibc) base everywhere, so native modules built in one stage
# (sharp, lightningcss, swc) always match the libc they run on.

# Override to pull from an internal mirror, or a base with a corporate CA.
ARG NODE_IMAGE=node:24-slim

# ---------------------------------------------------------------- base -----
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# pnpm at the exact version pinned in package.json ("packageManager").
RUN corepack enable
WORKDIR /app

# ---------------------------------------------------------------- deps -----
# Only the manifests, so this layer is reused until dependencies change.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ------------------------------------------------------------- builder -----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Public values are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
# Secrets are runtime-only: they never enter the image. Env validation is
# skipped for the build and enforced when the server starts.
ENV NODE_ENV=production \
    NEXT_OUTPUT=standalone \
    SKIP_ENV_VALIDATION=1 \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=${NEXT_PUBLIC_VAPID_PUBLIC_KEY}
# Next imports route modules while collecting page data, which initialises
# auth; give that step a throwaway secret inline (never an ENV, so it isn't
# kept in any layer or in the image config). Real values come at runtime.
RUN BETTER_AUTH_SECRET="$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")" \
    BETTER_AUTH_URL=http://localhost:3000 \
    pnpm build

# ------------------------------------------------------- migrate-build -----
# The migration runner bundled with its only dependencies (drizzle-orm,
# postgres) into one file, so the migrator image needs no node_modules.
FROM deps AS migrate-build
COPY scripts/migrate.mjs ./scripts/migrate.mjs
RUN pnpm build:migrate

# ------------------------------------------------------------ migrator -----
# One-shot job: applies ./drizzle migrations, then exits.
FROM ${NODE_IMAGE} AS migrator
ENV NODE_ENV=production
WORKDIR /app
COPY drizzle ./drizzle
COPY --from=migrate-build /app/dist/migrate.mjs ./dist/migrate.mjs
USER node
CMD ["node", "dist/migrate.mjs"]

# -------------------------------------------------------------- runner -----
FROM ${NODE_IMAGE} AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# App files are owned by root and read-only for the runtime user; only the
# Next.js cache directory is writable (mount a tmpfs there with --read-only).
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p .next/cache && chown node:node .next/cache

USER node
EXPOSE 3000

# Liveness only (no database round-trip): see /api/health?ready=1 for readiness.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

# Run with an init process (`docker run --init`, or `init: true` in Compose)
# so signals are forwarded and the server shuts down cleanly.
CMD ["node", "server.js"]
