#!/usr/bin/env node
/**
 * Promotes a Firebase Auth user to admin in Firestore.
 * Usage: npm run seed:admin -- --uid=USER_UID
 * Requires server/.env with Firebase Admin credentials.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

const uidArg = process.argv.find((arg) => arg.startsWith('--uid='));
const uid = uidArg?.split('=')[1]?.trim();

if (!uid) {
  console.error('Usage: npm run seed:admin -- --uid=FIREBASE_AUTH_UID');
  process.exit(1);
}

const { db } = await import(join(root, 'server', 'src', 'config', 'firebaseAdmin.js'));

const ref = db.collection('users').doc(uid);
const snap = await ref.get();

if (!snap.exists) {
  console.error(`No users/${uid} document. Register the user in the app first.`);
  process.exit(1);
}

const { FieldValue } = await import('firebase-admin/firestore');
await ref.update({ role: 'admin', updatedAt: FieldValue.serverTimestamp() });
console.log(`users/${uid} role set to admin.`);
