import * as adminService from '../services/admin.service.js';

export async function listUsers(req, res) {
  const result = await adminService.listUsers(req.validated.query);
  return res.status(200).json(result);
}

export async function getUser(req, res) {
  const { uid } = req.validated.params;
  const result = await adminService.getUserDetail(uid);
  return res.status(200).json(result);
}

export async function patchUser(req, res) {
  const { uid } = req.validated.params;
  const user = await adminService.updateUser(uid, req.validated.body);
  return res.status(200).json(user);
}

export async function patchUserRole(req, res) {
  const { uid } = req.validated.params;
  const { role } = req.validated.body;
  const user = await adminService.updateUserRole(req.user.uid, uid, role);
  return res.status(200).json(user);
}

export async function resetUserPassword(req, res) {
  const { uid } = req.validated.params;
  const result = await adminService.resetUserPassword(req.user.uid, uid);
  return res.status(200).json(result);
}

export async function searchAttendance(req, res) {
  const result = await adminService.searchAttendance(req.validated.query);
  return res.status(200).json(result);
}

export async function createAttendance(req, res) {
  const result = await adminService.createAttendance(req.user.uid, req.validated.body);
  return res.status(201).json(result);
}

export async function patchAttendance(req, res) {
  const { userId, date } = req.validated.params;
  const result = await adminService.patchAttendance(
    req.user.uid,
    userId,
    date,
    req.validated.body,
  );
  return res.status(200).json(result);
}

export async function getDashboardKpis(req, res) {
  const { date } = req.validated.query;
  const result = await adminService.getDashboardKpis(date);
  return res.status(200).json(result);
}

export async function getTodayRoster(req, res) {
  const { date } = req.validated.query;
  const items = await adminService.getTodayRoster(date);
  return res.status(200).json({ items });
}

export async function getDayOverview(req, res) {
  const { date } = req.validated.query;
  const result = await adminService.getDayOverview(date);
  return res.status(200).json(result);
}
