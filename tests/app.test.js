'use strict';

const request = require('supertest');
const app = require('../src/app');
const { reset } = require('../src/db');

beforeEach(() => {
  reset(); // fresh in-memory DB before each test
});

// ─── Health ────────────────────────────────────────────────────────────────
describe('GET /health', () => {
  test('returns 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toBe('SafeGuard+');
  });
});

// ─── Users ─────────────────────────────────────────────────────────────────
describe('Users API', () => {
  const validUser = { name: 'Alice', email: 'alice@test.com', password: 'pass123', phone: '+61400000001' };

  test('POST /api/users/register — creates user successfully', async () => {
    const res = await request(app).post('/api/users/register').send(validUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body.user.password).toBeUndefined(); // password must not be returned
  });

  test('POST /api/users/register — rejects missing fields', async () => {
    const res = await request(app).post('/api/users/register').send({ email: 'x@x.com' });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/users/register — rejects invalid email', async () => {
    const res = await request(app).post('/api/users/register').send({ name: 'Bob', email: 'notanemail', password: '123' });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/users/register — rejects duplicate email', async () => {
    await request(app).post('/api/users/register').send(validUser);
    const res = await request(app).post('/api/users/register').send(validUser);
    expect(res.statusCode).toBe(409);
  });

  test('POST /api/users/login — succeeds with correct credentials', async () => {
    await request(app).post('/api/users/register').send(validUser);
    const res = await request(app).post('/api/users/login').send({ email: validUser.email, password: validUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(validUser.email);
  });

  test('POST /api/users/login — fails with wrong password', async () => {
    await request(app).post('/api/users/register').send(validUser);
    const res = await request(app).post('/api/users/login').send({ email: validUser.email, password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/users — returns all registered users', async () => {
    await request(app).post('/api/users/register').send(validUser);
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(1);
  });

  test('GET /api/users/:id — returns specific user', async () => {
    await request(app).post('/api/users/register').send(validUser);
    const res = await request(app).get('/api/users/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
  });

  test('GET /api/users/:id — 404 for unknown user', async () => {
    const res = await request(app).get('/api/users/999');
    expect(res.statusCode).toBe(404);
  });
});

// ─── SOS Alerts ────────────────────────────────────────────────────────────
describe('SOS API', () => {
  let userId;

  beforeEach(async () => {
    const reg = await request(app).post('/api/users/register').send({ name: 'Bob', email: 'bob@test.com', password: 'pass' });
    userId = reg.body.user.id;
  });

  test('POST /api/sos — triggers SOS alert', async () => {
    const res = await request(app).post('/api/sos').send({ userId, latitude: -37.81, longitude: 144.96 });
    expect(res.statusCode).toBe(201);
    expect(res.body.alert.status).toBe('active');
  });

  test('POST /api/sos — rejects missing coordinates', async () => {
    const res = await request(app).post('/api/sos').send({ userId });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/sos — rejects unknown user', async () => {
    const res = await request(app).post('/api/sos').send({ userId: 999, latitude: 0, longitude: 0 });
    expect(res.statusCode).toBe(404);
  });

  test('PATCH /api/sos/:id/resolve — resolves active alert', async () => {
    await request(app).post('/api/sos').send({ userId, latitude: -37.81, longitude: 144.96 });
    const res = await request(app).patch('/api/sos/1/resolve');
    expect(res.statusCode).toBe(200);
    expect(res.body.alert.status).toBe('resolved');
    expect(res.body.alert.resolvedAt).not.toBeNull();
  });

  test('PATCH /api/sos/:id/resolve — 400 when already resolved', async () => {
    await request(app).post('/api/sos').send({ userId, latitude: -37.81, longitude: 144.96 });
    await request(app).patch('/api/sos/1/resolve');
    const res = await request(app).patch('/api/sos/1/resolve');
    expect(res.statusCode).toBe(400);
  });

  test('GET /api/sos — filters by userId', async () => {
    await request(app).post('/api/sos').send({ userId, latitude: -37.81, longitude: 144.96 });
    const res = await request(app).get(`/api/sos?userId=${userId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(1);
  });
});

// ─── Trusted Contacts ──────────────────────────────────────────────────────
describe('Contacts API', () => {
  let userId;

  beforeEach(async () => {
    const reg = await request(app).post('/api/users/register').send({ name: 'Carol', email: 'carol@test.com', password: 'pass' });
    userId = reg.body.user.id;
  });

  test('POST /api/contacts — adds trusted contact', async () => {
    const res = await request(app).post('/api/contacts').send({ userId, name: 'Mum', phone: '+61400000002', relationship: 'family' });
    expect(res.statusCode).toBe(201);
    expect(res.body.contact.name).toBe('Mum');
  });

  test('POST /api/contacts — rejects invalid phone', async () => {
    const res = await request(app).post('/api/contacts').send({ userId, name: 'Mum', phone: 'notaphone' });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/contacts — enforces max 5 contacts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/contacts').send({ userId, name: `Contact${i}`, phone: `+6140000000${i}` });
    }
    const res = await request(app).post('/api/contacts').send({ userId, name: 'Extra', phone: '+61400000009' });
    expect(res.statusCode).toBe(400);
  });

  test('DELETE /api/contacts/:id — removes contact', async () => {
    await request(app).post('/api/contacts').send({ userId, name: 'Dad', phone: '+61400000003' });
    const res = await request(app).delete('/api/contacts/1');
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/contacts — returns contacts for user', async () => {
    await request(app).post('/api/contacts').send({ userId, name: 'Sister', phone: '+61400000004' });
    const res = await request(app).get(`/api/contacts?userId=${userId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(1);
  });
});

// ─── Location ──────────────────────────────────────────────────────────────
describe('Location API', () => {
  let userId;

  beforeEach(async () => {
    const reg = await request(app).post('/api/users/register').send({ name: 'Dave', email: 'dave@test.com', password: 'pass' });
    userId = reg.body.user.id;
  });

  test('POST /api/location/checkin — records check-in', async () => {
    const res = await request(app).post('/api/location/checkin').send({ userId, latitude: -33.87, longitude: 151.21 });
    expect(res.statusCode).toBe(201);
    expect(res.body.checkin.safetyStatus).toBe('safe');
  });

  test('POST /api/location/checkin — rejects invalid coordinates', async () => {
    const res = await request(app).post('/api/location/checkin').send({ userId, latitude: 200, longitude: 500 });
    expect(res.statusCode).toBe(400);
  });

  test('GET /api/location/latest — returns most recent check-in', async () => {
    await request(app).post('/api/location/checkin').send({ userId, latitude: -33.87, longitude: 151.21 });
    await request(app).post('/api/location/checkin').send({ userId, latitude: -37.81, longitude: 144.96 });
    const res = await request(app).get(`/api/location/latest?userId=${userId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.longitude).toBe(144.96);
  });

  test('GET /api/location/history — returns all check-ins', async () => {
    await request(app).post('/api/location/checkin').send({ userId, latitude: -33.87, longitude: 151.21 });
    const res = await request(app).get(`/api/location/history?userId=${userId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(1);
  });

  test('GET /api/location/latest — 404 when no check-ins', async () => {
    const res = await request(app).get(`/api/location/latest?userId=${userId}`);
    expect(res.statusCode).toBe(404);
  });
});

// ─── Metrics ───────────────────────────────────────────────────────────────
describe('GET /metrics', () => {
  test('returns Prometheus metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('safeguard_http_requests_total');
  });
});

// ─── 404 ───────────────────────────────────────────────────────────────────
describe('404 handler', () => {
  test('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.statusCode).toBe(404);
  });
});
