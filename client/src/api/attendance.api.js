import { api } from './axios.js';

export async function punchIn() {
  const { data } = await api.post('/attendance/punch-in', {});
  return data;
}

export async function punchOut() {
  const { data } = await api.post('/attendance/punch-out', {});
  return data;
}

export async function getToday() {
  const { data } = await api.get('/attendance/today');
  return data.data;
}

/**
 * @param {{ from: string; to: string; page?: number; limit?: number }} params
 */
export async function getHistory(params) {
  const { data } = await api.get('/attendance/history', { params });
  return data;
}
