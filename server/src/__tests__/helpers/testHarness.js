import { createServer } from 'node:http';
import { applyTestEnv } from './testEnv.js';
import { createMemoryFirestore } from './memoryFirestore.js';
import { getWorkDateForTimezone, zonedTimeToUtc } from '../../utils/dates.js';

const DEFAULT_SCHEDULE = { start: '09:00', end: '18:00' };
const TZ = 'Asia/Manila';

/** @type {import('./memoryFirestore.js').createMemoryFirestore extends Function ? ReturnType<typeof createMemoryFirestore> : never} */
let activeMemory = null;

/**
 * @param {{ uid: string; email: string; role: 'employee' | 'admin'; fullName: string }} user
 */
async function seedUserProfile(memory, user) {
  await memory.db.seed('users', user.uid, {
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    timezone: TZ,
    schedule: DEFAULT_SCHEDULE,
    createdAt: new Date(),
  });
}

/**
 * Boot Express app with in-memory Firestore + mock Auth (call once per test file).
 */
export async function createTestHarness() {
  applyTestEnv();

  activeMemory = createMemoryFirestore();

  await seedUserProfile(activeMemory, {
    uid: 'emp-001',
    email: 'employee@test.com',
    role: 'employee',
    fullName: 'Test Employee',
  });
  await seedUserProfile(activeMemory, {
    uid: 'admin-001',
    email: 'admin@test.com',
    role: 'admin',
    fullName: 'Test Admin',
  });

  globalThis.__MINI_HCM_TEST_MOCK__ = {
    db: activeMemory.db,
    adminAuth: activeMemory.adminAuth,
    admin: { apps: [{ name: 'test' }] },
    adminApp: { name: 'test' },
  };

  const { default: app } = await import('../../app.js');

  const server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  /**
   * @param {string} uid
   */
  function bearer(uid) {
    const token = activeMemory.adminAuth.issueTestToken({
      uid,
      email: `${uid}@test.com`,
      email_verified: true,
    });
    return `Bearer ${token}`;
  }

  /**
   * @param {'GET'|'POST'|'PATCH'} method
   * @param {string} path
   * @param {{ token?: string; body?: object; query?: Record<string, string> }} [options]
   */
  async function request(method, path, options = {}) {
    const url = new URL(path.startsWith('http') ? path : `${baseUrl}${path}`);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        url.searchParams.set(key, value);
      }
    }

    const headers = { Accept: 'application/json' };
    if (options.token) {
      headers.Authorization = options.token;
    }
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    let json = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }
    }

    return { status: response.status, body: json };
  }

  return {
    baseUrl,
    memory: activeMemory,
    bearer,
    request,
    workDate: () => getWorkDateForTimezone(new Date(), TZ),
    isoAt(dateStr, hhmm) {
      return zonedTimeToUtc(dateStr, hhmm, TZ).toISOString();
    },
    async close() {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      delete globalThis.__MINI_HCM_TEST_MOCK__;
      activeMemory = null;
    },
  };
}

/**
 * @param {string} name
 */
export function logPass(name) {
  console.log(`✓ PASS: ${name}`);
}

/**
 * @param {string} name
 * @param {unknown} detail
 */
export function logFail(name, detail) {
  console.error(`✗ FAIL: ${name}`, detail);
}
