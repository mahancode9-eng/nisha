# Notifications (SMS + Email)

Nisha uses a **transactional outbox** for notifications:

1. Business code enqueues a notification (`enqueue_sms` / `enqueue_email` in
   `backend/app/services/notification_service.py`) inside the same DB
   transaction as the change itself.
2. A background worker (started with the API process) polls the
   `notification_outbox` table every `NOTIFY_POLL_INTERVAL_SECONDS` and
   delivers due rows.
3. Failures are retried with exponential backoff (1m, 4m, 16m, ...) up to
   `NOTIFY_MAX_ATTEMPTS`, then marked `failed` with the last error stored on
   the row.

Templates are Persian and live in `TEMPLATES` in the service module. Current
templates: `order_placed_buyer`, `order_placed_seller`,
`payment_uploaded_seller`, `order_status_changed`, `test_message`.

## Automatic order-lifecycle hooks (task 12)

Implemented in `backend/app/services/order_notification_service.py`:

| Event | Recipient | Channel | Template |
| --- | --- | --- | --- |
| Order placed | buyer (`buyer_phone`) | SMS | `order_placed_buyer` |
| Order placed | seller (store owner email) | Email | `order_placed_seller` |
| Payment proof uploaded | seller | Email | `payment_uploaded_seller` |
| Status changed to confirmed / rejected / preparing / shipped / delivered / cancelled | buyer | SMS | `order_status_changed` |

Hook points:

- `checkout_service.create_guest_order` calls `notify_order_placed` inside the
  order transaction.
- `order_access_service.append_status_history` calls `notify_status_change`,
  so every recorded status change (seller confirm/reject/update, guest
  payment-proof upload, customer-portal cancellation) is covered
  automatically without extra wiring.

Persian status labels live in `STATUS_LABELS` in the same module. Enqueue
errors are logged and **never break the order flow**.

## Providers

Providers are selected via environment variables. The default `console`
providers only log the message, so **development, tests and CI need no
credentials** and nothing is actually sent.

### SMS

| Variable | Values | Notes |
| --- | --- | --- |
| `SMS_PROVIDER` | `console` (default), `kavenegar` | |
| `KAVENEGAR_API_KEY` | string | required for `kavenegar` |
| `SMS_SENDER` | string | optional dedicated sender line |

To use another Iranian SMS gateway (SMS.ir, Melipayamak, ...), add a small
provider class implementing `send(to, text)` and extend `get_sms_provider`.

### Email

| Variable | Values | Notes |
| --- | --- | --- |
| `EMAIL_PROVIDER` | `console` (default), `smtp`, `resend` | |
| `SMTP_HOST` / `SMTP_PORT` | host / port (default 587) | required for `smtp` |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | credentials | optional for open relays |
| `SMTP_USE_TLS` | `true` (default) / `false` | STARTTLS |
| `EMAIL_FROM` | address | required for `resend`; falls back to `SMTP_USERNAME` for `smtp` |
| `RESEND_API_KEY` | string | required for `resend`; replace placeholder with real key |
| `FRONTEND_BASE_URL` | URL | base URL for verification links in emails |

When `EMAIL_PROVIDER=resend`, delivery follows [Resend production
practices](https://resend.com/docs):

- **Single send** (`POST /emails`) for one notification; **batch send**
  (`POST /emails/batch`) when the worker delivers 2+ pending emails in the
  same poll (max 100 per batch).
- **Idempotency keys** on every send: `{template}/{outbox_id}` for singles,
  `batch-notification-outbox/{first_id}-{last_id}` for batches. Safe outbox
  retries will not duplicate emails within 24 hours.
- **In-provider retries** with exponential backoff (1s, 2s, 4s, … up to 5
  attempts) for HTTP 429 and 500 only.
- **Permanent failures** (HTTP 400, 401, 403, 409, 422) mark the outbox row
  `failed` immediately without further retries.

## Worker

| Variable | Default | Notes |
| --- | --- | --- |
| `NOTIFY_WORKER_ENABLED` | `true` | worker only runs against PostgreSQL |
| `NOTIFY_POLL_INTERVAL_SECONDS` | `15` | |
| `NOTIFY_MAX_ATTEMPTS` | `5` | then the row is marked `failed` |

Templates use UTF-8 Persian text (not `\\u` escape sequences). Authentication
emails (`email_verification`, `password_recovery_code`) include a branded RTL
HTML layout with a plain-text fallback. Order notifications use a simple HTML
paragraph layout plus plain text.

All variables are passed through in `docker-compose.prod.yml` and
`docker-compose.yml`; set them in the repo root `.env` file when using Docker.

Verification emails are sent **immediately** on register/resend (via
`issue_verification`) and also picked up by the background worker if delivery
fails.

### Docker Compose (local dev)

Root `.env` must include at minimum:

```env
JWT_SECRET_KEY=...
RESEND_API_KEY=re_your_real_key
EMAIL_PROVIDER=resend
EMAIL_FROM=Nisha <noreply@your-verified-domain.com>
FRONTEND_BASE_URL=http://localhost:3000
```

Use `http://localhost:3000` for `FRONTEND_BASE_URL` while testing locally so
verification links open your local frontend. Use your production URL in
production.

Ensure the domain is **verified** in the [Resend dashboard](https://resend.com)
and `EMAIL_FROM` uses that domain.

### Debugging failed emails

```sql
SELECT id, status, last_error, template, recipient, attempts
FROM notification_outbox
WHERE recipient = 'user@example.com'
ORDER BY id DESC;
```

- `status = failed` with `403` / invalid API key → fix `RESEND_API_KEY` or domain
- `status = pending` → worker has not delivered yet; check `NOTIFY_WORKER_ENABLED`
- Re-queue: `UPDATE notification_outbox SET status = 'pending', attempts = 0, next_attempt_at = now() WHERE id = <id>;`

### Unverified re-registration

If a user registers but never receives the verification email, registering
again with the same email **updates the unverified account** and sends a new
verification email. Verified emails still return HTTP 409.

## Enqueuing from code

```python
from app.services.notification_service import enqueue_sms

enqueue_sms(
    db,
    order.buyer_phone,
    "order_status_changed",
    {
        "invoice_code": order.invoice_code,
        "store_name": store.name,
        "status_label": "ارسال شد",
    },
)
# the surrounding service commits; the worker delivers it asynchronously
```

## Operations

- Failed rows: `SELECT * FROM notification_outbox WHERE status = 'failed';`
- Re-queue a failed row:
  `UPDATE notification_outbox SET status = 'pending', attempts = 0, next_attempt_at = now() WHERE id = <id>;`
