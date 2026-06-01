import { useAuthState } from './useAuth.js';
import { DEFAULT_TIMEZONE } from '../utils/dates.js';

/**
 * Resolved IANA timezone for the signed-in user profile.
 */
export function useProfileTimezone() {
  const { profile } = useAuthState();
  return profile?.timezone ?? DEFAULT_TIMEZONE;
}
