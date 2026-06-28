## Conventions

- **One React component per file.** Don't define helper components alongside the main one — extract each into its own file.
- **All outbound email goes to `users.email` (personal).** `users.workEmail` exists solely to prove the user belongs to a domain (via the work-email verification flow). Never send notifications, offers, or any other mail to `workEmail`.
- **Every server action and route handler logs one line via `logAction()` (`lib/logger.ts`).** Call it once, _after_ the operation succeeds, with a short description. Pass the authenticated user (`logAction('saved preferences', user)`) so the line is attributed to their email; pass nothing for unauthenticated actions (logs `anon`) and put the relevant identifier in the description. Blanket per-request logging is handled separately by `proxy.ts` — don't duplicate it. New actions/handlers must add a `logAction()` call.
- **Let user manage branches.** Claude should not create or switch branches. Commits should go on the current branch.
