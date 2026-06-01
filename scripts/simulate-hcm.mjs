#!/usr/bin/env node
/**
 * Mini HCM usage simulation — 5 employees, 1 admin, 3–5 days of attendance.
 *
 * Uses in-memory Firestore (no Firebase project required).
 * Verifies attendance + dailySummary storage and computation engine accuracy.
 *
 * Usage:
 *   npm run simulate
 *   npm run simulate -- --days=5 --seed=42
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverRoot = join(root, 'server');

function parseArgs() {
  const daysArg = process.argv.find((a) => a.startsWith('--days='));
  const seedArg = process.argv.find((a) => a.startsWith('--seed='));
  const days = daysArg ? Number(daysArg.split('=')[1]) : 5;
  const seed = seedArg ? Number(seedArg.split('=')[1]) : Date.now();
  if (!Number.isInteger(days) || days < 3 || days > 5) {
    throw new Error('--days must be 3, 4, or 5');
  }
  return { days, seed };
}

/** @param {number} seed */
function createRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** @param {number} totalMinutes */
function minutesToHHmm(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

/**
 * @param {() => number} rng
 */
function randomSchedule(rng) {
  const startMinutes = (7 + Math.floor(rng() * 3)) * 60 + (rng() > 0.5 ? 30 : 0);
  const endMinutes = (16 + Math.floor(rng() * 4)) * 60 + (rng() > 0.5 ? 0 : 30);
  return {
    start: minutesToHHmm(startMinutes),
    end: minutesToHHmm(Math.max(endMinutes, startMinutes + 8 * 60)),
  };
}

/**
 * @param {string} baseDate YYYY-MM-DD
 * @param {number} count
 */
function buildSimDates(baseDate, count) {
  const [y, m, d] = baseDate.split('-').map(Number);
  const dates = [];
  for (let i = 0; i < count; i += 1) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    dates.push(
      `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`,
    );
  }
  return dates;
}

const EMPLOYEES = [
  { uid: 'sim-emp-01', fullName: 'Ana Reyes', email: 'ana.reyes@sim.test' },
  { uid: 'sim-emp-02', fullName: 'Ben Cruz', email: 'ben.cruz@sim.test' },
  { uid: 'sim-emp-03', fullName: 'Carla Santos', email: 'carla.santos@sim.test' },
  { uid: 'sim-emp-04', fullName: 'Diego Lim', email: 'diego.lim@sim.test' },
  { uid: 'sim-emp-05', fullName: 'Ella Gomez', email: 'ella.gomez@sim.test' },
];

const ADMIN = {
  uid: 'sim-admin-01',
  fullName: 'Admin User',
  email: 'admin@sim.test',
};

const TZ = 'Asia/Manila';
const BASE_DATE = '2026-06-09';

/** @type {Array<{ level: 'info' | 'pass' | 'fail'; message: string }>} */
const logLines = [];

function log(level, message) {
  const prefix = level === 'pass' ? '✓' : level === 'fail' ? '✗' : '→';
  const line = `${prefix} ${message}`;
  logLines.push({ level, message: line });
  console.log(line);
}

async function bootstrapModules() {
  const { applyTestEnv } = await import(
    pathToFileURL(join(serverRoot, 'src/__tests__/helpers/testEnv.js')).href
  );
  const { createMemoryFirestore } = await import(
    pathToFileURL(join(serverRoot, 'src/__tests__/helpers/memoryFirestore.js')).href
  );

  applyTestEnv();

  const memory = createMemoryFirestore();

  for (const user of [...EMPLOYEES, ADMIN]) {
    memory.adminAuth.issueTestToken({
      uid: user.uid,
      email: user.email,
      email_verified: true,
    });
  }

  globalThis.__MINI_HCM_TEST_MOCK__ = {
    db: memory.db,
    adminAuth: memory.adminAuth,
    admin: { apps: [{ name: 'simulation' }] },
    adminApp: { name: 'simulation' },
  };

  const authService = await import(pathToFileURL(join(serverRoot, 'src/services/auth.service.js')).href);
  const usersRepository = await import(
    pathToFileURL(join(serverRoot, 'src/repositories/users.repository.js')).href
  );
  const attendanceWriteRepository = await import(
    pathToFileURL(join(serverRoot, 'src/repositories/attendanceWrite.repository.js')).href
  );
  const attendanceRepository = await import(
    pathToFileURL(join(serverRoot, 'src/repositories/attendance.repository.js')).href
  );
  const dailySummaryRepository = await import(
    pathToFileURL(join(serverRoot, 'src/repositories/dailySummary.repository.js')).href
  );
  const { calculateAttendanceMetrics } = await import(
    pathToFileURL(join(serverRoot, 'src/services/computation.service.js')).href
  );
  const { metricsToSummaryPayload } = await import(
    pathToFileURL(join(serverRoot, 'src/utils/metrics.js')).href
  );
  const { zonedTimeToUtc, buildAttendanceId, buildDailySummaryId } = await import(
    pathToFileURL(join(serverRoot, 'src/utils/dates.js')).href
  );

  return {
    memory,
    authService,
    usersRepository,
    attendanceWriteRepository,
    attendanceRepository,
    dailySummaryRepository,
    calculateAttendanceMetrics,
    metricsToSummaryPayload,
    zonedTimeToUtc,
    buildAttendanceId,
    buildDailySummaryId,
  };
}

