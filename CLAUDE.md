# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
yarn dev          # Start dev server (http://localhost:3000)
yarn build        # Production build
yarn start        # Start production server
yarn lint         # Run ESLint
yarn db:generate  # Generate Drizzle migrations from schema
yarn db:migrate   # Apply migrations to the database
yarn db:studio    # Open Drizzle Studio
```

No test framework is configured.

## Deployment

Build and run the Docker container on the VPS using `scripts/docker-run.sh`. The SQLite database is persisted at `/var/lib/tickets-for-teachers` on the host.

## Stack

- **Next.js 16.2.4** — App Router. This is a new major version with breaking changes from prior versions. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code.
- **React 19.2.4**
- **TypeScript**
- **Tailwind CSS v4** — Uses `@import "tailwindcss"` syntax (not `@tailwind` directives). Theme customization uses `@theme {}` blocks in CSS, not `tailwind.config.js`.
- **DaisyUI v5** — Loaded via `@plugin "daisyui"` in `app/globals.css`. Theme customization uses `@plugin "daisyui/theme" {}` blocks.
- **Drizzle ORM** — SQLite via `better-sqlite3`. Schema in `lib/schema.ts`, config in `drizzle.config.ts`. Migrations output to `drizzle/`.
- **Lucia v3** — Session-based auth via `@lucia-auth/adapter-sqlite`. Initialized in `lib/auth.ts`.
- **bcrypt** — Password hashing.

## Project Structure

```
app/            # Next.js App Router pages and layouts
lib/
  db.ts         # Lazy-initialized SQLite + Drizzle proxy; exports `db` and `sqlite`
  auth.ts       # Lucia instance; exports requireAuth() and getUser() helpers
  schema.ts     # Drizzle table definitions and inferred types
drizzle.config.ts
data/           # SQLite database file (gitignored)
drizzle/        # Generated migration files (gitignored)
```

## Auth pattern

`requireAuth()` (server components/actions) — validates session from cookie, redirects to `/login` if unauthenticated, returns the user object.

`getUser()` — same but returns `null` instead of redirecting; for optional auth scenarios.

Lucia needs the raw `sqlite` instance (not the Drizzle `db`) for its adapter — both are exported from `lib/db.ts`.
