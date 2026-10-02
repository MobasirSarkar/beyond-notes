# Beyond

A calm, offline-capable **task & notes workspace** that floats over a live, procedurally generated
spiral galaxy. Kanban boards, Markdown notes, voice capture with natural-language parsing, calendar +
push reminders, a focus timer with stats, a command palette and keyboard-first navigation — animated
with **anime.js**, **GSAP** and **Motion**, rendered in monochrome with frosted-glass panels.

## Features

| Area          | What you get                                                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kanban**    | Multiple boards, columns with WIP limits and "done" semantics, drag & drop with mouse, touch **and keyboard** (Space to lift, arrows to move), labels, priorities, subtasks, due dates, filters, optimistic updates |
| **Notes**     | Markdown with live split preview (GFM, sanitised), autosave, tags, pinning, archive, link to a task, Postgres full-text search                                                                                      |
| **Voice**     | Web Speech API dictation into notes/descriptions; voice quick-capture parses _"remind me to fix login tomorrow 5pm urgent #auth"_ into title, due date, reminder, priority and tags                                 |
| **Calendar**  | Month grid, drag tasks between days to reschedule, per-day quick add                                                                                                                                                |
| **Reminders** | In-app toasts while open + **Web Push** (VAPID) when closed, via an idempotent cron endpoint                                                                                                                        |
| **Focus**     | Pomodoro timer on an orbital dial with Geist Pixel digits, task attribution, survives reloads, soft chimes, notifications                                                                                           |
| **Stats**     | Focus "star chart" heatmap (12 weeks), completed-per-week chart, streaks, top tasks, table view                                                                                                                     |
| **Palette**   | `⌘K` command palette with full-text search across tasks & notes, actions and navigation; `?` shows all shortcuts                                                                                                    |
| **PWA**       | Installable, service worker (Serwist), offline fallback, IndexedDB-persisted query cache, **offline mutation queue** replayed on reconnect                                                                          |
| **Themes**    | Deep-space dark / star-chart light (or follow the OS); full reduced-motion support covering WebGL, GSAP, anime.js and Motion                                                                                        |

## Stack

