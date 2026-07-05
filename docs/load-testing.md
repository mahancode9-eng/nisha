# Load Testing (k6)

Load tests verify the stack stays healthy under realistic traffic before
launch. Scenarios live in `loadtest/`.

## Rules

- **Never run load tests against production.** Target staging only
  (see `docs/staging.md`).
- Run from a machine with a stable connection (ideally another server, not
  your laptop on Wi-Fi) so network noise does not skew results.

## Install k6

- Windows: `winget install k6 --source winget`
- macOS: `brew install k6`
- Linux: see https://k6.io/docs/get-started/installation/

## Scenarios

| File                   | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `loadtest/k6-smoke.js` | 5 users / 30s sanity check after deploys    |
| `loadtest/k6-load.js`  | Ramp to 100 concurrent users over ~7 min    |

## Running

```bash
k6 run -e API_URL=https://api-staging.yourdomain.com \
       -e WEB_URL=https://staging.yourdomain.com \
       loadtest/k6-smoke.js
```

Without `-e` flags the scripts target the local dev stack
(`http://localhost:9000` API, `http://localhost:3000` web).

## Reading results

- `http_req_failed` - error rate; smoke must stay under 1%, load under 2%.
- `http_req_duration p(95)` - 95% of requests must finish under the threshold
  (500ms smoke, 800ms load).
- If thresholds fail, k6 exits non-zero and prints which one broke.

## Next steps (after staging exists)

- Add authenticated scenarios (login -> browse -> checkout) once staging has
  seeded test data.
- Record baseline numbers in this file after the first successful run so
  regressions are easy to spot.
