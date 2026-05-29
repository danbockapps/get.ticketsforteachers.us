# MVP Plan: Tickets for Teachers

This document outlines the steps to build the MVP. Check off each task as it's completed.

## 1. Data model

Add new tables to `lib/schema.ts`:

### `tickets`

- [ ] `id` — primary key
- [ ] `description` — short text
- [ ] `quantity` — integer (number of tickets)
- [ ] `event_date` — date
- [ ] `event_time` — text (or time)
- [ ] `location` — short text
- [ ] `ada_accessible` — boolean
- [ ] `parking_included` — boolean
- [ ] `market_value_cents` — integer (store money in cents)
- [ ] `section` — text, nullable
- [ ] `row` — text, nullable
- [ ] `seats` — text, nullable
- [ ] `notes` — text, nullable
- [ ] `status` — enum-like text: `unclaimed` | `claimed` | `sent` (default `unclaimed`)
- [ ] `claimed_by_user_id` — FK to users, nullable
- [ ] `claimed_at` — timestamp, nullable
- [ ] `created_by_admin_id` — FK
- [ ] `created_at` — timestamp
- [ ] `domain_id` — FK (which domain this ticket belongs to)

### `ticket_offers`

One row per (ticket, user) offer.

- [ ] `id` — primary key
- [ ] `ticket_id` — FK
- [ ] `user_id` — FK
- [ ] `token` — random unguessable string (used in the personalized link)
- [ ] `method` — `email` | `sms`
- [ ] `sent_at` — timestamp
- [ ] `opened_at` — timestamp, nullable (optional, for analytics later)
- [ ] `declined_at` — timestamp, nullable

### `ticket_events` (audit log)

- [ ] `id` — primary key
- [ ] `ticket_id` — FK
- [ ] `actor_user_id` — FK, nullable (null if system)
- [ ] `actor_admin_id` — FK, nullable
- [ ] `event_type` — text: `created` | `offered` | `accepted` | `declined` | `marked_sent` | `status_changed`
- [ ] `target_user_id` — FK, nullable (e.g. who it was offered to)
- [ ] `details` — JSON text (free-form context, e.g. method, prior status)
- [ ] `created_at` — timestamp

- [ ] After schema changes: run `yarn db:generate && yarn db:migrate`.

## 2. Admin: ticket list / dashboard

In `app/AdminView.tsx` (or a new route like `app/admin/tickets/page.tsx`):

- [ ] List of tickets grouped or filtered by status with prominent badges:
  - [ ] **Unclaimed** — most prominent
  - [ ] **Claimed** — visible, includes claimer's name
  - [ ] **Sent** — hidden by default behind a "Show sent" toggle
- [ ] Each row shows description, date, location, quantity, status badge.
- [ ] Click to expand a ticket row to see:
  - [ ] All ticket fields
  - [ ] Audit log (`ticket_events`) timeline
  - [ ] Buttons: Offer, Mark Sent, Change Status, Edit
- [ ] A prominent "Create ticket" button at the top.

## 3. Admin: create ticket flow

New page or modal (e.g. `app/admin/tickets/new/page.tsx`):

Form fields:

- [ ] Description (required)
- [ ] Quantity (required, integer ≥ 1)
- [ ] Date (required)
- [ ] Time (required)
- [ ] Location (required)
- [ ] ADA accessible (checkbox)
- [ ] Parking included (checkbox)
- [ ] Estimated market value (required, dollars input — store as cents)
- [ ] Section, Row, Seat(s), Notes (optional)
- [ ] Domain selector (if admin has more than one)

- [ ] Server action: insert row with status `unclaimed`, log `created` event in `ticket_events`.

## 4. Admin: offer ticket flow

New page or modal (e.g. `app/admin/tickets/[id]/offer/page.tsx`):

- [ ] Pick an unclaimed ticket (if entered from a list, ticket is pre-selected).
- [ ] Pick a domain (if admin has more than one; otherwise auto-selected).
- [ ] Pick a method: Email or SMS.
- [ ] User picker showing each user's:
  - [ ] Name
  - [ ] Preferences (event types, ADA needs, primary worksite)
  - [ ] Contact for the selected method (email or phone)
  - [ ] Disabled if user has no contact for the chosen method or is unverified
