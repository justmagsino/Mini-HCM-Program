import * as attendanceService from '../services/attendance.service.js';

export async function punchIn(req, res) {
  const attendance = await attendanceService.punchIn(req.user);
  return res.status(201).json(attendance);
}

export async function punchOut(req, res) {
  const result = await attendanceService.punchOut(req.user);
  return res.status(200).json(result);
}

export async function getToday(req, res) {
  const data = await attendanceService.getToday(req.user);
  return res.status(200).json({ data });
}

export async function getHistory(req, res) {
  const { from, to, page, limit } = req.validated.query;
  const result = await attendanceService.getHistory(req.user, { from, to, page, limit });
  return res.status(200).json(result);
}
