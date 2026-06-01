import { api } from './axios.js';

export async function getDashboardKpis(date) {
  const { data } = await api.get('/admin/dashboard/kpis', { params: { date } });
  return data;
}

export async function getTodayRoster(date) {
  const { data } = await api.get('/admin/dashboard/roster', { params: { date } });
  return data.items;
}

/** KPIs + roster in one round trip (preferred for admin dashboard). */
export async function getDayOverview(date) {
  const { data } = await api.get('/admin/dashboard/day', { params: { date } });
  return data;
}

/**
 * @param {{ q?: string; role?: string; page?: number; limit?: number }} params
 */
export async function listUsers(params) {
  const { data } = await api.get('/admin/users', { params });
  return data;
}

export async function getUser(uid) {
  const { data } = await api.get(`/admin/users/${uid}`);
  return data;
}

/**
 * @param {string} uid
 * @param {object} body
 */
export async function updateUser(uid, body) {
  const { data } = await api.patch(`/admin/users/${uid}`, body);
  return data;
}

/**
 * @param {string} uid
 * @param {'employee' | 'admin'} role
 */
export async function updateUserRole(uid, role) {
  const { data } = await api.patch(`/admin/users/${uid}/role`, { role });
  return data;
}

/**
 * @param {{ date?: string; userId?: string; status?: string; q?: string; page?: number; limit?: number }} params
 */
export async function searchAttendance(params) {
  const { data } = await api.get('/admin/attendance', { params });
  return data;
}

/**
 * @param {object} body
 */
export async function createAttendance(body) {
  const { data } = await api.post('/admin/attendance', body);
  return data;
}

/**
 * @param {string} userId
 * @param {string} date
 * @param {object} body
 */
export async function patchAttendance(userId, date, body) {
  const { data } = await api.patch(`/admin/attendance/${userId}/${date}`, body);
  return data;
}

export async function getTeamDailyReport(date) {
  const { data } = await api.get('/admin/reports/daily', { params: { date } });
  return data;
}

export async function getTeamWeeklyReport(params) {
  const { data } = await api.get('/admin/reports/weekly', { params });
  return data;
}

export async function getExceptionsReport(params) {
  const { data } = await api.get('/admin/reports/exceptions', { params });
  return data.items;
}

export async function getAdminDailySummary(params) {
  const { data } = await api.get('/admin/summaries/daily', { params });
  return data.data;
}
