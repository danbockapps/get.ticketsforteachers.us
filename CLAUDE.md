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

## Conventions

- **One React component per file.** Don't define helper components alongside the main one — extract each into its own file.
- **All outbound email goes to `users.email` (personal).** `users.workEmail` exists solely to prove the user belongs to a domain (via the work-email verification flow). Never send notifications, offers, or any other mail to `workEmail`.

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
  AdminView.tsx       # Home page view for admin users
  LoggedInView.tsx    # Home page view for authenticated regular users
  LoggedOutView.tsx   # Home page view for unauthenticated users
  check-email/        # Post-registration/login "check your email" confirmation page
lib/
  db.ts         # Lazy-initialized SQLite + Drizzle proxy; exports `db` and `sqlite`
  auth.ts       # Lucia instance; exports requireAuth() and getUser() helpers
  schema.ts     # Drizzle table definitions and inferred types
drizzle.config.ts
data/           # SQLite database file (gitignored)
drizzle/        # Generated migration files (gitignored)
prompts/        # Prompts the user writes — do not put generated files here
plans/          # Plans Claude writes — put new planning docs here
```

## Auth pattern

`requireAuth()` (server components/actions) — validates session from cookie, redirects to `/login` if unauthenticated, returns the user object.

`getUser()` — same but returns `null` instead of redirecting; for optional auth scenarios.

Lucia needs the raw `sqlite` instance (not the Drizzle `db`) for its adapter — both are exported from `lib/db.ts`.

### Home page routing

`app/page.tsx` checks the user's state and renders one of three views:

- **`AdminView`** — if the user has any row in the `domain_admins` bridge table (i.e. is an admin for at least one domain)
- **`LoggedInView`** — regular authenticated user; shows phone verification status and preferences
- **`LoggedOutView`** — unauthenticated; links to `/register` and `/login`

## Registration

On success, the user is redirected to `/check-email?emails=2` (both personal and work verification links are sent). If SMS delivery fails, the action redirects to `/check-email?smsFailed=1`, which shows a warning alert.

## User preferences

Preference fields are collected at registration (`app/register/page.tsx`) and editable post-login on the home page via `app/LoggedInView.tsx`. Both surfaces share `app/preferences/PreferenceFields.tsx` for the form controls, and `app/preferences/constants.ts` for any fixed option lists.

`PreferenceFields` accepts `{ eventTypes?, adaAccessible?, primaryWorksite? }`.

The save logic lives in `app/preferences/actions.ts` (server action called by `PreferencesForm`) and `app/register/actions.ts`.

### UI → database mapping

| UI pattern                    | Form field name   | DB column           | DB type                                         |
| ----------------------------- | ----------------- | ------------------- | ----------------------------------------------- |
| Checkbox group (multi-select) | `eventTypes`      | `event_preferences` | JSON array of strings in a `text` column        |
| Text input                    | `primaryWorksite` | `primary_worksite`  | `text`                                          |
| Single checkbox               | `adaAccessible`   | `ada_accessible`    | `integer` `{mode: 'boolean'}`, defaults `false` |

New preference fields follow the same pattern: add the control to `PreferenceFields.tsx`, add the column to `lib/schema.ts`, and run `yarn db:generate && yarn db:migrate`.
