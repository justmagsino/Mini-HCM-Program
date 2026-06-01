import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getClientEnv } from './env.js';

/**
 * Firebase client SDK — Auth only for MVP.
 * Business data must use the Express API (Firestore rules deny client access).
 */
function createFirebaseApp() {
  const env = getClientEnv();

  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
  };

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
}

const app = createFirebaseApp();

export const auth = getAuth(app);

export { app };