/**
 * @param {ReturnType<typeof bootstrapModules>} ctx
 * @param {() => number} rng
 */
async function registerUsers(ctx, rng) {
  log('info', '=== REGISTER & LOGIN (simulated Auth + profile API) ===');

  for (const emp of EMPLOYEES) {
    const profile = await ctx.authService.registerProfile(emp.uid, emp.email, emp.fullName);
    const schedule = randomSchedule(rng);
    await ctx.usersRepository.updateUser(emp.uid, { schedule });
    const me = await ctx.authService.getProfileByUid(emp.uid);
    log(
      'info',
      `Registered ${emp.fullName} (${emp.uid}) shift ${schedule.start}–${schedule.end} — login OK (${me.role})`,
    );
  }

  await ctx.authService.registerProfile(ADMIN.uid, ADMIN.email, ADMIN.fullName);
  await ctx.usersRepository.updateUserRole(ADMIN.uid, 'admin');
  const adminProfile = await ctx.authService.getProfileByUid(ADMIN.uid);
  log('info', `Registered admin ${ADMIN.fullName} — role ${adminProfile.role}`);
}

/**
 * @param {ReturnType<typeof bootstrapModules>} ctx
 * @param {() => number} rng
 * @param {string[]} dates
 */
async function simulateAttendance(ctx, rng, dates) {
  log('info', '=== PUNCH IN / OUT (simulated sessions → Firestore) ===');

  /** @type {Array<{ userId: string; date: string; timeIn: Date; timeOut: Date; metrics: object }>} */
  const sessions = [];

  for (const emp of EMPLOYEES) {
    const user = await ctx.usersRepository.getUserById(emp.uid);
    if (!user) {
      throw new Error(`Missing user ${emp.uid}`);
    }

    for (const date of dates) {
      if (rng() < 0.12) {
        log('info', `  ${emp.fullName} ${date}: absent (no punch)`);
        continue;
      }

      const [sh, sm] = user.schedule.start.split(':').map(Number);
      const [eh, em] = user.schedule.end.split(':').map(Number);
      const shiftStartMin = sh * 60 + sm;
      const shiftEndMin = eh * 60 + em;

      const inOffset = Math.floor(rng() * 75) - 15;
      const outOffset = Math.floor(rng() * 150) - 30;

      const timeIn = ctx.zonedTimeToUtc(date, minutesToHHmm(shiftStartMin + inOffset), TZ);
      let timeOut = ctx.zonedTimeToUtc(date, minutesToHHmm(shiftEndMin + outOffset), TZ);
      if (timeOut.getTime() <= timeIn.getTime()) {
        timeOut = ctx.zonedTimeToUtc(date, minutesToHHmm(shiftEndMin + 60), TZ);
      }

      const metrics = ctx.calculateAttendanceMetrics({
        date,
        timeIn,
        timeOut,
        schedule: user.schedule,
        timezone: user.timezone,
      });

      await ctx.attendanceWriteRepository.closeAttendanceWithSummary(
        emp.uid,
        date,
        { timeIn, timeOut, ...metrics },
        ctx.metricsToSummaryPayload(metrics),
      );

      sessions.push({ userId: emp.uid, date, timeIn, timeOut, metrics });

      log(
        'info',
        `  ${emp.fullName} ${date}: IN ${minutesToHHmm(shiftStartMin + inOffset)} OUT ${minutesToHHmm(shiftEndMin + outOffset)} | reg ${metrics.regularHours}h OT ${metrics.overtimeHours}h late ${metrics.lateMinutes}m`,
      );
    }
  }

  return sessions;
}

/**
 * @param {ReturnType<typeof bootstrapModules>} ctx
 * @param {Array<{ userId: string; date: string; timeIn: Date; timeOut: Date; metrics: object }>} sessions
 */
