# Production Deployment Guide

This guide assumes a Docker Compose-first deployment on a Linux VPS.

It is written for the repository as it exists today: the backend Dockerfile starts Uvicorn with `--reload`, and the frontend Dockerfile starts Next.js with `npm run dev`. That is fine for development, but production should override those commands so the public server is not running hot-reload processes.

## 1. Server prerequisites

- Linux VPS with a domain name
- Docker Engine and the Docker Compose plugin
- Git access to the repository
- Open firewall ports for SSH and for your reverse proxy (`80` and `443`)

Recommended directory layout:

```bash
sudo mkdir -p /opt/nisha
sudo chown $USER:$USER /opt/nisha
cd /opt/nisha
git clone <your-repo-url> .
```

## 2. Create production environment files

Create `backend/.env` from `backend/.env.example` and `frontend/.env` from `frontend/.env.example`.

Suggested production values:

### backend/.env

```env
ENVIRONMENT=production
DATABASE_URL=postgresql://nisha:<strong-password>@db:5432/nisha
CORS_ORIGINS=https://app.example.com
UPLOAD_DIR=/app/uploads
PAYMENT_PROOF_SUBDIR=payment-proofs
MAX_UPLOAD_SIZE_BYTES=5242880
LOW_STOCK_THRESHOLD=5
JWT_SECRET_KEY=<generate-a-long-random-secret>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=10080
LOG_LEVEL=INFO
```

### frontend/.env

```env
NEXT_PUBLIC_API_URL=https://api.example.com
API_URL=http://backend:8000
```

Notes:

- `NEXT_PUBLIC_API_URL` is what the browser uses.
- `API_URL` is only for server-side rendering inside the frontend container.
- Keep `CORS_ORIGINS` aligned with the public frontend origin.

## 3. Production runtime differences

The committed Dockerfiles are development defaults:

- `backend/Dockerfile` runs `uvicorn ... --reload`
- `frontend/Dockerfile` runs `npm run dev`

For production, use the dedicated production compose file and Dockerfiles:

```bash
# Create backend/.env and frontend/.env (see section 2), then:
docker compose -f docker-compose.prod.yml up -d --build
```

Production assets:

- `docker-compose.prod.yml` — no source bind-mounts, `restart: unless-stopped`, required env vars
- `backend/Dockerfile.prod` — Uvicorn without `--reload`
- `frontend/Dockerfile.prod` — multi-stage `npm ci` → `npm run build` → `npm run start`

Required environment variables for `docker-compose.prod.yml`:

- `POSTGRES_PASSWORD`
- `JWT_SECRET_KEY`
- `CORS_ORIGINS` (public frontend origin, e.g. `https://app.example.com`)
- `NEXT_PUBLIC_API_URL` (public API origin, e.g. `https://api.example.com`)

If you prefer command overrides on the dev Dockerfiles instead, you can still override commands manually:

```yaml
services:
  backend:
    command: ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
    restart: unless-stopped
  frontend:
    command: ["sh", "-lc", "npm run build && npm run start"]
    restart: unless-stopped
```

## 4. Start the stack

### Production

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

### Development

1. Bring up PostgreSQL first:

```bash
docker compose up -d db
```

2. Start the backend:

```bash
docker compose up -d backend
```

The backend auto-runs Alembic migrations on startup when `DATABASE_URL` points to PostgreSQL.

3. Start the frontend:

```bash
docker compose up -d frontend
```

4. Check container status and logs:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

If this is a demo or staging server, seed sample data after the services are healthy:

```bash
docker compose exec backend python -m scripts.seed
```

Do not seed demo data into a real production tenant unless you want the sample seller, store, and demo content.

## 5. Reverse proxy and TLS

Do not expose the application ports directly to the internet. Publish only the reverse proxy on `80` and `443`.

For a simple setup, use two hostnames:

- `app.example.com` for the frontend
- `api.example.com` for the backend

Example Nginx idea:

- `app.example.com` -> `http://127.0.0.1:3000`
- `api.example.com` -> `http://127.0.0.1:9000`

If you keep the stock `docker-compose.yml`, tighten the frontend port mapping before going live. The committed file already binds the backend to localhost, but the frontend port should also be restricted to localhost or protected by the firewall.

When using a proxy, make sure:

- `NEXT_PUBLIC_API_URL` matches the public API hostname
- `CORS_ORIGINS` includes the public frontend origin
- TLS certificates are renewed automatically

## 6. Data, uploads, and backups

The app stores uploads on the local filesystem under `UPLOAD_DIR`.

In the current compose layout, that means you should keep the backend data directory and uploads on persistent storage on the VPS. Back up both:

- PostgreSQL data volume
- Uploads directory
- `backend/.env` and `frontend/.env`

Suggested backup commands:

```bash
docker compose exec db pg_dump -U nisha nisha > backup.sql
tar -czf uploads-backup.tgz backend/uploads
```

Restore by putting the database dump and upload files back in place before starting the stack again.

## 7. Updates

1. Pull the latest code:

```bash
git pull
```

2. Rebuild and restart:

```bash
docker compose up -d --build
```

3. Review logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

4. Run a quick smoke test in the browser.

Because the backend applies migrations on startup, a normal update flow usually does not need a separate manual Alembic step. If you want to force it anyway:

```bash
docker compose exec backend alembic upgrade head
```

## 8. Rollback

If a deployment causes problems:

1. Stop the stack.
2. Revert to the previous Git commit or previous image tag.
3. Restore the previous database backup if the schema or data changed.
4. Start the stack again and re-run smoke checks.

## 9. Smoke checks

Verify these flows after each production deploy:

- Homepage loads in RTL with Persian selected by default
- Language and theme controls render correctly
- Public store page and checkout work
- Guest checkout creates an invoice code and password
- Payment proof upload succeeds
- Track order and invoice pages load with the saved invoice credentials
- Seller login, dashboard, and order detail pages load
- Admin login, dashboard, and store/order management pages load
- Uploaded files are reachable from `/uploads/...`

## 10. Incident checklist

If the site is down:

1. Check `docker compose ps`
2. Check `docker compose logs -f backend`
3. Check `docker compose logs -f frontend`
4. Confirm PostgreSQL is healthy
5. Confirm the reverse proxy can still reach the local container ports
6. Confirm the VPS disk is not full
