/**
 * Maps Firebase Auth error codes to user-friendly messages.
 * @param {unknown} error
 */
export function getFirebaseAuthErrorMessage(error) {
  const code = error?.code ?? '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 8 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    default:
      return 'Authentication failed. Please try again.';
  }
}
