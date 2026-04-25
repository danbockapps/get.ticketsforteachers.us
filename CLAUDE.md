# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
yarn dev      # Start dev server (http://localhost:3000)
yarn build    # Production build
yarn start    # Start production server
yarn lint     # Run ESLint
```

No test framework is configured.

## Stack

- **Next.js 16.2.4** — App Router. This is a new major version with breaking changes from prior versions. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code.
- **React 19.2.4**
- **TypeScript**
- **Tailwind CSS v4** — Configured via `postcss.config.mjs`. Uses `@import "tailwindcss"` syntax in CSS (not `@tailwind` directives). Theme customization uses `@theme inline {}` blocks in CSS rather than `tailwind.config.js`.

## Project Structure

All application code lives under `app/` (Next.js App Router):

- `app/layout.tsx` — Root layout with Geist font variables and global CSS
- `app/page.tsx` — Home page (`/`)
- `app/globals.css` — Global styles; defines CSS custom properties for background/foreground and Tailwind theme tokens

This is a freshly scaffolded project. There is no shared components directory, no API routes, and no data layer yet.
