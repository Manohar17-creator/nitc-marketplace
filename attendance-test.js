import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:3000';
// 👇 REPLACE THIS TOKEN BEFORE RUNNING
const TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGYzMjc0YTdkYjIwMzNlOWQ1ZTMxMmIiLCJpYXQiOjE3NjYwNDU0NTgsImV4cCI6MTc2ODYzNzQ1OH0.3Ni2Wfmv8cCEYQlQWi0TwKZMFugljzZzQtdAhBpnkxc'; 

export default function () {
  const params = {
    headers: {
      'Authorization': TOKEN,
      'Content-Type': 'application/json',
    },
  };

  // HARDCODED URL
  const testUrl = 'http://localhost:3000/api/attendance/get?date=2025-12-19';

  console.log('Testing URL: ' + testUrl); // This proves the new code is running

  let res = http.get(testUrl, params);
  
  if (res.status !== 200) {
    console.log('❌ FAILED: Status ' + res.status + ' | URL: ' + res.url);
  }

  check(res, {
    'Status is 200': (r) => r.status === 200,
    'Data loaded fast': (r) => r.timings.duration < 2000,
  });

  sleep(1); 
}
