import http from 'k6/http';
import { check, sleep } from 'k6';

// 👇 CONFIGURATION (Stress Test: 400 Users)
export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp up to 100
    { duration: '1m',  target: 400 }, // Push to 400 (Stress Test)
    { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Allow 2s max (since load is heavy)
    http_req_failed: ['rate<0.05'],    // Allow 5% failure (due to DB limits)
  },
};

const BASE_URL = 'http://localhost:3000'; 

export default function () {
  // 1. Load the Page HTML (Static/Fast)
  let resHome = http.get(`${BASE_URL}/`);
  
  check(resHome, {
    'Home HTML status is 200': (r) => r.status === 200,
  });

  // 2. Simulate the Browser fetching Data (The Heavy Part)
  // This hits your DB. If 400 users do this at once, DB might choke.
  // We use "batch" to simulate parallel requests (Listings + Ads)
  let responses = http.batch([
    ['GET', `${BASE_URL}/api/listings`], // Or /api/listings if you have it
    ['GET', `${BASE_URL}/api/ads`],
  ]);

  check(responses[0], {
    'API Data status is 200': (r) => r.status === 200,
  });

  sleep(2); // User reads the page for 2 seconds
}