- [ ] Multi-select with checkboxes; "Send" button at bottom.

Server action on send:

- [ ] For each selected user, generate a random token and insert a `ticket_offers` row.
- [ ] Send the message (email via existing email sender; SMS via existing SMS sender).
- [ ] Log `offered` event per user in `ticket_events`.
- [ ] Show success toast and return to ticket detail.

Message contents:

- [ ] Short summary of the ticket (description, date, time, location).
- [ ] Personalized link: `/offer/[token]`.

## 5. Public: offer recipient page

New route `app/offer/[token]/page.tsx`:

- [ ] Look up offer by token. If not found → 404.
- [ ] Load the associated ticket and user (no login required — the token authenticates the request for this offer only).
- [ ] Render based on ticket status:
  - [ ] **Unclaimed**: show user's name, all ticket details, Accept and Decline buttons.
  - [ ] **Claimed by someone else**: show "This ticket has already been claimed." message.
  - [ ] **Claimed by this user**: show "You claimed this ticket." with ticket details.
  - [ ] **Sent**: same as claimed-by-someone-else for other users; confirmation for the claimer.

### Accept action

Use a transaction (or `UPDATE ... WHERE status = 'unclaimed'`) to atomically:

- [ ] Set `tickets.status = 'claimed'`, `claimed_by_user_id`, `claimed_at`.
- [ ] Only if the row update affected 1 row, log `accepted` event and show success.
- [ ] If 0 rows affected (someone else claimed first), reload the page and show the "already claimed" message.

### Decline action

- [ ] Set `ticket_offers.declined_at`.
- [ ] Log `declined` event.
- [ ] Show "Thanks, we've recorded your decline." Optionally allow them to undo if still unclaimed.

## 6. Admin: status change and mark sent

On the ticket detail view:

- [ ] "Mark Sent" button — sets status to `sent`, logs `marked_sent` event.
- [ ] "Change Status" dropdown — manually switch between Unclaimed / Claimed / Sent. Logs `status_changed` event with prior + new values in `details`.
- [ ] If moving to `claimed` manually, prompt for which user (or leave null).
- [ ] If moving away from `claimed`, clear `claimed_by_user_id` and `claimed_at`.

## 7. Audit log display

On each ticket's expanded view, show `ticket_events` newest-first as a timeline:

- [ ] "Created by [admin] at [timestamp]"
- [ ] "Offered to John Doe via email at [timestamp]"
- [ ] "Offered to Jane Doe via SMS at [timestamp]"
- [ ] "Accepted by Jane Doe at [timestamp]"
- [ ] "Marked sent by [admin] at [timestamp]"
- [ ] Not prominent — collapsed by default, expandable.

## 8. Sending plumbing

- [ ] Reuse the existing email sender used for registration verification.
- [ ] Reuse the existing SMS sender used for phone verification.
- [ ] Add a thin wrapper `lib/notifications.ts` (or extend existing) with:
  - [ ] `sendOfferEmail(user, ticket, token)`
  - [ ] `sendOfferSms(user, ticket, token)`
- [ ] If sending fails for a particular user, do NOT mark the offer as sent — surface per-user failures in the admin UI (similar to the existing `smsFailed` pattern on `/check-email`).

## 9. Authorization

- [ ] All `/admin/*` routes must check that the current user has a row in `admins` (extend `requireAuth` or add `requireAdmin`).
- [ ] `/offer/[token]` is public (token-gated, no login).
- [ ] Admins can only see/offer tickets in domains they belong to.

## 10. Build order (suggested)

- [ ] 1. Schema + migrations (tickets, ticket_offers, ticket_events).
- [ ] 2. Admin ticket list view (read-only).
- [ ] 3. Create ticket form + action.
- [ ] 4. Offer flow (user picker + send action) — start with email only.
- [ ] 5. Public offer page with Accept/Decline + atomic claim.
- [ ] 6. Add SMS as a second method.
- [ ] 7. Mark sent + manual status change.
- [ ] 8. Audit log timeline on ticket detail.
- [ ] 9. Polish: filters on the list (status, date range, domain), "Show sent" toggle, per-user send-failure surfacing.
