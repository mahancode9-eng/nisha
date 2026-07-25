# Production Deployment Guide

Docker Compose deployment on a Linux VPS for Nisha (FastAPI + Next.js).

Use **`docker-compose.prod.yml`** with **`backend/Dockerfile.prod`** and **`frontend/Dockerfile.prod`**. Do **not** use the development Dockerfiles (`--reload` / `npm run dev`) on a public host.

Day-0 sell checklist: [`soft-launch-runbook.fa.md`](./soft-launch-runbook.fa.md). Sample reverse proxy: [`../deploy/nginx.conf.example`](../deploy/nginx.conf.example).

## 1. Server prerequisites

- Linux VPS with domain name(s)
- Docker Engine + Compose plugin
- Git access to the repository
- Host Nginx or Caddy for TLS on ports `80` / `443`

```bash
sudo mkdir -p /opt/nisha
sudo chown $USER:$USER /opt/nisha
cd /opt/nisha
git clone <your-repo-url> .
```

## 2. Root `.env` (required)

Prod Compose reads **root `.env`** via variable substitution. It does **not** load `backend/.env`.

```bash
cp .env.example .env
chmod 600 .env
# edit .env with real values
```

Required variables (Compose fails fast if missing):

| Variable | Example |
|---|---|
| `POSTGRES_PASSWORD` | strong DB password |
| `JWT_SECRET_KEY` | `openssl rand -hex 32` |
| `CORS_ORIGINS` | `https://app.example.com` |
| `NEXT_PUBLIC_API_URL` | `https://api.example.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://app.example.com` |
| `FRONTEND_BASE_URL` | `https://app.example.com` |
| `EMAIL_PROVIDER` | `resend` or `smtp` (**not** `console`) |
| `EMAIL_FROM` | `Nisha <noreply@example.com>` |
| `RESEND_API_KEY` or SMTP_* | matching provider credentials |

Production validators reject `EMAIL_PROVIDER=console` and localhost `FRONTEND_BASE_URL`.

Optional: `SENTRY_DSN`, SMS, S3 — see `.env.example`.

## 3. Start production

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

What prod compose provides:

- `db` + `db-backup` (daily `pg_dump` + `uploads` + `private_uploads` archives under `./backups`)
- `backend` on `127.0.0.1:9000` with named volumes `backend_uploads` and `backend_private_uploads`
- `frontend` on `127.0.0.1:3000` (SSR uses `API_URL=http://backend:8000`)
- Auto Alembic `upgrade head` on backend startup (PostgreSQL)
- OpenAPI `/docs` disabled when `ENVIRONMENT=production`

Do **not** run `scripts.seed` on a real production tenant unless you intentionally want demo data (`ALLOW_DEMO_SEED`).

## 4. Reverse proxy and TLS

Do not expose `3000` / `9000` to the internet. Publish only the reverse proxy.

Suggested hostnames:

- `app.example.com` → `http://127.0.0.1:3000`
- `api.example.com` → `http://127.0.0.1:9000`

Copy and adapt [`deploy/nginx.conf.example`](../deploy/nginx.conf.example):

- TLS certificates (e.g. Let's Encrypt)
- WebSocket `Upgrade` headers (chat / realtime)
- `client_max_body_size 60m` (payment proof uploads)

Align:

- `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SITE_URL` / `FRONTEND_BASE_URL` with public HTTPS URLs
- `CORS_ORIGINS` with the public frontend origin

## 5. Data, uploads, and backups

Persisted by Compose:

| Data | Location |
|---|---|
| PostgreSQL | volume `postgres_data` |
| Public uploads | volume `backend_uploads` → `/app/uploads` |
| Private proofs | volume `backend_private_uploads` → `/app/private_uploads` |
| Backup archives | host `./backups` (DB + uploads + private_uploads) |

The `db-backup` service runs [`scripts/db-backup.sh`](../scripts/db-backup.sh). Also copy `./backups` and `.env` off-box periodically.

Manual one-shot (if needed):

```bash
docker compose -f docker-compose.prod.yml exec db pg_dump -U nisha nisha | gzip > backup.sql.gz
```

Restore helper: [`scripts/db-restore.sh`](../scripts/db-restore.sh).

## 6. Admin go-live steps

1. Open `https://app.example.com/admin/settings` and set the **platform subscription card**.
2. Smoke: seller register → onboarding → dashboard; guest checkout + proof; subscription checkout + admin approve.
3. Invite first sellers — see soft-launch runbook.

## 7. Updates

```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f backend
```

Migrations usually apply on boot. To force:

```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## 8. Rollback

1. Stop the stack.
2. Check out the previous Git commit.
3. Restore DB / uploads / private_uploads from `./backups` if schema or data changed.
4. Start again and re-run smoke checks.

## 9. Smoke checks

- Homepage loads RTL Persian
- Public store + guest checkout + invoice/track-order
- Payment proof upload (private media path)
- Seller login, dashboard, orders
- Admin login, settings card, subscription approve
- Public product images under `/uploads/...`
- Private proofs **not** publicly listable under `/uploads`

## 10. Incident checklist

1. `docker compose -f docker-compose.prod.yml ps`
2. Backend / frontend / db logs
3. PostgreSQL healthy
4. Nginx can reach `127.0.0.1:3000` and `:9000`
5. Disk not full (`df -h`, `./backups` growth)
