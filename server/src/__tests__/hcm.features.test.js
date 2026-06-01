/**
 * End-to-end API feature tests (in-memory Firestore + mock Auth).
 * Run: npm test (from server/ or repo root)
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTestHarness, logPass } from './helpers/testHarness.js';

/** @type {Awaited<ReturnType<typeof createTestHarness>>} */
let harness;

describe('Mini HCM feature verification', () => {
  before(async () => {
    console.log('\n--- Booting test API (in-memory Firestore) ---');
    harness = await createTestHarness();
    console.log(`--- Listening at ${harness.baseUrl} ---\n`);
  });

  after(async () => {
    await harness.close();
    console.log('\n--- Test API stopped ---\n');
  });

  describe('AUTH', () => {
    it('user registration works', async () => {
      const token = harness.bearer('new-user-001');
      const res = await harness.request('POST', '/api/auth/register', {
        token,
        body: { fullName: 'New Hire' },
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.role, 'employee');
      assert.equal(res.body.fullName, 'New Hire');

      const me = await harness.request('GET', '/api/auth/me', { token });
      assert.equal(me.status, 200);
      assert.equal(me.body.uid, 'new-user-001');
      logPass('user registration works');
    });

    it('login works (valid token + profile)', async () => {
      const token = harness.bearer('emp-001');
      const res = await harness.request('GET', '/api/auth/me', { token });

      assert.equal(res.status, 200);
      assert.equal(res.body.email, 'employee@test.com');
      assert.equal(res.body.role, 'employee');
      logPass('login works (valid token + profile)');
    });

    it('invalid login fails', async () => {
      const res = await harness.request('GET', '/api/auth/me', {
        token: 'Bearer not-a-real-token',
      });

      assert.equal(res.status, 401);
      assert.equal(res.body.error.code, 'UNAUTHORIZED');
      logPass('invalid login fails');
    });
  });

  describe('ATTENDANCE', () => {
    it('punch in works', async () => {
      const token = harness.bearer('emp-001');
      const res = await harness.request('POST', '/api/attendance/punch-in', { token, body: {} });

      assert.equal(res.status, 201);
      assert.equal(res.body.status, 'open');
      assert.ok(res.body.timeIn);
      logPass('punch in works');
    });

    it('duplicate punch in blocked', async () => {
      const token = harness.bearer('emp-001');
      const res = await harness.request('POST', '/api/attendance/punch-in', { token, body: {} });

      assert.equal(res.status, 409);
      assert.equal(res.body.error.code, 'ALREADY_PUNCHED_IN');
      logPass('duplicate punch in blocked');
    });

    it('punch out works', async () => {
      const token = harness.bearer('emp-001');
      const res = await harness.request('POST', '/api/attendance/punch-out', { token, body: {} });

      assert.equal(res.status, 200);
      assert.equal(res.body.attendance.status, 'closed');
      assert.ok(res.body.attendance.timeOut);
      assert.ok(res.body.dailySummary);
      logPass('punch out works');
    });

    it('missing punch out handled (no open attendance)', async () => {
      const token = harness.bearer('emp-001');
      const res = await harness.request('POST', '/api/attendance/punch-out', { token, body: {} });

      assert.equal(res.status, 409);
      assert.equal(res.body.error.code, 'NO_OPEN_ATTENDANCE');
      logPass('missing punch out handled');
    });
  });

  describe('DAILY SUMMARY', () => {
    it('data aggregates correctly per day', async () => {
      const workDate = '2026-06-12';
      const adminToken = harness.bearer('admin-001');

      const create = await harness.request('POST', '/api/admin/attendance', {
        token: adminToken,
        body: {
          userId: 'emp-001',
          date: workDate,
          timeIn: harness.isoAt(workDate, '09:00'),
          timeOut: harness.isoAt(workDate, '19:00'),
          reason: 'Test seed for daily summary aggregation',
        },
      });

      assert.equal(create.status, 201);
      assert.equal(create.body.attendance.regularHours, 9);
      assert.equal(create.body.attendance.overtimeHours, 1);
      assert.equal(create.body.attendance.lateMinutes, 0);

      const employeeToken = harness.bearer('emp-001');
      const summary = await harness.request('GET', '/api/summaries/daily', {
        token: employeeToken,
        query: { date: workDate },
      });

      assert.equal(summary.status, 200);
      assert.equal(summary.body.data.date, workDate);
      assert.equal(summary.body.data.totalRegularHours, 9);
      assert.equal(summary.body.data.totalOvertimeHours, 1);
      assert.equal(summary.body.data.totalLateMinutes, 0);
      logPass('data aggregates correctly per day');
    });
  });

  describe('ADMIN', () => {
    it('admin can access protected routes', async () => {
      const token = harness.bearer('admin-001');
      const res = await harness.request('GET', '/api/admin/users', { token });

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.items));
      assert.ok(res.body.items.some((u) => u.role === 'admin'));
      logPass('admin can access protected routes');
    });

    it('non-admin cannot access admin routes', async () => {
      const token = harness.bearer('emp-001');
      const res = await harness.request('GET', '/api/admin/users', { token });

      assert.equal(res.status, 403);
      assert.equal(res.body.error.code, 'FORBIDDEN');
      logPass('non-admin cannot access admin routes');
    });
  });
});
