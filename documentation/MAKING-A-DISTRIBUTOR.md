# Making a user a distributor for a domain

Distributor status is **not** something the app grants through any UI — there's no
"promote to distributor" button. Distributor access is modeled with two tables:

| Table                 | Meaning                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| `domains`             | One row per domain (e.g. `springfield.edu`). The canonical list of domains. |
| `domain_distributors` | Bridge table. One row = "this user is a distributor for this domain."       |

`domain_distributors` is many-to-many: a user can distribute for multiple domains, and a
domain can have multiple distributors. When a user has **any** row in `domain_distributors`,
`app/page.tsx` renders `DistributorView` instead of the regular logged-in view, and
`requireDistributor()` in `lib/auth.ts` returns the list of domains they distribute for.

## Prerequisites

- The person must **already have registered** (so a `users` row exists). You're
  granting distributor access to an existing account, not creating one.
- You need their `users.id`. Find it by their login (personal) email.

## Procedure (production)

The database lives on the VPS at
`/var/lib/get.ticketsforteachers.us/database.db` (bind-mounted into the container at
`/app/data/database.db`). Run SQL against it with the `sqlite3` CLI:

```sh
sqlite3 /var/lib/get.ticketsforteachers.us/database.db
```

### 1. Look up the user's id

```sql
SELECT id, email, first_name, last_name FROM users WHERE email = 'teacher@gmail.com';
```

### 2. Make sure the domain exists

Every domain must have a `domains` row before it can be referenced. `INSERT OR
IGNORE` is safe to run even if it already exists; `created_at` is filled in
automatically by a column default:

```sql
INSERT OR IGNORE INTO domains (domain, time_zone) VALUES ('springfield.edu', 'America/New_York');
```

**Always set `time_zone`** (an IANA identifier, e.g. `America/New_York`). It
represents where the district is located and is used to enforce TCPA SMS quiet
hours — offer texts are only sent between 8am–9pm in this zone. **A domain with a
null `time_zone` cannot send any offer SMS** (sends are blocked as a safety
default). `INSERT OR IGNORE` will not update an existing row, so if the domain
already exists, set its zone explicitly:

```sql
UPDATE domains SET time_zone = 'America/New_York' WHERE domain = 'springfield.edu';
```

### 3. Grant distributor access for the domain

Add one bridge row per domain the user should distribute for:

```sql
INSERT INTO domain_distributors (domain, user_id)
VALUES ('springfield.edu', '<the-user-id-from-step-1>');
```

For multiple domains, run step 2 for each domain, then insert one row per domain:

```sql
INSERT OR IGNORE INTO domains (domain, time_zone) VALUES ('shelbyville.edu', 'America/New_York');

INSERT INTO domain_distributors (domain, user_id) VALUES
  ('springfield.edu', '<the-user-id>'),
  ('shelbyville.edu', '<the-user-id>');
```

### 4. Verify

```sql
SELECT * FROM domain_distributors WHERE user_id = '<the-user-id>';
```

The change takes effect on the user's next page load — no restart needed.

## Changing or revoking

Revoke distributor access for a single domain:

```sql
DELETE FROM domain_distributors WHERE user_id = '<the-user-id>' AND domain = 'springfield.edu';
```

Revoke distributor access entirely (all domains):

```sql
DELETE FROM domain_distributors WHERE user_id = '<the-user-id>';
```

To "change" the domains a distributor manages, delete the rows you no longer want and
insert the ones you do.

> Removing a `domains` row is restricted while any ticket still references that
> domain (`tickets.domain` has a foreign key with `ON DELETE restrict`).
> Deleting a `domains` row cascades to its `domain_distributors` rows.

## Backfilling time zones for existing domains

The `time_zone` column was added after domains already existed, so those rows
have a null zone and cannot send offer SMS until it's set. All current districts
are in the New York time zone, so this one-time statement fills them in:

```sql
UPDATE domains SET time_zone = 'America/New_York' WHERE time_zone IS NULL;
```

As districts in other time zones are added, set their `time_zone` individually
(step 2) rather than relying on this blanket update.

## Doing it locally instead

Against a local dev database you can use Drizzle Studio for a point-and-click
edit:

```sh
yarn db:studio
```

Add a row to `domains` (the domain string), then a row to `domain_distributors` with
that `domain` and the user's `id`.
