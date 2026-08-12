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

async function runAudit() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log(' FARMFLEET — COMPLETE SYSTEM API & AUTH AUDIT');
  console.log('══════════════════════════════════════════════════════\n');

  // ─── 1. System Health Check ───
  await test('Root Health Check', 'GET', '/');

  // ─── 2. Farmer Module ───
  const ts = Date.now();
  const farmerEmail = `farmer_${ts}@audittest.com`;
  const farmerPw = 'audit_pass_2026';
  const farmerMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

  await test('Farmer Signup (new user)', 'POST', '/api/farmer/signup', {
    fullName: 'Audit Farmer',
    email: farmerEmail,
    mobile: farmerMobile,
    password: farmerPw,
    village: 'Igatpuri',
    district: 'Nashik',
    state: 'Maharashtra',
  }, null, [200, 201]);

  await test('Farmer Signup (duplicate email)', 'POST', '/api/farmer/signup', {
    fullName: 'Audit Farmer 2',
    email: farmerEmail,
    mobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
    password: farmerPw,
    district: 'Nashik',
    state: 'Maharashtra',
  }, null, [400]);

  const farmerLoginRes = await makeRequest('POST', '/api/farmer/login', { email: farmerEmail, password: farmerPw });
  const farmerToken = farmerLoginRes?.data?.token || null;
  console.log(`   🔑 Farmer Token Acquired: ${farmerToken ? 'YES ✅' : 'NO ❌'}`);

  await test('Farmer Login (valid credentials)', 'POST', '/api/farmer/login', { email: farmerEmail, password: farmerPw }, null, [200]);
  await test('Farmer Login (wrong password)', 'POST', '/api/farmer/login', { email: farmerEmail, password: 'wrong_pass!' }, null, [400, 401]);
  await test('Farmer Profile (valid token)', 'GET', '/api/farmer/profile', null, farmerToken, [200]);
  await test('Farmer Profile (no token)', 'GET', '/api/farmer/profile', null, null, [401]);
  await test('Farmer Profile (bad token)', 'GET', '/api/farmer/profile', null, 'bad_token_string', [401]);

  // ─── 3. Owner Module ───
  const ownerEmail = `owner_${ts}@audittest.com`;
  const ownerPw = 'owner_audit_2026';
  const ownerMobile = `8${Math.floor(100000000 + Math.random() * 900000000)}`;

  await test('Owner Signup (new user)', 'POST', '/api/owner/signup', {
    fullName: 'Audit Owner',
    email: ownerEmail,
    mobile: ownerMobile,
    password: ownerPw,
    village: 'Khed',
    district: 'Pune',
    state: 'Maharashtra',
  }, null, [200, 201]);

  await test('Owner Signup (duplicate email)', 'POST', '/api/owner/signup', {
    fullName: 'Audit Owner 2',
    email: ownerEmail,
    mobile: `8${Math.floor(100000000 + Math.random() * 900000000)}`,
    password: ownerPw,
    village: 'Khed',
    district: 'Pune',
    state: 'Maharashtra',
  }, null, [400]);

  const ownerLoginRes = await makeRequest('POST', '/api/owner/login', { email: ownerEmail, password: ownerPw });
  const ownerToken = ownerLoginRes?.data?.token || null;
  console.log(`   🔑 Owner Token Acquired: ${ownerToken ? 'YES ✅' : 'NO ❌'}`);

  await test('Owner Login (valid credentials)', 'POST', '/api/owner/login', { email: ownerEmail, password: ownerPw }, null, [200]);
  await test('Owner Login (wrong password)', 'POST', '/api/owner/login', { email: ownerEmail, password: 'wrong!' }, null, [400, 401]);
  await test('Owner Profile (valid token)', 'GET', '/api/owner/profile', null, ownerToken, [200]);
  await test('Owner Profile (no token)', 'GET', '/api/owner/profile', null, null, [401]);

  // ─── 4. Labour Module ───
  const labourEmail = `labour_${ts}@audittest.com`;
  const labourPw = 'labour_audit_2026';
  const labourMobile = `7${Math.floor(100000000 + Math.random() * 900000000)}`;

  await test('Labour Signup (new user)', 'POST', '/api/labour/signup', {
    fullName: 'Audit Worker',
    email: labourEmail,
    mobile: labourMobile,
    password: labourPw,
    village: 'Baramati',
    district: 'Pune',
    state: 'Maharashtra',
    primarySkill: 'Tractor Operator',
    experience: '5-10 Years',
    dailyCharges: 500,
  }, null, [200, 201]);

  const labourLoginRes = await makeRequest('POST', '/api/labour/login', { email: labourEmail, password: labourPw });
  const labourToken = labourLoginRes?.data?.token || null;
  console.log(`   🔑 Labour Token Acquired: ${labourToken ? 'YES ✅' : 'NO ❌'}`);

  await test('Labour Login (valid credentials)', 'POST', '/api/labour/login', { email: labourEmail, password: labourPw }, null, [200]);
  await test('Labour Profile (valid token)', 'GET', '/api/labour/profile', null, labourToken, [200]);
  await test('Labour Dashboard (valid token)', 'GET', '/api/labour/dashboard', null, labourToken, [200]);
  await test('Get Public Labours (public)', 'GET', '/api/labour/public', null, null, [200]);

  // ─── 5. Equipment Module ───
  await test('List All Equipment (public)', 'GET', '/api/equipment/all');
  await test('Get Equipment by Zero ID (not found)', 'GET', '/api/equipment/000000000000000000000000', null, null, [400, 404]);
  await test('Add Equipment (no token — must reject)', 'POST', '/api/equipment/add', { name: 'Test Tractor', type: 'Tractor' }, null, [401]);

  let equipmentId = null;
  if (ownerToken) {
    const addRes = await makeRequest('POST', '/api/equipment/add', {
      name: 'Audit Test Tractor',
      type: 'Tractor',
      brand: 'Mahindra',
      model: '575 DI',
      horsepower: 45,
      pricePerDay: 1000,
      pricePerHour: 150,
      location: 'Nashik, Maharashtra',
    }, ownerToken);
    const ok = [200, 201].includes(addRes.status);
    console.log(`${ok ? '✅' : '❌'} [${addRes.status}] POST /api/equipment/add — Add Equipment (owner)`);
    if (ok) equipmentId = addRes.data?.equipment?._id || addRes.data?._id;

    await test('List Owner Equipment (authed)', 'GET', '/api/equipment/owner', null, ownerToken, [200]);
  }

  if (equipmentId) {
    await test('Get Equipment by Valid ID', 'GET', `/api/equipment/${equipmentId}`, null, null, [200]);
    await test('Update Equipment (owner token)', 'PUT', `/api/equipment/${equipmentId}`, { rentalRate: 1200 }, ownerToken, [200]);
    await test('Update Equipment (no token — reject)', 'PUT', `/api/equipment/${equipmentId}`, { rentalRate: 999 }, null, [401]);
  }

  // ─── 6. Bookings Module ───
  await test('Get Farmer Bookings (valid token)', 'GET', '/api/booking/farmer', null, farmerToken, [200]);
  await test('Get Farmer Bookings (no token)', 'GET', '/api/booking/farmer', null, null, [401]);
  await test('Get Owner Bookings (valid token)', 'GET', '/api/booking/owner', null, ownerToken, [200]);
  await test('Get Owner Bookings (no token)', 'GET', '/api/booking/owner', null, null, [401]);

  if (farmerToken && equipmentId) {
    await test('Create Booking (valid farmer)', 'POST', '/api/booking/create', {
      equipmentId,
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      totalCost: 4000,
    }, farmerToken, [200, 201]);

    await test('Create Booking (malformed dates)', 'POST', '/api/booking/create', {
      equipmentId,
      startDate: 'not-a-date',
      endDate: 'bad',
    }, farmerToken, [400, 422, 500]);
  }

  // ─── 7. Reviews Module ───
  await test('Get Public Reviews', 'GET', '/api/reviews/public', null, null, [200]);

  // ─── 8. Weather Module ───
  await test('Weather Current (valid farmer token)', 'GET', '/api/weather/current?city=Nashik', null, farmerToken, [200]);
  await test('Weather Current (no token — reject)', 'GET', '/api/weather/current?city=Nashik', null, null, [401]);
  await test('Weather Report (valid farmer token)', 'GET', '/api/weather/report?city=Nashik', null, farmerToken, [200]);

  // ─── 9. PDF Module ───
  await test('PDF Generate (missing ID — 404/405)', 'POST', '/api/pdf/generate/', {}, null, [400, 404, 405]);

  // ─── 10. Final Summary ───
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log('\n══════════════════════════════════════════════════════');
  console.log(` AUDIT RESULTS: ${passed} / ${total} PASSED`);
  if (failed.length > 0) {
    console.log('\n Failed tests:');
    failed.forEach((f) => console.log(`  ❌ [${f.status}] ${f.method} ${f.path} — ${f.name}`));
  } else {
    console.log('\n 🎉 ALL ENDPOINT TESTS PASSED PERFECTLY!');
  }
  console.log('══════════════════════════════════════════════════════\n');
}

runAudit().catch(console.error);
