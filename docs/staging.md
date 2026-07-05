# Staging Environment

Staging is a production-like copy of the app used to test changes safely before
they reach real users. It reuses `docker-compose.prod.yml` and applies a small
override file on top, so staging and production never drift apart.

## Requirements

- Docker Engine + Docker Compose **v2.24 or newer** (the override file uses the
  `!override` YAML tag).

## Setup

1. Copy the secrets template and fill in real values:

   ```bash
   cp .env.staging.example .env.staging
   chmod 600 .env.staging
   ```

   Use **different** `JWT_SECRET_KEY` and `POSTGRES_PASSWORD` values from
   production.

2. Start the staging stack:

   ```bash
   docker compose -p nisha-staging \
     -f docker-compose.prod.yml -f docker-compose.staging.yml \
     --env-file .env.staging up -d --build
   ```

3. Staging listens on localhost only:

   | Service  | Address              |
   | -------- | -------------------- |
   | backend  | `127.0.0.1:9100`     |
   | frontend | `127.0.0.1:3100`     |

   Point your reverse proxy (nginx/Caddy) staging subdomains, e.g.
   `staging.yourdomain.com` -> `127.0.0.1:3100` and
   `api-staging.yourdomain.com` -> `127.0.0.1:9100`.

## How isolation works

- `-p nisha-staging` gives every container, volume and network a
  `nisha-staging` prefix, so staging and production can run side by side on
  the same server without touching each other's data.
- Sentry traces are sampled at 100% on staging (low traffic, maximum detail).
- Database backups are kept only 3 days on staging.

## Secrets management rules

- `.env.staging` (and any real `.env*` file) is git-ignored - never commit it.
- Keep env files readable only by the deploy user (`chmod 600`).
- Rotate `JWT_SECRET_KEY` if it ever leaks; sessions will be invalidated.
- When CI/CD deployment is automated later, store these values in
  GitHub -> Settings -> Secrets and variables -> Actions, and inject them at
  deploy time instead of keeping them on disk.

## Stopping / resetting staging

```bash
# stop
docker compose -p nisha-staging -f docker-compose.prod.yml -f docker-compose.staging.yml down

# stop AND wipe staging data (safe - production volumes are untouched)
docker compose -p nisha-staging -f docker-compose.prod.yml -f docker-compose.staging.yml down -v
```
