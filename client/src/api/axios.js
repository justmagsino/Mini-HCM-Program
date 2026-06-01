import axios from 'axios';
import { signOut } from 'firebase/auth';
import { getClientEnv } from '../config/env.js';
import { auth } from '../config/firebase.js';

const env = getClientEnv();

/** Ensures all API modules use paths like `/auth/me` while the server mounts under `/api`. */
function resolveApiBaseUrl(url) {
  const trimmed = url.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(env.VITE_API_BASE_URL),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && auth.currentUser && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await auth.currentUser.getIdToken(true);
        } finally {
          isRefreshing = false;
        }
      }

      const token = await auth.currentUser.getIdToken();
      originalRequest.headers.Authorization = `Bearer ${token}`;
      try {
        return await api(originalRequest);
      } catch (retryError) {
        const code = retryError.response?.data?.error?.code;
        if (retryError.response?.status === 401 && (code === 'UNAUTHORIZED' || !code)) {
          await signOut(auth);
        }
        return Promise.reject(retryError);
      }
    }

    const code = error.response?.data?.error?.code;
    if (error.response?.status === 401 && (code === 'UNAUTHORIZED' || !code)) {
      await signOut(auth);
    }

    return Promise.reject(error);
  },
);

/**
 * @param {import('axios').AxiosError} error
 */
export function getApiErrorMessage(error) {
  return error.response?.data?.error?.message ?? error.message ?? 'Request failed';
}

/**
 * @param {import('axios').AxiosError} error
 */
export function getApiErrorCode(error) {
  return error.response?.data?.error?.code ?? null;
}
