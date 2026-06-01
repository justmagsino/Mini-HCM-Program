import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { env, getFirebasePrivateKey } from './env.js';

/**
 * Firebase Admin SDK — singleton initialization.
 * Used for Firestore access and ID token verification (auth phase).
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

const adminApp = initializeFirebaseAdmin();

/** Firebase Admin Auth (verifyIdToken — used in auth phase). */
export const adminAuth = admin.auth(adminApp);

/** Firestore Admin instance — canonical DB access for users, attendance, dailySummary. */
export const db = getFirestore(adminApp);

export { admin, adminApp };
