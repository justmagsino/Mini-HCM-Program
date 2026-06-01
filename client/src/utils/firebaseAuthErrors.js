/**
 * Maps Firebase Auth error codes to user-friendly messages.
 * @param {unknown} error
 */
export function getFirebaseAuthErrorMessage(error) {
  const code = error?.code ?? '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 8 characters.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.';
    case 'auth/network-request-failed':
      return 'Network error talking to Firebase. Check your internet connection.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
      return 'Invalid Firebase API key. Check VITE_FIREBASE_API_KEY in client/.env.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/requires-recent-login':
      return 'For security, sign out and sign in again, then change your password.';
    default:
      return code ? `Authentication failed (${code}).` : 'Authentication failed. Please try again.';
  }
}

/**
 * Prefer API error body, then Firebase Auth codes (register/login flows).
 * @param {unknown} error
 */
export function getAuthFlowErrorMessage(error) {
  const apiMessage = error?.response?.data?.error?.message;
  if (apiMessage) {
    return apiMessage;
  }

  if (error?.code === 'PROFILE_NOT_FOUND') {
    return 'Account exists but profile is incomplete. Log in to finish setup.';
  }

  const firebaseMessage = getFirebaseAuthErrorMessage(error);
  if (firebaseMessage && !firebaseMessage.startsWith('Authentication failed.')) {
    return firebaseMessage;
  }

  return firebaseMessage || error?.message || 'Request failed';
}
