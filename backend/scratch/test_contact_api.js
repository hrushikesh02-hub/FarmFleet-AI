'use strict';

require('dotenv').config();
const http = require('http');

const BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch { json = data; }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', (err) => resolve({ status: 0, error: err.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const results = [];

async function test(name, method, path, body = null, token = null, expectedStatuses = [200, 201]) {
  const res = await makeRequest(method, path, body, token);
  const passed = expectedStatuses.includes(res.status);
  results.push({ name, method, path, status: res.status, passed });
  console.log(`${passed ? '✅' : '❌'} [${res.status}] ${method} ${path} — ${name}`);
  if (!passed) {
    const snippet = JSON.stringify(res.data || res.error || '').slice(0, 150);
    console.log(`   ↳ ${snippet}`);
  }
  return res;
}

async function runContactTests() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log(' FARMFLEET — CONTACT BACKEND & VALIDATION TEST SUITE');
  console.log('══════════════════════════════════════════════════════\n');

  const ts = Date.now();

  // 1. Acquire Farmer, Owner, Labour Tokens
  const farmerEmail = `farmer_${ts}@contacttest.com`;
  const farmerPw = 'pass_2026';
  await makeRequest('POST', '/api/farmer/signup', {
    fullName: 'Contact Farmer', email: farmerEmail, mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
    password: farmerPw, village: 'Nashik', district: 'Nashik', state: 'Maharashtra',
  });
  const farmerLogin = await makeRequest('POST', '/api/farmer/login', { email: farmerEmail, password: farmerPw });
  const farmerToken = farmerLogin?.data?.token || null;

  const ownerEmail = `owner_${ts}@contacttest.com`;
  const ownerPw = 'pass_2026';
  await makeRequest('POST', '/api/owner/signup', {
    fullName: 'Contact Owner', email: ownerEmail, mobile: `8${Math.floor(100000000 + Math.random() * 900000000)}`,
    password: ownerPw, village: 'Pune', district: 'Pune', state: 'Maharashtra',
  });
  const ownerLogin = await makeRequest('POST', '/api/owner/login', { email: ownerEmail, password: ownerPw });
  const ownerToken = ownerLogin?.data?.token || null;

  const labourEmail = `labour_${ts}@contacttest.com`;
  const labourPw = 'pass_2026';
  await makeRequest('POST', '/api/labour/signup', {
    fullName: 'Contact Labour', email: labourEmail, mobile: `7${Math.floor(100000000 + Math.random() * 900000000)}`,
    password: labourPw, village: 'Satara', district: 'Satara', state: 'Maharashtra',
    primarySkill: 'Driver', experience: '1-3 Years', dailyCharges: 400,
  });
  const labourLogin = await makeRequest('POST', '/api/labour/login', { email: labourEmail, password: labourPw });
  const labourToken = labourLogin?.data?.token || null;

  // 2. Test Guest Contact Submission
  await test('Guest Contact Submission', 'POST', '/api/contact', {
    name: 'Guest Tester',
    email: 'guest@example.com',
    subject: 'General Question from Guest',
    message: 'Hello, I would like to inquire about farm equipment availability in Maharashtra.',
  }, null, [200]);

  // 3. Test Owner Contact Submission
  await test('Owner Contact Submission', 'POST', '/api/contact', {
    name: 'Contact Owner',
    email: ownerEmail,
    subject: 'Equipment Listing Support Inquiry',
    message: 'I have listed 2 tractors and would like to update availability settings.',
  }, ownerToken, [200]);

  // 4. Test Renter / Farmer Contact Submission
  await test('Renter (Farmer) Contact Submission', 'POST', '/api/contact', {
    name: 'Contact Farmer',
    email: farmerEmail,
    subject: 'Booking Assistance Request',
    message: 'I need assistance booking a harvester for next week.',
  }, farmerToken, [200]);

  // 5. Test Labour Contact Submission
  await test('Labour Contact Submission', 'POST', '/api/contact', {
    name: 'Contact Labour',
    email: labourEmail,
    subject: 'Profile Verification Query',
    message: 'How can I update my primary skill certificate on FarmFleet?',
  }, labourToken, [200]);

  // 6. Validation Failure Tests
  await test('Validation Fail — Empty Name', 'POST', '/api/contact', {
    name: '', email: 'test@example.com', subject: 'Subject', message: 'Message text',
  }, null, [400]);

  await test('Validation Fail — Invalid Email Format', 'POST', '/api/contact', {
    name: 'Valid Name', email: 'not-an-email', subject: 'Subject', message: 'Message text',
  }, null, [400]);

  await test('Validation Fail — Empty Subject', 'POST', '/api/contact', {
    name: 'Valid Name', email: 'valid@example.com', subject: '', message: 'Message text',
  }, null, [400]);

  await test('Validation Fail — Empty Message', 'POST', '/api/contact', {
    name: 'Valid Name', email: 'valid@example.com', subject: 'Subject', message: '',
  }, null, [400]);

  await test('Validation Fail — Overly Long Subject (>200 chars)', 'POST', '/api/contact', {
    name: 'Valid Name', email: 'valid@example.com', subject: 'A'.repeat(205), message: 'Message text',
  }, null, [400]);

  // 7. Summary
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log('\n══════════════════════════════════════════════════════');
  console.log(` CONTACT SUITE RESULTS: ${passed} / ${total} PASSED`);
  if (failed.length > 0) {
    console.log('\n Failed tests:');
    failed.forEach((f) => console.log(`  ❌ [${f.status}] ${f.method} ${f.path} — ${f.name}`));
  } else {
    console.log('\n 🎉 ALL CONTACT TESTS PASSED PERFECTLY!');
  }
  console.log('══════════════════════════════════════════════════════\n');
}

runContactTests().catch(console.error);
