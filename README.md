# Nisha

Manual-payment SaaS for small online shops (Instagram/Telegram sellers). Sellers run a public store, manage products and stock, accept guest checkout, review payment proofs, and confirm orders. Customers buy without an account using an invoice code and password to track and upload proof.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Python FastAPI, SQLAlchemy 2.x, Alembic |
| Database | PostgreSQL 16 |
| Auth | JWT (Bearer), roles: `SELLER`, `ADMIN` |
| Deploy | Docker Compose |

## Project layout

```
/backend     FastAPI API, Alembic, tests
/frontend    Next.js app
/docs        Demo walkthrough (DEMO.md)
docker-compose.yml
```

## Quick start (Docker)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

In another terminal:

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m scripts.seed
```

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Frontend |
| http://localhost:8000/docs | Swagger API |
| http://localhost:8000/api/v1/health | Health check |

Stop: `docker compose down` · Reset DB: `docker compose down -v`

## Local development (without Docker)

### Database

Create PostgreSQL and match credentials in `backend/.env`.

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

Set `NEXT_PUBLIC_API_URL=http://localhost:8000`.

## Demo credentials

After `python -m scripts.seed` (or Docker exec above):

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123456` |
| Seller | `seller@example.com` | `seller123456` |

Demo store: **http://localhost:3000/store/demo-store**

## Frontend routes

| Area | Routes |
|------|--------|
| Public | `/`, `/track-order`, `/store/[slug]`, `/store/[slug]/checkout`, `/invoice/[invoiceCode]` |
| Seller | `/seller/login`, `/seller/register`, `/seller/dashboard`, `/seller/store`, `/seller/products`, `/seller/orders`, `/seller/conversations`, … |
| Admin | `/admin/login`, `/admin/dashboard`, `/admin/stores`, `/admin/orders`, `/admin/orders/[id]` |
| Customer (chat) | `/customer/login`, `/customer/register`, `/customer/conversations`, `/customer/conversations/[id]` |

JWT: sellers/admins use `nisha_access_token`; customers use `nisha_customer_token` (separate sessions).

## Environment variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `development` | `development` or `production` |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `UPLOAD_DIR` | `./uploads` | Local upload directory |
| `PAYMENT_PROOF_SUBDIR` | `payment-proofs` | Subfolder under `UPLOAD_DIR` |
| `MAX_UPLOAD_SIZE_BYTES` | `5242880` | Max upload size (5 MB) |
| `LOW_STOCK_THRESHOLD` | `5` | Seller dashboard low-stock alert |
| `JWT_SECRET_KEY` | — | **Change in production** |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Token lifetime |
| `LOG_LEVEL` | `INFO` | `DEBUG` useful in development |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL for browser requests |
| `API_URL` | Optional server-side URL (Docker: `http://backend:8000`) |

## Commands

```bash
# Migrations
cd backend && alembic upgrade head

# Seed demo data
cd backend && python -m scripts.seed

# Tests
cd backend && python -m pytest -v

# Frontend production build
cd frontend && npm run build
```

## API overview

Interactive docs: http://localhost:8000/docs

**Auth:** `POST /api/v1/auth/register`, `login`, `GET /me`

**Public (no auth):** store page, guest checkout, track order, upload proof, edit buyer details

**Seller (Bearer):** store, products, payment methods, orders, dashboard

**Admin (Bearer, ADMIN role):** platform dashboard, stores (activate/deactivate), orders

List endpoints return paginated JSON:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 20,
  "total_pages": 0
}
```

Applies to: `GET /seller/products`, `GET /seller/orders`, `GET /admin/stores`, `GET /admin/orders`.

Uploaded files are served at `/uploads/...`.

## Customer chat (Phase 2)

1. Run migration: `cd backend && alembic upgrade head`
2. Register at `/customer/register` (optional; guest checkout unchanged)
3. Open a store → **Sign in to chat** or **Message seller**
4. Seller replies at `/seller/conversations`

Manual test:

```bash
cd backend && python -m pytest -v -k "customer or chat"
```

## MVP limitations

- **No payment gateway** — card-to-card, crypto, and external links are manual instructions only
- **Guest checkout** — no account required; invoice code + password for order tracking
- **Chat** — requires customer account for permanent history; polling only (no WebSocket yet)
- **Local file storage** — not S3/CDN; image URLs on products are plain URLs
- **No advanced analytics** — basic dashboard metrics only
- **Admin order detail is read-only** — no platform-level order actions in UI
- **Public store catalog is not paginated** — intended for small demo catalogs

## Phase 2 roadmap

- Integrated payment providers (Zarinpal, Stripe, etc.)
- Customer accounts and order history
- WebSocket chat and push notifications
- Object storage (S3) for uploads and product images
- Email/SMS for invoice and status updates
- Multi-currency, tax, shipping zones
- E2E tests and staging CI

## Demo walkthrough

See [docs/DEMO.md](docs/DEMO.md) for a 5-minute scripted demo (customer → seller → admin).

## Security notes

- Set a strong `JWT_SECRET_KEY` before any production deploy; the Docker Compose default is for local use only.
- Sellers can only access their own store’s products and orders; admins require the `ADMIN` role.
- Guest order edits and proof uploads require the invoice password (bcrypt).

git add .
git commit -m "Add product management page"
git push