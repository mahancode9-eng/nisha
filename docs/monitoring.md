# Monitoring, logging & error tracking

## Sentry (error tracking)

The backend ships with the Sentry SDK. It is **disabled by default** and only
activates when a DSN is provided.

### Setup

1. Create a free account at <https://sentry.io> (or a self-hosted instance).
2. Create a **Python / FastAPI** project and copy its DSN.
3. On the production server, set the DSN in the compose environment/`.env`:

   ```bash
   SENTRY_DSN=https://xxxxx@xxxx.ingest.sentry.io/xxxxx
   SENTRY_TRACES_SAMPLE_RATE=0.1   # optional, % of requests traced
   ```

4. Redeploy. All unhandled server errors (HTTP 500) are now reported to
   Sentry, including the request context.

No DSN means Sentry is completely inactive (local development, CI, tests).

## Structured logs

- In production (`LOG_JSON=true`, already set in `docker-compose.prod.yml`)
  the backend emits **single-line JSON logs** to stdout:

  ```json
  {"timestamp": "2026-07-06T01:00:00+0000", "level": "INFO", "logger": "nisha", "message": "GET /api/v1/health 200 1.2ms", "request_id": "a1b2c3d4e5f60718", "method": "GET", "path": "/api/v1/health", "status_code": 200, "duration_ms": 1.2}
  ```

- In development the same information is logged as readable plain text.

### Request IDs

- Every request gets an `X-Request-ID` (generated, or taken from the incoming
  header if a reverse proxy already set one).
- The id is returned in the response headers and attached to every log line,
  so a user-reported error can be traced end-to-end.

## Log retention

All services in `docker-compose.prod.yml` use the Docker `json-file` logging
driver with rotation: **10 MB per file, 5 files max** (~50 MB per service).
Older logs are dropped automatically. Adjust in the `x-logging` block.

```bash
# tail live logs
docker compose -f docker-compose.prod.yml logs -f backend
```

## Uptime monitoring (manual step)

Add a free uptime check (e.g. UptimeRobot, Better Stack) against:

```
https://<your-domain>/api/v1/health
```

Alert channel: email or Telegram, checking every 1–5 minutes.
