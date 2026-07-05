// Load test - ramps traffic up to find the breaking point of the stack.
// ONLY run this against staging, never against production.
// Usage:
//   k6 run -e API_URL=https://api-staging.yourdomain.com \
//          -e WEB_URL=https://staging.yourdomain.com \
//          loadtest/k6-load.js

import http from "k6/http";
import { check, sleep } from "k6";

const API_URL = __ENV.API_URL || "http://localhost:9000";
const WEB_URL = __ENV.WEB_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "1m", target: 20 }, // warm up
    { duration: "3m", target: 50 }, // normal load
    { duration: "2m", target: 100 }, // peak load
    { duration: "1m", target: 0 }, // cool down
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<800", "p(99)<1500"],
  },
};

export default function () {
  const health = http.get(`${API_URL}/api/v1/health`);
  check(health, { "API health is 200": (r) => r.status === 200 });

  const home = http.get(WEB_URL);
  check(home, { "homepage is 200": (r) => r.status === 200 });

  sleep(Math.random() * 2 + 1); // 1-3s think time, like real users
}
