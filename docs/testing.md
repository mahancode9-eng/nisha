# Testing

## Backend - pytest + coverage

```bash
cd backend
pip install -r requirements.txt
python -m pytest -v
```

Coverage is configured in `backend/pytest.ini` (`pytest-cov`), so every test
run - locally and in CI - prints a coverage summary with uncovered lines.
Fully covered files are hidden from the report to keep it readable.

Guideline: new endpoints/services should ship with tests. Once coverage is
stable, add `--cov-fail-under=<percent>` to `pytest.ini` to enforce a minimum.

## End-to-end - Playwright

E2E tests live in `e2e/` as a standalone package (kept out of `frontend/` so
the frontend lockfile and CI build stay untouched).

One-time setup:

```bash
cd e2e
npm install
npx playwright install --with-deps chromium
```

Run against the local stack (frontend on :3000, backend on :9000):

```bash
docker compose up -d   # from repo root, or run dev servers manually
cd e2e
npm test
```

Configuration via environment variables:

| Variable       | Default                  | Purpose                    |
| -------------- | ------------------------ | -------------------------- |
| `E2E_BASE_URL` | `http://localhost:3000`  | Frontend under test        |
| `E2E_API_URL`  | `http://localhost:9000`  | Backend API under test     |

To run the same smoke suite against staging, point the variables at the
staging URLs (see `docs/staging.md`).

CI integration for E2E (booting the full stack inside GitHub Actions) is
planned once the staging server exists - for now run E2E locally before
releases.
