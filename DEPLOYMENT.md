# Deployment

This app runs on the VPS as a Docker container behind nginx, with TLS via Let's Encrypt and the SQLite database persisted to a directory on the host. The container listens on port 3000; nginx terminates TLS and reverse-proxies to it.

The repo on the VPS lives at `~/projects/tickets-for-teachers/`. `scripts/docker-run.sh` hardcodes that path for `--env-file`, so either keep the repo there or edit the script.

## Environment variables

Create `.env.production` in the repo root on the VPS (not checked in). Required:

| Variable                       | Purpose                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `DATABASE_PATH`                | SQLite file path inside the container. Set to `/app/data/database.db`.                              |
| `NEXT_PUBLIC_BASE_URL`         | Public base URL used in outbound email/SMS links (e.g. `https://tickets-for-teachers.danbock.net`). |
| `RESEND_API_KEY`               | Resend API key for outbound email.                                                                  |
| `RESEND_FROM_EMAIL`            | From-address for outbound email.                                                                    |
| `TWILIO_ACCOUNT_SID`           | Twilio account SID (for SMS).                                                                       |
| `TWILIO_AUTH_TOKEN`            | Twilio auth token.                                                                                  |
| `TWILIO_MESSAGING_SERVICE_SID` | Twilio messaging service SID.                                                                       |
| `EVENT_TIME_ZONE`              | Optional. Defaults to `America/New_York`.                                                           |

`NODE_ENV`, `PORT`, and `HOSTNAME` are baked into the Dockerfile — don't set them here.

## First-time setup

Do these once per VPS.

### 1. DNS

Point an A record for `tickets-for-teachers.danbock.net` at the VPS's public IP. Verify propagation before continuing — certbot will fail until DNS resolves:

```
dig +short tickets-for-teachers.danbock.net
curl ifconfig.me   # what the VPS thinks its IP is — should match
```

### 2. Clone the repo

```
mkdir -p ~/projects
cd ~/projects
git clone <repo-url> tickets-for-teachers
cd tickets-for-teachers
```

### 3. Create `.env.production`

```
nano .env.production
```

Paste in the variables from the table above with real values.

### 4. Create the host data directory

The container runs as UID/GID `1001:1001` (the `nextjs` user defined in the Dockerfile). The bind-mounted host directory must be owned by that UID or the SQLite file can't be opened.

```
sudo mkdir -p /var/lib/tickets-for-teachers
sudo chown 1001:1001 /var/lib/tickets-for-teachers
```

### 5. nginx site config

If you have an existing working site on this VPS, the fastest path is to copy it and edit the `server_name`:

```
sudo cp /etc/nginx/sites-available/<existing-site> /etc/nginx/sites-available/tickets-for-teachers.danbock.net
sudo nano /etc/nginx/sites-available/tickets-for-teachers.danbock.net
```

Otherwise, start from this skeleton (HTTP only — certbot will add the TLS block in the next step):

```nginx
server {
    listen 80;
    server_name tickets-for-teachers.danbock.net;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable it and reload nginx:

```
sudo ln -s /etc/nginx/sites-available/tickets-for-teachers.danbock.net /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. TLS via certbot

```
sudo certbot --nginx -d tickets-for-teachers.danbock.net
```

Certbot rewrites the nginx config to add a `listen 443 ssl` block and reloads nginx itself. If it fails with a DNS error, re-check step 1 — propagation can take a few minutes.

### 7. Build and start the container

```
cd ~/projects/tickets-for-teachers
docker build -t tickets-for-teachers .
./scripts/docker-run.sh
docker logs tickets-for-teachers
```

The entrypoint runs Drizzle migrations against the SQLite file before starting the server, so the database is initialized on first boot.

## Redeploy / update

> **⚠️ One-time breaking migration (`0008`, `0009`).** These migrations convert the
> primary keys of `tickets`, `ticket_offers`, and `ticket_events` from random text ids to
> autoincrement integers. They rebuild each table with `INSERT ... SELECT "id"`, which
> **fails if those tables already contain rows with the old text ids** — SQLite rejects a
> hex string in an `INTEGER PRIMARY KEY` column, and the container will crash on startup
> when the entrypoint runs migrations. Because the app had only test data, the intended
> path is to **wipe the database before deploying these migrations**:
>
> ```
> docker stop tickets-for-teachers; docker rm tickets-for-teachers
> sudo rm -f /var/lib/tickets-for-teachers/database.db*   # removes -wal/-shm too
> ```
>
> The next container start recreates the schema from scratch. Skip this once the
> migrations have been applied — it's only needed for the deploy that first includes them.

For every code change after the initial setup:

```
cd ~/projects/tickets-for-teachers
git pull
docker build -t tickets-for-teachers .
docker stop tickets-for-teachers
docker rm tickets-for-teachers
./scripts/docker-run.sh
docker logs tickets-for-teachers
```

Migrations run automatically on container start (`docker-entrypoint.sh` → `migrate.mjs`).

### Updating env vars only

`.env.production` is passed via `--env-file` on `docker run`, and `.dockerignore` excludes `.env*` so the file never enters the build context. Changes take effect on container restart — no rebuild needed:

```
nano .env.production
docker stop tickets-for-teachers
docker rm tickets-for-teachers
./scripts/docker-run.sh
```

## Troubleshooting

- **`docker-run.sh` fails with "container name already in use".** Stop and remove the old container first: `docker stop tickets-for-teachers && docker rm tickets-for-teachers`, then re-run.
- **Container starts then crashes; logs show a SQLite open error or `EACCES` on `/app/data`.** The host data directory isn't owned by `1001:1001`. Fix: `sudo chown -R 1001:1001 /var/lib/tickets-for-teachers`, then `docker rm tickets-for-teachers` and re-run `./scripts/docker-run.sh`.
- **`certbot --nginx` can't obtain a cert.** Usually DNS hasn't propagated yet. Confirm `dig +short tickets-for-teachers.danbock.net` returns the VPS's public IP (`curl ifconfig.me` from the VPS shows what that IP is). Re-run certbot once they match.
- **`./scripts/docker-run.sh` errors that the image doesn't exist.** Build it first: `docker build -t tickets-for-teachers .`.
- **Container crashes on startup after pulling migrations `0008`/`0009`; logs show a SQLite datatype/`INTEGER PRIMARY KEY` error during migration.** The database still holds rows with the old text ids that these migrations can't convert. See the breaking-migration note under [Redeploy / update](#redeploy--update) — wipe `/var/lib/tickets-for-teachers/database.db*` and restart the container.
