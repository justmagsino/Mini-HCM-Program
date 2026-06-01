import { generateKeyPairSync } from 'node:crypto';

/**
 * Test environment defaults (no real Firebase project required).
 */
export function applyTestEnv() {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });

  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.TRUST_PROXY = 'false';
  process.env.FIREBASE_PROJECT_ID = 'mini-hcm-test';
  process.env.FIREBASE_CLIENT_EMAIL = 'test@mini-hcm-test.iam.gserviceaccount.com';
  process.env.FIREBASE_PRIVATE_KEY = privateKey.replace(/\n/g, '\\n');
  process.env.DEFAULT_TIMEZONE = 'Asia/Manila';
  process.env.DEFAULT_SHIFT_START = '09:00';
  process.env.DEFAULT_SHIFT_END = '18:00';
  process.env.ALLOW_PUBLIC_REGISTER = 'true';
  process.env.LATE_ALERT_MINUTES = '15';
  process.env.UNDERTIME_ALERT_MINUTES = '30';
}
