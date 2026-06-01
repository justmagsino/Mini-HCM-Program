import { api } from './axios.js';

/**
 * @param {{ fullName: string }} body
 */
export async function registerProfile(body) {
  const { data } = await api.post('/auth/register', body);
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function logout() {
  await api.post('/auth/logout');
}
