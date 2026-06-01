import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { env, getFirebasePrivateKey } from './env.js';

/**
 * Firebase Admin SDK — singleton initialization.
 * Used for Firestore access and ID token verification (auth phase).
 *
 * Tests set `globalThis.__MINI_HCM_TEST_MOCK__` before importing the app (see __tests__/helpers/testHarness.js).
 */

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: getFirebasePrivateKey(),
    }),
    projectId: env.FIREBASE_PROJECT_ID,
  });
}

function resolveFirebase() {
  const testMock = globalThis.__MINI_HCM_TEST_MOCK__;
  if (testMock) {
    return testMock;
  }

  const adminApp = initializeFirebaseAdmin();
  return {
    admin,
    adminApp,
    adminAuth: admin.auth(adminApp),
    db: getFirestore(adminApp),
  };
}

const firebase = resolveFirebase();

/** Firebase Admin Auth (verifyIdToken — used in auth phase). */
export const adminAuth = firebase.adminAuth;

/** Firestore Admin instance — canonical DB access for users, attendance, dailySummary. */
export const db = firebase.db;

export const adminApp = firebase.adminApp;
export { admin };
