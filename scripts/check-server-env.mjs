#!/usr/bin/env node
/**
 * Validates server environment before deploy or start.
 * Usage (from repo root): node scripts/check-server-env.mjs
 * Loads server/.env when present; otherwise uses process.env (CI/host dashboard).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, 'server', '.env');

if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const required = [
  'NODE_ENV',
  'CORS_ORIGIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

const missing = required.filter((key) => !process.env[key]?.trim());

if (missing.length) {
  console.error('Missing required server environment variables:');
  for (const key of missing) {
    console.error(`  - ${key}`);
  }
  console.error('\nCopy server/.env.example to server/.env or set secrets in your host.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PUBLIC_REGISTER === 'true') {
  console.warn('Warning: ALLOW_PUBLIC_REGISTER=true in production.');
}

try {
  const envModuleUrl = pathToFileURL(join(root, 'server', 'src', 'config', 'env.js')).href;
  const { getFirebasePrivateKey } = await import(envModuleUrl);
  getFirebasePrivateKey();
  console.log('Server environment OK.');
} catch (err) {
  console.error('Server environment validation failed:');
  console.error(err.message ?? err);
  process.exit(1);
}
