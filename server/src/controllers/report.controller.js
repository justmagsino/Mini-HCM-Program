import * as reportService from '../services/report.service.js';

export async function getAdminDailySummary(req, res) {
  const { userId, date } = req.validated.query;
  const data = await reportService.getAdminDailySummary(userId, date);
  return res.status(200).json({ data });
}

export async function getTeamDailyReport(req, res) {
  const { date } = req.validated.query;
  const result = await reportService.getTeamDailyReport(date);
  return res.status(200).json(result);
}

export async function getTeamWeeklyReport(req, res) {
  const { weekStart, page, limit } = req.validated.query;
  const result = await reportService.getTeamWeeklyReport(weekStart, req.user.timezone, {
    page,
    limit,
  });
  return res.status(200).json(result);
}

export async function getExceptionsReport(req, res) {
  const { from, to } = req.validated.query;
  const result = await reportService.getExceptionsReport(from, to);
  return res.status(200).json(result);
}
