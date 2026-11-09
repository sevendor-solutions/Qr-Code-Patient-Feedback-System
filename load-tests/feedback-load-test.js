import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // ramp up to 100 VUs
    { duration: '1m', target: 500 },  // ramp up to 500 concurrent users
    { duration: '30s', target: 500 }, // sustain 500 VUs
    { duration: '30s', target: 0 },   // ramp down to 0
  ],
  thresholds: {
    // 95% of requests must complete below 2 seconds (requirement)
    http_req_duration: ['p(95)<2000'],
    // Request failure rate must be less than 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api';
const HOSPITAL_ID = '960cc5db-728e-4bf8-840f-cb2c17431772';
const DEPT_ID = 'f0ce19ee-83dd-45b3-b54c-2c8336b3d7e5';
const QR_TOKEN = '87a09bb565b8a9ebbc0c1e573a0407333d82f7a7c7ba55b4922b48bbbc212551';

export default function () {
  // 1. Verify QR Token
  const verifyRes = http.get(
    `${BASE_URL}/qr/verify?h=${HOSPITAL_ID}&d=${DEPT_ID}&t=${QR_TOKEN}`,
  );
  check(verifyRes, {
    'QR Token Verified (Status 200)': (r) => r.status === 200,
    'QR Valid is true': (r) => JSON.parse(r.body).valid === true,
  });

  // 2. Submit Feedback with unique mobile to respect 3/day rate limit
  const uniqueMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const payload = JSON.stringify({
    hospitalId: HOSPITAL_ID,
    departmentId: DEPT_ID,
    qrToken: QR_TOKEN,
    language: 'en',
    patientName: `Load Tester ${__VU}-${__ITER}`,
    mobile: uniqueMobile,
    patientType: 'OPD',
    ratings: [
      { category: 'REGISTRATION', rating: 4 },
      { category: 'WAITING_TIME', rating: 3 },
      { category: 'DOCTOR', rating: 5 },
      { category: 'NURSING', rating: 4 },
      { category: 'CLEANLINESS', rating: 4 },
      { category: 'LAB', rating: 4 },
      { category: 'PHARMACY', rating: 4 },
      { category: 'BILLING', rating: 4 },
      { category: 'STAFF_BEHAVIOUR', rating: 5 },
    ],
    overallEmoji: 4,
    npsScore: 9,
    comments: 'Automated high-concurrency load test submission',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const submitRes = http.post(`${BASE_URL}/feedback/submit`, payload, params);
  check(submitRes, {
    'Feedback Submitted (Status 201)': (r) => r.status === 201,
    'Ticket ID generated': (r) => JSON.parse(r.body).ticketId !== undefined,
  });

  sleep(1);
}
