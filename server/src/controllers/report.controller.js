import * as reportService from '../services/report.service.js';

export async function getAdminDailySummary(req, res) {
  const { userId, date } = req.validated.query;
  const data = await reportService.getAdminDailySummary(userId, date);
  return res.status(200).json({ data });
}

export async function getTeamDailyReport(req, res) {
  const { date, role } = req.validated.query;
  const result = await reportService.getTeamDailyReport(date, role);
  return res.status(200).json(result);
}

export async function getTeamWeeklyReport(req, res) {
  const { weekStart, page, limit, q, role } = req.validated.query;
  const result = await reportService.getTeamWeeklyReport(weekStart, req.user.timezone, {
    page,
    limit,
    q,
    role,
  });
  return res.status(200).json(result);
}

export async function getExceptionsReport(req, res) {
  const { from, to, role } = req.validated.query;
  const result = await reportService.getExceptionsReport(from, to, role);
  return res.status(200).json(result);
}

export async function getAttendanceExportReport(req, res) {
  const { from, to, role } = req.validated.query;
  const result = await reportService.getAttendanceExportReport(from, to, role);
  return res.status(200).json(result);
}
