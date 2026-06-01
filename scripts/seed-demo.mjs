#!/usr/bin/env node
/**
 * Seeds Firebase (Auth + Firestore) with demo users and attendance history.
 *
 * Usage:
 *   npm run seed:demo
 *   npm run seed:demo -- --days=14 --seed=42
 *   npm run seed:demo -- --reset   # remove demo accounts & their data first
 *
 * Requires server/.env with Firebase Admin credentials.
 * Enable Email/Password in Firebase Console → Authentication.
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerEnv } from './lib/load-server-env.mjs';

const root = loadServerEnv();
const serverRoot = join(root, 'server');

const DEMO_PASSWORD = 'password';

const DEMO_EMPLOYEES = [
  { fullName: 'Ana Reyes', email: 'employee1@demo.test' },
  { fullName: 'Ben Cruz', email: 'employee2@demo.test' },
  { fullName: 'Carla Santos', email: 'employee3@demo.test' },
  { fullName: 'Diego Lim', email: 'employee4@demo.test' },
  { fullName: 'Ella Gomez', email: 'employee5@demo.test' },
  { fullName: 'Fiona Mendoza', email: 'employee6@demo.test' },
  { fullName: 'Gabriel Tan', email: 'employee7@demo.test' },
  { fullName: 'Hannah Rivera', email: 'employee8@demo.test' },
  { fullName: 'Ivan Dela Cruz', email: 'employee9@demo.test' },
  { fullName: 'Julia Navarro', email: 'employee10@demo.test' },
];

const DEMO_ADMIN = {
  fullName: 'Demo Admin',
  email: 'admin@demo.test',
};

/** Previous seed script emails — removed when using `--reset` */
const LEGACY_DEMO_EMAILS = [
  'admin@demo.mini-hcm.test',
  'ana.reyes@demo.mini-hcm.test',
  'ben.cruz@demo.mini-hcm.test',
  'carla.santos@demo.mini-hcm.test',
  'diego.lim@demo.mini-hcm.test',
  'ella.gomez@demo.mini-hcm.test',
];

