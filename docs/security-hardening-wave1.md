# Security hardening (Wave 1)

Soft-launch security controls added in Wave 1. Wave 2 (JWT rotation, phone OTP, CAPTCHA, Docker non-root, CI audits) is deferred.

## Behaviour changes

| Area | Change |
|---|---|
| Registration | Re-registering an unverified email returns `409` and does **not** overwrite password/profile. A new verification email may be sent. |
| Email tokens | Issuing a new verification token consumes all prior unconsumed tokens for that account. |
| Inventory | Guest/customer checkout sets `reservation_expires_at` (~20 min). Expired `PENDING_PAYMENT` orders become `EXPIRED` and stock is restored. |
| Private proofs | Payment and subscription proofs live under `PRIVATE_UPLOAD_DIR` and are served only via `/api/v1/media/private/...` with a short-lived signed `token` (or seller/admin Bearer). |
| WebSocket | Clients must `POST /api/v1/ws/tickets/{seller\|customer\|order}` then connect with `?ticket=`. JWT/password query params are removed. |
| Rate limits | Customer auth, guest orders, payment/subscription proof uploads, and refresh are rate-limited. Guest checkout includes a `company_website` honeypot. |
| Seed | Blocked when `ENVIRONMENT=production` unless `ALLOW_DEMO_SEED=true`. Existing admin passwords are never reset. |
| Email prod | Startup fails if `EMAIL_PROVIDER=console` or `FRONTEND_BASE_URL` contains localhost in production. |
| CSV export | Cells starting with `= + - @` are prefixed with `'`. |

## New / important env vars

See [`backend/.env.example`](../backend/.env.example):

- `PRIVATE_UPLOAD_DIR`
- `ORDER_RESERVATION_MINUTES`
- `ALLOW_DEMO_SEED`
- `RESERVATION_CLEANUP_ENABLED` / `RESERVATION_CLEANUP_INTERVAL_SECONDS`

Include `private_uploads/` in backups alongside public `uploads/`.
