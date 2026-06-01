import { api } from './axios.js';

/**
 * @param {string} date YYYY-MM-DD
 */
export async function getDaily(date) {
  const { data } = await api.get('/summaries/daily', { params: { date } });
  return data.data;
}

/**
 * @param {{ from: string; to: string }} params
 */
export async function getDailyRange(params) {
  const { data } = await api.get('/summaries/daily/range', { params });
  return data.items;
}

/**
 * @param {string} weekStart YYYY-MM-DD (Monday)
 */
export async function getWeekly(weekStart) {
  const { data } = await api.get('/summaries/weekly', { params: { weekStart } });
  return data;
}