function parseArgs() {
  const daysArg = process.argv.find((a) => a.startsWith('--days='));
  const seedArg = process.argv.find((a) => a.startsWith('--seed='));
  const days = daysArg ? Number(daysArg.split('=')[1]) : 14;
  const seed = seedArg ? Number(seedArg.split('=')[1]) : 42;
  const reset = process.argv.includes('--reset');
  const dryRun = process.argv.includes('--dry-run');

  if (!Number.isInteger(days) || days < 3 || days > 93) {
    throw new Error('--days must be an integer from 3 to 93');
  }

  return { days, seed, reset, dryRun };
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
 * @param {string} endDate YYYY-MM-DD
 * @param {number} count
 * @param {(date: string, days: number) => string} subtractDays
 */
function buildDateRange(endDate, count, subtractDays) {
  const dates = [endDate];
  let current = endDate;
  for (let i = 1; i < count; i += 1) {
    current = subtractDays(current, 1);
    dates.unshift(current);
  }
  return dates;
}

async function loadModules() {
  const firebaseAdminPath = pathToFileURL(
    join(serverRoot, 'src', 'config', 'firebaseAdmin.js'),
  ).href;

  const [
    { adminAuth, db },
    { env },
    usersRepository,
    attendanceRepository,
    attendanceWriteRepository,
    { calculateAttendanceMetrics },
    { metricsToSummaryPayload },
    { getWorkDateForTimezone, subtractDaysFromDateString, zonedTimeToUtc },
  ] = await Promise.all([
    import(firebaseAdminPath),
    import(pathToFileURL(join(serverRoot, 'src', 'config', 'env.js')).href),
    import(pathToFileURL(join(serverRoot, 'src/repositories/users.repository.js')).href),
    import(pathToFileURL(join(serverRoot, 'src/repositories/attendance.repository.js')).href),
    import(pathToFileURL(join(serverRoot, 'src/repositories/attendanceWrite.repository.js')).href),
    import(pathToFileURL(join(serverRoot, 'src/services/computation.service.js')).href),
    import(pathToFileURL(join(serverRoot, 'src/utils/metrics.js')).href),
    import(pathToFileURL(join(serverRoot, 'src/utils/dates.js')).href),
  ]);

  return {
    adminAuth,
    db,
    env,
    usersRepository,
    attendanceRepository,
    attendanceWriteRepository,
    calculateAttendanceMetrics,
    metricsToSummaryPayload,
    getWorkDateForTimezone,
    subtractDaysFromDateString,
    zonedTimeToUtc,
  };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {string} uid
 */
async function deleteUserFirestoreData(db, uid) {
  for (const collection of ['attendance', 'dailySummary']) {
    const snap = await db.collection(collection).where('userId', '==', uid).get();
    if (snap.empty) {
      continue;
    }
    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
  await db.collection('users').doc(uid).delete();
}

/**
 * @param {Awaited<ReturnType<typeof loadModules>>} ctx
 * @param {string[]} emails
 */
async function resetDemoUsers(ctx, emails) {
  console.log('Removing existing demo accounts and data…');
  for (const email of emails) {
    try {
      const authUser = await ctx.adminAuth.getUserByEmail(email);
      await deleteUserFirestoreData(ctx.db, authUser.uid);
      await ctx.adminAuth.deleteUser(authUser.uid);
      console.log(`  Deleted ${email}`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.log(`  Skip ${email} (not in Auth)`);
      } else {
        throw err;
      }
    }
  }
}

/**
 * @param {Awaited<ReturnType<typeof loadModules>>} ctx
 * @param {{ fullName: string; email: string; role: 'employee' | 'admin' }} spec
 * @param {() => number} rng
 * @param {boolean} dryRun
 */
async function ensureAuthAndProfile(ctx, spec, rng, dryRun) {
  const timezone = ctx.env.DEFAULT_TIMEZONE;
  const schedule = randomSchedule(rng);

  if (dryRun) {
    return { uid: `dry-${spec.email}`, email: spec.email, fullName: spec.fullName, role: spec.role };
  }

  let uid;
  try {
    const existing = await ctx.adminAuth.getUserByEmail(spec.email);
    uid = existing.uid;
    await ctx.adminAuth.updateUser(uid, {
      password: DEMO_PASSWORD,
      displayName: spec.fullName,
      emailVerified: true,
    });
    console.log(`  Auth user exists: ${spec.email}`);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') {
      throw err;
    }
    const created = await ctx.adminAuth.createUser({
      email: spec.email,
      password: DEMO_PASSWORD,
      displayName: spec.fullName,
      emailVerified: true,
    });
    uid = created.uid;
    console.log(`  Created Auth user: ${spec.email}`);
  }

  const profileExists = await ctx.usersRepository.userExists(uid);
  if (!profileExists) {
    await ctx.usersRepository.createUser(uid, {
      fullName: spec.fullName,
      email: spec.email,
      role: 'employee',
      timezone,
      schedule,
    });
    console.log(`  Created Firestore profile: ${spec.fullName}`);
  } else {
    await ctx.usersRepository.updateUser(uid, { fullName: spec.fullName, timezone, schedule });
    console.log(`  Updated Firestore profile: ${spec.fullName}`);
  }

  if (spec.role === 'admin') {
    await ctx.usersRepository.updateUserRole(uid, 'admin');
    console.log(`  Role set to admin: ${spec.email}`);
  }

  return { uid, email: spec.email, fullName: spec.fullName, role: spec.role };
}

/**
 * @param {Awaited<ReturnType<typeof loadModules>>} ctx
 * @param {Array<{ uid: string; fullName: string }>} employees
 * @param {() => number} rng
 * @param {string[]} dates
 * @param {boolean} dryRun
 */
async function seedAttendance(ctx, employees, rng, dates, dryRun) {
  let created = 0;
  let skipped = 0;

  if (dryRun) {
    const estimate = Math.floor(employees.length * dates.length * 0.9);
    console.log(`  Would write about ${estimate} closed attendance + dailySummary records`);
    return { created: estimate, skipped: 0 };
  }

  for (const emp of employees) {
    const user = await ctx.usersRepository.getUserById(emp.uid);
    if (!user) {
      throw new Error(`Missing profile for ${emp.uid}`);
    }

    for (const date of dates) {
      if (rng() < 0.1) {
        skipped += 1;
        continue;
      }

      const existing = await ctx.attendanceRepository.getById(emp.uid, date);
      if (existing?.status === 'closed') {
        skipped += 1;
        continue;
      }

      const [sh, sm] = user.schedule.start.split(':').map(Number);
      const [eh, em] = user.schedule.end.split(':').map(Number);
      const shiftStartMin = sh * 60 + sm;
      const shiftEndMin = eh * 60 + em;
      const inOffset = Math.floor(rng() * 75) - 15;
      const outOffset = Math.floor(rng() * 150) - 30;

      const timeIn = ctx.zonedTimeToUtc(
        date,
        minutesToHHmm(shiftStartMin + inOffset),
        user.timezone,
      );
      let timeOut = ctx.zonedTimeToUtc(
        date,
        minutesToHHmm(shiftEndMin + outOffset),
        user.timezone,
      );
      if (timeOut.getTime() <= timeIn.getTime()) {
        timeOut = ctx.zonedTimeToUtc(date, minutesToHHmm(shiftEndMin + 60), user.timezone);
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

      created += 1;
    }
  }

  return { created, skipped };
}

function printLoginTable(accounts) {
  console.log('');
  console.log('Demo login accounts (use at http://localhost:5173/login):');
  console.log('');
  console.log('  Password for all demo accounts:', DEMO_PASSWORD);
  console.log('');
  console.log('  Role      | Email');
  console.log('  ----------|----------------------------------');
  for (const row of accounts) {
    console.log(`  ${row.role.padEnd(9)} | ${row.email}`);
  }
  console.log('');
}

async function main() {
  const { days, seed, reset, dryRun } = parseArgs();
  const rng = createRng(seed);
  const ctx = await loadModules();
  const timezone = ctx.env.DEFAULT_TIMEZONE;
  const endDate = ctx.getWorkDateForTimezone(new Date(), timezone);
  const dates = buildDateRange(endDate, days, ctx.subtractDaysFromDateString);

  const allEmails = [...DEMO_EMPLOYEES.map((e) => e.email), DEMO_ADMIN.email];
  const emailsToReset = reset
    ? [...new Set([...allEmails, ...LEGACY_DEMO_EMAILS])]
    : allEmails;

  console.log('');
  console.log('Mini HCM — Firebase demo seed');
  console.log(`  Project: ${ctx.env.FIREBASE_PROJECT_ID}`);
  console.log(`  Days: ${days} (${dates[0]} → ${dates.at(-1)})`);
  console.log(`  Seed: ${seed}`);
  if (dryRun) {
    console.log('  Mode: DRY RUN (no writes)');
  }
  console.log('');

  if (reset && !dryRun) {
    await resetDemoUsers(ctx, emailsToReset);
    console.log('');
  }

  console.log('Creating demo users…');
  /** @type {Array<{ uid: string; email: string; fullName: string; role: string }>} */
  const accounts = [];

  for (const emp of DEMO_EMPLOYEES) {
    const row = await ensureAuthAndProfile(ctx, { ...emp, role: 'employee' }, rng, dryRun);
    accounts.push(row);
  }

  const adminRow = await ensureAuthAndProfile(
    ctx,
    { ...DEMO_ADMIN, role: 'admin' },
    rng,
    dryRun,
  );
  accounts.push(adminRow);

  const employees = accounts.filter((a) => a.role === 'employee');

  console.log('');
  console.log('Seeding attendance & daily summaries…');
  const { created, skipped } = await seedAttendance(ctx, employees, rng, dates, dryRun);
  console.log(`  Closed sessions written: ${created} (skipped ${skipped} absent/existing)`);

  printLoginTable(accounts);

  console.log('Next steps:');
  console.log('  1. npm run dev:server   (terminal 1)');
  console.log('  2. npm run dev:client   (terminal 2)');
  console.log('  3. Log in as admin@demo.test and open Admin → Overview / Daily & weekly reports');
  console.log('');
  console.log('To wipe demo data and re-seed: npm run seed:demo -- --reset');
  console.log('');
}

main().catch((err) => {
  console.error('Demo seed failed:', err.message ?? err);
  process.exitCode = 1;
});
