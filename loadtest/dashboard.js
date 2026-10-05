// Realistic dashboard load: each virtual user loads the dashboard (who am I, my groups,
// unread count), then reads for 3 to 7 seconds. Steps up to 400, 800, 1,200 and 1,600 users.
//
// Run (Docker, against a local stack):
//   docker run --rm -i -e BASE_URL=http://host.docker.internal -e JWT=<jwt cookie value> \
//     grafana/k6 run --summary-trend-stats "med,p(95)" - < loadtest/dashboard.js
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost";
const params = { headers: { Host: __ENV.HOST_HEADER || "localhost", Cookie: `jwt=${__ENV.JWT}` } };

export const options = {
  scenarios: {
    ramp: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 400 }, { duration: "45s", target: 400 },
        { duration: "30s", target: 800 }, { duration: "45s", target: 800 },
        { duration: "30s", target: 1200 }, { duration: "45s", target: 1200 },
        { duration: "30s", target: 1600 }, { duration: "45s", target: 1600 },
      ],
    },
  },
  summaryTrendStats: ["med", "p(95)"],
};

export function setup() {
  if (!__ENV.JWT) throw new Error("Set JWT to the value of a signed-in user's jwt cookie");
}

export default function () {
  const responses = http.batch([
    ["GET", `${BASE}/auth/me`, null, params],
    ["GET", `${BASE}/api/v1/groups/`, null, params],
    ["GET", `${BASE}/api/v1/notifications/unread-count`, null, params],
  ]);
  responses.forEach((r) => check(r, { "status 200": (x) => x.status === 200 }));
  sleep(3 + Math.random() * 4);
}