async function verify(ctx, sessions, dates) {
  log('info', '=== VERIFICATION ===');

  let structuralPassed = 0;
  let structuralFailed = 0;
  let sessionPassed = 0;
  let sessionFailed = 0;

  const bucket = ctx.memory.store;
  const usersCount = bucket.get('users')?.size ?? 0;
  const attendanceCount = bucket.get('attendance')?.size ?? 0;
  const summaryCount = bucket.get('dailySummary')?.size ?? 0;

  log('info', `Firestore (memory): users=${usersCount} attendance=${attendanceCount} dailySummary=${summaryCount}`);

  if (usersCount !== 6) {
    log('fail', `Expected 6 users, found ${usersCount}`);
    structuralFailed += 1;
  } else {
    log('pass', 'User count correct (5 employees + 1 admin)');
    structuralPassed += 1;
  }

  if (attendanceCount !== sessions.length) {
    log('fail', `Attendance docs ${attendanceCount} !== sessions ${sessions.length}`);
    structuralFailed += 1;
  } else {
    log('pass', 'Attendance document count matches simulated sessions');
    structuralPassed += 1;
  }

  if (summaryCount !== sessions.length) {
    log('fail', `dailySummary docs ${summaryCount} !== sessions ${sessions.length}`);
    structuralFailed += 1;
  } else {
    log('pass', 'dailySummary document count matches closed sessions');
    structuralPassed += 1;
  }

  for (const session of sessions) {
    const attId = ctx.buildAttendanceId(session.userId, session.date);
    const sumId = ctx.buildDailySummaryId(session.userId, session.date);

    const attendance = await ctx.attendanceRepository.getById(session.userId, session.date);
    const summary = await ctx.dailySummaryRepository.getByUserAndDate(session.userId, session.date);
    const user = await ctx.usersRepository.getUserById(session.userId);

    if (!attendance || attendance.status !== 'closed') {
      log('fail', `${attId}: attendance missing or not closed`);
      sessionFailed += 1;
      continue;
    }

    if (!summary) {
      log('fail', `${sumId}: dailySummary missing`);
      sessionFailed += 1;
      continue;
    }

    const expected = ctx.calculateAttendanceMetrics({
      date: session.date,
      timeIn: new Date(attendance.timeIn),
      timeOut: new Date(attendance.timeOut),
      schedule: user.schedule,
      timezone: user.timezone,
    });

    const metricFields = [
      ['regularHours', 'totalRegularHours'],
      ['overtimeHours', 'totalOvertimeHours'],
      ['nightDifferentialHours', 'totalNightDifferentialHours'],
      ['lateMinutes', 'totalLateMinutes'],
      ['undertimeMinutes', 'totalUndertimeMinutes'],
    ];

    let sessionOk = true;

    for (const [attKey, sumKey] of metricFields) {
      if (attendance[attKey] !== expected[attKey]) {
        log(
          'fail',
          `${attId}: attendance.${attKey}=${attendance[attKey]} expected ${expected[attKey]}`,
        );
        sessionOk = false;
      }
      if (summary[sumKey] !== expected[attKey]) {
        log('fail', `${sumId}: ${sumKey}=${summary[sumKey]} expected ${expected[attKey]}`);
        sessionOk = false;
      }
    }

    if (sessionOk) {
      sessionPassed += 1;
    } else {
      sessionFailed += 1;
    }
  }

  log(
    'info',
    `Per-session metrics: ${sessionPassed}/${sessions.length} OK` +
      (sessionFailed ? `, ${sessionFailed} failed` : ''),
  );

  const adminListed = await ctx.usersRepository.listUsers({ role: 'employee', limit: 100 });
  if (adminListed.length !== 5) {
    log('fail', `Admin employee list count ${adminListed.length} (expected 5)`);
    structuralFailed += 1;
  } else {
    log('pass', 'Admin can list 5 employees');
    structuralPassed += 1;
  }

  log('info', '=== SUMMARY ===');
  const passed = structuralPassed + sessionPassed;
  const failed = structuralFailed + sessionFailed;
  const totalChecks = passed + failed;
  const ok = failed === 0;
  log(
    ok ? 'pass' : 'fail',
    `Verification ${ok ? 'PASSED' : 'FAILED'} (${passed}/${totalChecks} checks, ${sessions.length} sessions)`,
  );

  return { passed, failed, ok, usersCount, attendanceCount, summaryCount, sessionCount: sessions.length };
}

async function main() {
  const { days, seed } = parseArgs();
  const rng = createRng(seed);
  const dates = buildSimDates(BASE_DATE, days);

  console.log('');
  console.log('Mini HCM — Employee usage simulation');
  console.log(`  Days: ${days} (${dates[0]} → ${dates.at(-1)})`);
  console.log(`  Seed: ${seed}`);
  console.log(`  Timezone: ${TZ}`);
  console.log('');

  const ctx = await bootstrapModules();

  try {
    await registerUsers(ctx, rng);
    const sessions = await simulateAttendance(ctx, rng, dates);
    const result = await verify(ctx, sessions, dates);

    console.log('');
    if (!result.ok) {
      process.exitCode = 1;
    }
  } finally {
    delete globalThis.__MINI_HCM_TEST_MOCK__;
  }
}

main().catch((err) => {
  console.error('Simulation failed:', err);
  process.exitCode = 1;
});
