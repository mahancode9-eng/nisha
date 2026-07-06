# Seller Analytics (Task 20)

## Overview

Sellers get a dashboard with daily sales, storefront visits, conversion rate, and top products.
No external analytics service is used — everything is computed from the app database.

## Data model

- `store_visits_daily` (new table, migration `20260706_0016_store_visits`):
  - `store_id` (FK stores, CASCADE), `visit_date` (Date, UTC day), `visit_count` (int)
  - Unique constraint `uq_store_visits_daily_store_date` — one row per store per day.
  - Aggregate counter only: no IP addresses, no user identifiers, no cookies (privacy-friendly).

## Visit tracking flow

1. The public store page (`frontend/app/store/[slug]/page.tsx`) renders `<VisitPing slug={...} />`.
2. `VisitPing` is a tiny client component that fires `POST /api/v1/public/stores/{slug}/visit` once on mount (fire-and-forget, errors swallowed).
3. The backend (`app/api/v1/public/visits.py` → `analytics_service.record_store_visit`) upserts the daily counter for today (UTC).

Known limitation (accepted for MVP): the read-then-write upsert has a benign race condition under
high concurrency — a few visits may be undercounted. Fix later with an atomic
`INSERT ... ON CONFLICT DO UPDATE` if precision matters.

## Seller analytics endpoint

`GET /api/v1/seller/analytics?days=30` (auth: seller, own store; `days` 1..90)

Response (`SellerAnalyticsResponse`):

- `days`: echo of the requested window
- `daily[]`: `{ date, orders, revenue, visits }` — one point per day, zero-filled
- `totals`: `{ orders, revenue, visits, conversion_rate }`
  - `orders` = all orders created in the window (any status)
  - `revenue` = sum of `total_amount` for orders in confirmed statuses only
    (PAYMENT_CONFIRMED / PREPARING / SHIPPED / DELIVERED)
  - `conversion_rate` = orders / visits × 100 (percent, 1 decimal; 0 when no visits)
- `top_products[]`: top 10 by quantity sold (confirmed orders), `{ product_id, title, quantity, revenue }`
  — `title` comes from the order item snapshot, so deleted products still show.

Note: `revenue` is a Decimal on the backend; the frontend types treat it as `number | string`
and normalize with `Number()` before display.

## Frontend

- Page: `/seller/analytics` (`frontend/app/seller/(app)/analytics/page.tsx`)
- Range switch: 7 / 30 / 90 days.
- Charts are plain CSS/flexbox bar charts (no chart library dependency).
- API client: `frontend/lib/api/seller/analytics.ts`; types: `frontend/types/seller/analytics.ts`.

## Testing

`backend/tests/test_analytics.py` covers: visit counting, 404 for unknown store,
full analytics summary (orders vs confirmed revenue, conversion rate, top products), auth required.
