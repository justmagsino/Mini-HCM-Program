#!/usr/bin/env node
/**
 * Validates Vite client env before production build.
 * Usage (from repo root): node scripts/check-client-env.mjs
 * Reads client/.env.production when present, else process.env.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, 'client', '.env.production');

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
    process.env[key] = value;
  }
}

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_API_BASE_URL',
];

const missing = required.filter((key) => !process.env[key]?.trim());

if (missing.length) {
  console.error('Missing required client environment variables:');
  for (const key of missing) {
    console.error(`  - ${key}`);
  }
  console.error('\nCopy client/.env.production.example to client/.env.production');
  process.exit(1);
}

try {
  new URL(process.env.VITE_API_BASE_URL);
} catch {
  console.error('VITE_API_BASE_URL must be a valid URL (API origin, no trailing /api).');
  process.exit(1);
}

if (process.env.VITE_API_BASE_URL.endsWith('/api')) {
  console.warn('VITE_API_BASE_URL should be the API host only (e.g. https://api.example.com), not .../api');
}

console.log('Client environment OK.');
