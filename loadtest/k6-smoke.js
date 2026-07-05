// Smoke test - a light sanity check that the stack handles minimal load.
// Usage:
//   k6 run -e API_URL=https://api-staging.yourdomain.com \
//          -e WEB_URL=https://staging.yourdomain.com \
//          loadtest/k6-smoke.js

import http from "k6/http";
import { check, sleep } from "k6";

const API_URL = __ENV.API_URL || "http://localhost:9000";
const WEB_URL = __ENV.WEB_URL || "http://localhost:3000";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const health = http.get(`${API_URL}/api/v1/health`);
  check(health, { "API health is 200": (r) => r.status === 200 });

  const home = http.get(WEB_URL);
  check(home, { "homepage is 200": (r) => r.status === 200 });

  sleep(1);
}