- **Next.js 16.3** (App Router, Turbopack, React Compiler, typed routes, `proxy.ts`) · **React 19.3**
- **TypeScript 7** (native compiler) in the strictest practical mode (`strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, …)
- **Tailwind CSS 4** (CSS-first theme tokens)
- **Postgres** (Neon in production) via **Drizzle ORM** + `postgres.js`
- **better-auth** (email/password, optional GitHub OAuth, DB sessions, DB-backed rate limiting)
- **next-safe-action** + **Zod 4** for typed, validated server actions; Zod DTOs validate API responses on the client too
- **TanStack Query** (optimistic updates, IndexedDB persistence, resumable offline mutations)
- **Rendering & animation**: a hand-written **WebGL** galaxy (GLSL point sprites, GPU rotation, dust
  absorption pass); anime.js 4 (galaxy intro + frame loop, clock digits, waveform, chart reveals, star
  bursts, calendar stagger); GSAP (`SplitText` heading reveals, `useGSAP`); Motion (layout/presence,
  drawers, sheets)
- **dnd-kit**, **cmdk**, **chrono-node**, **react-markdown + rehype-sanitize**, **Serwist**, **web-push**
- Tooling: **pnpm 12**, **Oxlint** (type-aware, built on TypeScript 7), **Prettier**, **Vitest 5**, **Playwright**

## Getting started

```bash
corepack enable            # or: npm i -g pnpm@12
pnpm install
cp .env.example .env.local # then fill it in (see below)
pnpm db:migrate            # applies ./drizzle migrations to DATABASE_URL
pnpm dev                   # http://localhost:3000
```

### Environment

| Variable                                                               | Required | Notes                                                         |
| ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------- |
| `DATABASE_URL`                                                         | yes      | Postgres URL. Neon's **pooled** URL works (`sslmode=require`) |
| `BETTER_AUTH_SECRET`                                                   | yes      | ≥ 32 random chars (`openssl rand -base64 48`)                 |
| `BETTER_AUTH_URL`                                                      | yes      | Public origin, e.g. `https://notes.example.com`               |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`                            | no       | Enables "Continue with GitHub"                                |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | no       | Web Push reminders — generate with `pnpm vapid`               |
| `CRON_SECRET`                                                          | no       | Protects `/api/cron/reminders` (≥ 32 chars)                   |

Env vars are validated at boot (`src/env.ts`); the app refuses to start with a malformed config.
**Never commit `.env.local`** — it is git-ignored.

### Reminders cron

`GET /api/cron/reminders` with `Authorization: Bearer $CRON_SECRET` claims due reminders atomically
(`FOR UPDATE SKIP LOCKED`, so concurrent runs never double-send), pushes them to every subscribed device
and prunes expired subscriptions. `vercel.json` schedules it every minute (per-minute crons need a paid
Vercel plan; any external scheduler hitting the URL works too).

## Docker

A multi-stage `Dockerfile` builds a small, hardened production image from Next.js's
[standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output), plus a
separate one-shot image that applies database migrations.

```bash
cp .env.example .env               # set BETTER_AUTH_SECRET (openssl rand -base64 48)
docker compose up --build          # Postgres → migrations → app on http://localhost:3000
```

| Image / target                      | What it is                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `runner` (default) — `beyond-notes` | `node server.js` from the standalone bundle (~97 MB compressed)                        |
| `migrator` — `beyond-notes-migrate` | Applies `./drizzle` migrations, then exits; a single bundled script, no `node_modules` |

**How it's built**

- **Stages:** `deps` (pnpm install from the lockfile only, cached) → `builder` (`next build`) →
  `runner`; `deps` → `migrate-build` (esbuild bundle) → `migrator`. One Debian (glibc) base for every
  stage, so native modules always match the libc they run on. Override it with
  `--build-arg NODE_IMAGE=…` for an internal mirror or a base with a corporate CA.
- **Reproducible:** pnpm comes from `packageManager` via Corepack; `--frozen-lockfile`; BuildKit cache
  mounts for the pnpm store.
- **No secrets in the image:** env files never enter the build context (`.dockerignore`), secrets are
  runtime-only, and env validation is skipped only for the build. The build's auth initialisation gets a
  throwaway random secret inline on that one `RUN`, so it isn't kept in any layer or the image config.
  Only `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is a build argument, because it is inlined into the client bundle.
- **Least privilege at runtime:** runs as the unprivileged `node` user; app files are root-owned and
  read-only, and only `.next/cache` is writable. Compose adds a read-only root filesystem, tmpfs mounts,
  `cap_drop: [ALL]`, `no-new-privileges` and an init process for clean signal handling.
- **Health:** `GET /api/health` (liveness, used by the image `HEALTHCHECK`) and
  `GET /api/health?ready=1` (readiness: also pings the database, `503` when it can't).

**With a managed database (e.g. Neon)** — run the two images directly:

```bash
docker build -t beyond-notes .
docker build -t beyond-notes-migrate --target migrator .
docker run --rm -e DATABASE_URL="$NEON_URL" beyond-notes-migrate
docker run -d --init --read-only --tmpfs /tmp --tmpfs /app/.next/cache:uid=1000,gid=1000 \
  --cap-drop ALL --security-opt no-new-privileges -p 3000:3000 \
  -e DATABASE_URL="$NEON_URL" -e BETTER_AUTH_SECRET="$SECRET" \
  -e BETTER_AUTH_URL=https://notes.example.com beyond-notes
```

In Compose, set `DOCKER_DATABASE_URL` in `.env` instead (it is kept separate from `DATABASE_URL`,
so a host-side `.env` pointing at `localhost` never leaks into containers). CI builds both images and
smoke-tests the container's health endpoint on every push.

## Scripts

| Script                            | Purpose                                                                  |
| --------------------------------- | ------------------------------------------------------------------------ |
| `pnpm dev` / `build` / `start`    | Next.js                                                                  |
| `pnpm typecheck`                  | `next typegen` + `tsc` (TypeScript 7)                                    |
| `pnpm lint`                       | Oxlint, type-aware, warnings are errors                                  |
| `pnpm format` / `format:check`    | Prettier (+ Tailwind class sorting)                                      |
| `pnpm test`                       | Vitest unit tests (+ DB integration tests if `TEST_DATABASE_URL` is set) |
| `pnpm test:e2e`                   | Playwright against a production build                                    |
| `pnpm db:generate` / `db:migrate` | Drizzle migrations                                                       |
| `pnpm vapid`                      | Generate VAPID keys                                                      |

Integration tests **drop and recreate** the schema of `TEST_DATABASE_URL` — point it at a throwaway database,
never at production.

## Design system

- **Deep space, in monochrome.** The backdrop is a procedurally generated grand-design spiral
  (`src/lib/cosmos/*`): ~40k particles — disk and arm stars, a bulge, nebula clouds, dust lanes and
  spiked field stars — rotating differentially on the GPU. Light is built additively and dust absorbs
  it in a second pass, so lanes darken the arms rather than the sky; light mode renders the same
  galaxy as a negative plate. The camera dollies in on load, follows the pointer with eased parallax
  and, on the landing page, tips edge-on as you scroll. It pauses when hidden, draws a single still
  frame under reduced motion, and can be switched off in settings or the palette.
- **Glass over the galaxy.** Panels are frosted glass (`glass`, `glass-strong`): translucent fills,
  a lit top edge and soft depth; cards and inputs sit on them as `lift` surfaces. A floating dock
  holds the six windows (press `1`–`6`), the running focus timer, sync state and a clock.
- **Tokens only.** Every color, border width, radius, blur, shadow, layout size, duration and
  z-index is a CSS variable in `src/app/globals.css` (`--bg`, `--panel`, `--card`, `--line`,
  `--highlight`, `--radius-card`, `--blur`, `--dock-space`, `--dur-2`, `--z-overlay`, …). Tailwind's
  default palette is removed (`--color-*: initial`), so utilities can only use tokens.
- **rem everywhere.** Spacing, type scale, borders (`--bw: 0.0625rem`), radii and layout are rem/clamp
  based; Tailwind's px border utilities are replaced by `hairline`, `rule-{t,b,l,r}`, `edge-{l,b}`.
- **Emphasis without color.** Priority is a four-bar signal mark, urgency a soft glow, overdue an
  inverted chip, heatmap levels are stars of increasing size and brightness.
- **Typography.** One type system, expressed as roles in `globals.css` — components pick a role,
  never an ad-hoc mix of font, size, weight and tracking:

  | Role              | Font                  | Use                                        |
  | ----------------- | --------------------- | ------------------------------------------ |
  | `type-hero`       | Geist Pixel           | Landing wordmark                           |
  | `type-display`    | Geist Pixel           | Standalone screens (404, error, offline)   |
  | `type-title`      | Geist Pixel           | Page titles (h1), stat values, note titles |
  | `type-heading`    | Geist Pixel           | Sheet / dialog titles, feature cards       |
  | `type-subheading` | Geist Sans 600        | Panel, column and section headings         |
  | `type-overline`   | Geist Mono, uppercase | Eyebrows, table and group headers          |
  | `type-label`      | Geist Sans 500        | Form field labels                          |
  | `type-caption`    | Geist Sans            | Hints and secondary metadata               |
  | `type-numeric`    | Geist Mono, tabular   | Clocks, counts, ids, keys                  |

  Geist Pixel is reserved for title-level sizes, where it renders crisply; below ~20px headings use
  Geist Sans. The type scale (`--text-2xs` … `--text-3xl`, plus fluid `--text-title`, `--text-display`,
  `--text-hero`) and per-role tracking are tokens. Headings use `text-wrap: balance`, running text
  `text-wrap: pretty`, Markdown sits on a 68ch measure, and figures are tabular.

- **Copy.** Sentence case everywhere — titles, buttons, labels, menus, placeholders and toasts; proper
  nouns keep their capitals (GitHub, JSON, WIP). Overlines are uppercased by CSS so the source stays
  readable for screen readers. Full sentences end with a period, fragments don't; ellipses mark
  progress ("Saving…") and actions that ask for more ("Delete column…"). Only the lowercase
  **beyond** wordmark is exempt (`type-wordmark`).
- **Hierarchy.** Every page uses `PageHeader` (eyebrow → title → description → actions) inside the
  shared `page` container; content is grouped with `Frame`, `Rule` and `SettingRow`.

## Architecture

```
src/
  app/                    routes only (thin pages that compose feature components)
  components/
    ui/                   reusable primitives: Button, Input, Field, Frame, Modal, Menu, Segmented,
                          Checkbox, Progress, Spinner, Tag, Kbd, Stat, Rule, PageHeader, Icon,
                          PriorityMark, RevealText, Cosmos + CosmosBackdrop (WebGL galaxy)…
    layout/               app shell: TopBar, StatusLine (floating dock), Overlays (lazy), Hotkeys
    features/<feature>/   kanban, notes, voice, palette, calendar, focus, stats, settings, auth, landing, pwa
    providers/            root + app (query cache) providers
  hooks/                  use-hotkeys, use-speech-recognition, use-reduced-motion, use-latch, use-clock…
  lib/
    api/                  fetch client, query keys, queries, optimistic mutations, query client
    schemas/              Zod schemas (inputs, DTOs, prefs) — runtime validation, shared with the server
    stores/               tiny typed external stores: ui, prefs, focus timer (selector subscriptions)
    utils/                pure helpers: position, nl-parse, format, safe-redirect, markdown, cn…
    constants/            nav windows, shortcuts, priority ranks, chrome colors
    cosmos/               galaxy generator, GLSL shaders and the WebGL renderer
    browser/              platform, sound, local data wipe
    animation/            GSAP + SplitText registration
  types/                  all shared TypeScript types (DTOs/inputs inferred from Zod, UI, prefs, focus,
                          kanban, API) + ambient DOM typings (Speech API, install prompt)
  server/                 server-only: db, auth, data-access layer, actions, rate limiting, push
  proxy.ts                per-request CSP nonce + optimistic auth redirect
```

**Reads** go through `GET /api/v1/*` (cached by TanStack Query and persisted to IndexedDB for offline use);
**writes** go through server actions with optimistic updates. Mutations are registered as query-client defaults
so ones made offline are persisted and replayed on reconnect; creates carry client-generated UUIDs so a replay
is idempotent. Ordering uses **fractional indexing** compared with `COLLATE "C"`; the server computes the new
key from neighbour ids, so clients never send raw positions.

### Type safety & efficiency

- No `any`, and type assertions are lint errors (`no-unsafe-type-assertion`). JSON boundaries are parsed with
  Zod, DOM gaps are filled with ambient declarations, narrowing uses type guards.
- UI state lives in selector-based stores (`useSyncExternalStore`), so opening the palette or ticking the
  timer only re-renders the components that read that slice.
- The command palette, capture dialog, shortcut help, task sheet and Markdown renderer are code-split and
  prefetched when the browser is idle.
- The focus timer is a single app-wide store: it keeps running across pages, survives reloads and shows in
  the status line; the clock re-renders once per second only while running.
- Animations pause off-screen/hidden (landing field) and every library honours reduced motion.

## Security

- **AuthN**: better-auth with DB sessions, `httpOnly` + `SameSite=Lax` (+ `Secure` in prod) cookies, password
  length policy, rate-limited sign-in (5/min) and sign-up (5/h) per IP, CSRF/trusted-origin checks; sign-in
  errors never reveal whether an account exists.
- **AuthZ**: a data-access layer derives `userId` from the server session only. Every query filters by owner,
  and child rows (columns, neighbours, subtasks, linked tasks) are re-verified before writes. Integration tests
  assert user B can't read or mutate user A's data even with valid ids.
- **Validation**: Zod on every action, route param and query string, with length/size caps; DTOs re-validated
  on the client.
- **Headers**: nonce-based CSP with `strict-dynamic` (no `unsafe-inline` scripts), `frame-ancestors 'none'`,
  HSTS, `nosniff`, `Referrer-Policy`, COOP/CORP, `Permissions-Policy` (microphone limited to self), no
  `X-Powered-By`.
- **XSS**: Markdown is sanitised with `rehype-sanitize`; search highlights use sentinels rendered as React
  nodes. The only raw HTML is a static theme bootstrap constant (lint-enforced elsewhere).
- **Abuse**: Postgres-backed rate limits for actions (240/min), reads (600/min) and exports; constant-time cron
  secret comparison; open-redirect-safe `?next=`; push endpoints must be HTTPS.
- **Privacy on shared devices**: sign-out wipes the IndexedDB cache, queued mutations and service-worker
  runtime caches; personal API JSON is never stored in Cache Storage.
- **Supply chain**: lockfile, `pnpm audit` in CI (production deps clean; a patched `browserslist` is forced via
  overrides), and pnpm 12's default minimum release age, which holds back packages published in the last
  24 hours.

## Testing

- `tests/unit` — NL parser, fractional ordering, open-redirect guard, tsquery sanitising, validation, streaks
- `tests/integration` — DAL against real Postgres: tenant isolation, ordering, completion, FTS, stats,
  reminder claiming, rate limiting
- `tests/e2e` — Playwright: headers/CSP, API protection, sign-up, inline NL task, keyboard drag & drop,
  task drawer, quick capture, palette search, note autosave, calendar/focus/stats, export, sign-out

## Notes on versions

- **TypeScript 7** is the native (Go) compiler, so it has no JS compiler API yet and `typescript-eslint` can't
  use it. Linting therefore uses **Oxlint**'s type-aware mode (`oxlint-tsgolint`, built on TypeScript 7).
- pnpm 12's default minimum release age is kept on purpose, so packages published in the last day (for
  example `motion@14.0.0` at the time of writing) resolve to the newest version that is at least 24 hours
  old.
- One _moderate_ advisory remains in a **dev-only** transitive dependency (`esbuild` inside drizzle-kit's
  legacy loader; it affects esbuild's dev `serve` feature, which isn't used).
