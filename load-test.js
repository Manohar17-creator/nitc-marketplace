import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, 
    { duration: '1m',  target: 200 }, // Target 200 users
    { duration: '30s', target: 400 }, // Stress test to 400
    { duration: '30s', target: 0 },   
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // Home page should be fast (<1s)
    http_req_failed: ['rate<0.01'],    
  },
};

const BASE_URL = 'https://www.unyfy.in'; 

export default function () {
  // We only hit the Home Page and the primary Public API
  let responses = http.batch([
    ['GET', `${BASE_URL}/`],
    ['GET', `${BASE_URL}/api/listings`], // Assuming this is your public feed
  ]);

  check(responses[0], { 'Home HTML OK': (r) => r.status === 200 });
  check(responses[1], { 'Public API OK': (r) => r.status === 200 });

  sleep(Math.random() * 3 + 2); 
}