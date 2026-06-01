import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebase.js';
import * as authApi from '../api/auth.api.js';
import { getApiErrorCode, getApiErrorMessage } from '../api/axios.js';

export const AuthStateContext = createContext(null);
export const AuthActionsContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return null;
    }

    const user = await authApi.getMe();
    setProfile(user);
    return user;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setProfileError('');
        setLoading(false);
        return;
      }

      try {
        await refreshProfile();
        setProfileError('');
      } catch (err) {
        if (getApiErrorCode(err) === 'PROFILE_NOT_FOUND') {
          setProfile(null);
          setProfileError('');
        } else {
          const message = getApiErrorMessage(err);
          console.error('Failed to load profile:', message);
          setProfile(null);
          setProfileError(message);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [refreshProfile]);

  const login = useCallback(async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    try {
      return await refreshProfile();
    } catch (err) {
      if (getApiErrorCode(err) === 'PROFILE_NOT_FOUND') {
        const profileError = new Error('PROFILE_NOT_FOUND');
        profileError.code = 'PROFILE_NOT_FOUND';
        throw profileError;
      }
      throw err;
    }
  }, [refreshProfile]);

  const register = useCallback(async ({ fullName, email, password }) => {
    await createUserWithEmailAndPassword(auth, email, password);
    try {
      const user = await authApi.registerProfile({ fullName });
      setProfile(user);
      return user;
    } catch (err) {
      await signOut(auth);
      throw err;
    }
  }, []);

  const completeRegistration = useCallback(async (fullName) => {
    const user = await authApi.registerProfile({ fullName });
    setProfile(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (auth.currentUser) {
        await authApi.logout();
      }
    } catch {
      // Logout is client-driven; ignore API errors
    } finally {
      await signOut(auth);
      setProfile(null);
    }
  }, []);

  const stateValue = useMemo(
    () => ({
      firebaseUser,
      profile,
      profileError,
      loading,
      isAuthenticated: Boolean(firebaseUser),
      isAdmin: profile?.role === 'admin',
    }),
    [firebaseUser, profile, profileError, loading],
  );

  const actionsValue = useMemo(
    () => ({
      login,
      register,
      completeRegistration,
      logout,
      refreshProfile,
    }),
    [login, register, completeRegistration, logout, refreshProfile],
  );

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthActionsContext.Provider value={actionsValue}>{children}</AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}
