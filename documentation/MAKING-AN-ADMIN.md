# Making a user an admin for a domain

Admin status is **not** something the app grants through any UI — there's no
"promote to admin" button. Admin access is modeled with two tables:

| Table           | Meaning                                                                     |
| --------------- | --------------------------------------------------------------------------- |
| `domains`       | One row per domain (e.g. `springfield.edu`). The canonical list of domains. |
| `domain_admins` | Bridge table. One row = "this user is an admin for this domain."            |

`domain_admins` is many-to-many: a user can administer multiple domains, and a
domain can have multiple admins. When a user has **any** row in `domain_admins`,
`app/page.tsx` renders `AdminView` instead of the regular logged-in view, and
`requireAdmin()` in `lib/auth.ts` returns the list of domains they administer.

## Prerequisites

- The person must **already have registered** (so a `users` row exists). You're
  granting admin to an existing account, not creating one.
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
INSERT OR IGNORE INTO domains (domain) VALUES ('springfield.edu');
```

### 3. Grant admin for the domain

Add one bridge row per domain the user should administer:

```sql
INSERT INTO domain_admins (domain, user_id)
VALUES ('springfield.edu', '<the-user-id-from-step-1>');
```

For multiple domains, run step 2 for each domain, then insert one row per domain:

```sql
INSERT OR IGNORE INTO domains (domain) VALUES ('shelbyville.edu');

INSERT INTO domain_admins (domain, user_id) VALUES
  ('springfield.edu', '<the-user-id>'),
  ('shelbyville.edu', '<the-user-id>');
```

### 4. Verify

```sql
SELECT * FROM domain_admins WHERE user_id = '<the-user-id>';
```

The change takes effect on the user's next page load — no restart needed.

## Changing or revoking

Revoke admin for a single domain:

```sql
DELETE FROM domain_admins WHERE user_id = '<the-user-id>' AND domain = 'springfield.edu';
```

Revoke admin entirely (all domains):

```sql
DELETE FROM domain_admins WHERE user_id = '<the-user-id>';
```

To "change" the domains an admin manages, delete the rows you no longer want and
insert the ones you do.

> Removing a `domains` row is restricted while any ticket still references that
> domain (`tickets.domain` has a foreign key with `ON DELETE restrict`).
> Deleting a `domains` row cascades to its `domain_admins` rows.

## Doing it locally instead

Against a local dev database you can use Drizzle Studio for a point-and-click
edit:

```sh
yarn db:studio
```

Add a row to `domains` (the domain string), then a row to `domain_admins` with
that `domain` and the user's `id`.
