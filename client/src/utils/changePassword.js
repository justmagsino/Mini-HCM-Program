import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../config/firebase.js';
import { getFirebaseAuthErrorMessage } from './firebaseAuthErrors.js';

/**
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export async function changePasswordWithReauth(currentPassword, newPassword) {
  const user = auth.currentUser;
  const email = user?.email;

  if (!user || !email) {
    throw new Error('You must be signed in to change your password.');
  }

  try {
    const credential = EmailAuthProvider.credential(email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  } catch (err) {
    const message = getFirebaseAuthErrorMessage(err);
    const error = new Error(message);
    error.code = err?.code;
    throw error;
  }
}
