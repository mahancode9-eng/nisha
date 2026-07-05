# Nisha

Nisha is a manual-payment commerce platform for small online stores. It ships a Persian-first RTL UI, a purple/black theme system with light, dark, and system modes, a public storefront, guest checkout, seller/admin tooling, and a customer portal. The UI is Persian-only; documentation is written in English.

## What this repo contains

- Public storefront and checkout
- Guest order tracking and payment proof upload
- Seller dashboard, catalog, payment methods, orders, and chat
- Customer portal for profile, addresses, order history, reviews, complaints, downloads, and recovery
- Admin panel for stores, orders, reviews, and chats
- Shared theme and localization controls

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy 2.x, Alembic |
| Database | PostgreSQL 16 |
| Auth | JWT bearer tokens, separate seller/admin and customer sessions |
| Deploy | Docker Compose |

## Repository layout

```
/backend     FastAPI API, Alembic, tests, scripts
/frontend    Next.js app, shared UI, contexts, hooks
/nisha_flutter  Flutter mobile app workspace
/docs        Demo, migration, production, and worklog docs
docker-compose.yml
```

## Documentation

- [Demo walkthrough](docs/DEMO.md)
- [Customer migration guide](docs/CUSTOMER_MIGRATION_GUIDE.md)
- [Production deployment guide](docs/PRODUCTION_DEPLOYMENT.md)
- [Flutter implementation guide](docs/FLUTTER_IMPLEMENTATION_GUIDE.md)
- [Flutter architecture](docs/FLUTTER_ARCHITECTURE.md)
- [Flutter API reference](docs/FLUTTER_API_REFERENCE.md)
- [Flutter quick start](docs/FLUTTER_QUICKSTART.md)
- [Flutter release guide](docs/FLUTTER_RELEASE.md)
- [Internal worklog](docs/WORKLOG.md)

## Mobile app

The mobile client lives in [`nisha_flutter/`](nisha_flutter/README.md).
It is Persian-first, RTL by default, and uses the same backend API as the web app.

## Quick start with Docker

1. Copy the example environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Start the stack:

```bash
docker compose up --build
```

3. Open the app:

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Frontend |
| http://localhost:8000/docs | API docs |
| http://localhost:8000/api/v1/health | Health check |

4. The backend automatically applies Alembic migrations on startup when it connects to PostgreSQL.

5. Seed demo data only if you want the sample seller/store content. **Do not run the seed script in production.**

```bash
docker compose exec backend python -m scripts.seed
```

6. Reset the local database if needed:

```bash
docker compose down -v
```

Note: the committed Dockerfiles are development defaults (`next dev` and `uvicorn --reload`). See the production guide for server deployment notes and runtime overrides.

## Local development without Docker

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000` for browser requests during local development.

## Production

Use [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md) for a Docker Compose-first Linux VPS deployment guide. It covers the production command overrides, reverse proxy, TLS, backups, and smoke checks.

## Configuration

### Backend environment

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `development` | `development` or `production` |
| `DATABASE_URL` | required | PostgreSQL connection string |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `UPLOAD_DIR` | `./uploads` | Directory for product and payment proof uploads |
| `PAYMENT_PROOF_SUBDIR` | `payment-proofs` | Subfolder under `UPLOAD_DIR` |
| `MAX_UPLOAD_SIZE_BYTES` | `5242880` | Max upload size in bytes |
| `LOW_STOCK_THRESHOLD` | `5` | Seller dashboard low-stock alert threshold |
| `JWT_SECRET_KEY` | required | Set a strong secret in production |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Token lifetime in minutes |
| `LOG_LEVEL` | `INFO` | Logging level |

### Frontend environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL for browser requests |
| `API_URL` | Optional server-side URL for Docker SSR (`http://backend:8000` in Compose) |

Important:

- Browser requests use `NEXT_PUBLIC_API_URL`.
- Server components inside Docker use `API_URL` when it is set.
- Keep `CORS_ORIGINS` aligned with the public frontend origin.

## Routes

### Public

- `/`
- `/track-order`
- `/store/[slug]`
- `/store/[slug]/products/[productId]`
- `/store/[slug]/checkout`
- `/invoice/[invoiceCode]`

### Customer

- `/customer/login`
- `/customer/register`
- `/customer/recover`
- `/customer/dashboard`
- `/customer/profile`
- `/customer/addresses`
- `/customer/orders`
- `/customer/orders/[id]`
- `/customer/conversations`
- `/customer/conversations/[id]`
- `/customer/downloads`
- `/customer/reviews`
- `/customer/complaints`

### Seller

- `/seller/login`
- `/seller/register`
- `/seller/onboarding`
- `/seller/dashboard`
- `/seller/store`
- `/seller/products`
- `/seller/products/new`
- `/seller/products/[id]/edit`
- `/seller/orders`
- `/seller/orders/[id]`
- `/seller/payment-methods`
- `/seller/conversations`
- `/seller/conversations/[id]`

### Admin

- `/admin/login`
- `/admin/dashboard`
- `/admin/stores`
- `/admin/stores/[id]`
- `/admin/stores/[id]/badges`
- `/admin/orders`
- `/admin/orders/[id]`
- `/admin/reviews`
- `/admin/chats`
- `/admin/chats/[id]`

## API and behavior

- Human-readable backend errors are localized before they reach the frontend. The UI surfaces `ApiError.detail` verbatim.
- List endpoints return paginated JSON with `items`, `total`, `page`, `page_size`, and `total_pages`.
- Uploaded files are served from `/uploads/...`.
- Seller/admin accounts use the seller/admin bearer token. Customer accounts use a separate customer token.
- The UI is Persian-only and RTL.
- Theme preference persists per device and can follow light, dark, or system mode.

## Demo credentials

After running `python -m scripts.seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123456` |
| Seller | `seller@example.com` | `seller123456` |

Demo store:

- `http://localhost:3000/store/demo-store`

## Verification

```bash
cd backend && python -m pytest -v
cd frontend && npm run build
cd frontend && npm run lint
```

## Security notes

- Set a strong `JWT_SECRET_KEY` before any production deploy.
- Keep uploads on persistent storage in production.
- Do not expose development ports directly to the internet.
- Use the production deployment guide for reverse proxy and TLS setup.
