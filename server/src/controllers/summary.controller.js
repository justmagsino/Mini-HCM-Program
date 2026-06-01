import * as summaryService from '../services/summary.service.js';

export async function getDaily(req, res) {
  const { date } = req.validated.query;
  const data = await summaryService.getDaily(req.user.uid, date);
  return res.status(200).json({ data });
}

export async function getDailyRange(req, res) {
  const { from, to } = req.validated.query;
  const result = await summaryService.getDailyRange(req.user.uid, from, to);
  return res.status(200).json(result);
}

export async function getWeekly(req, res) {
  const { weekStart } = req.validated.query;
  const result = await summaryService.getWeekly(req.user.uid, weekStart, req.user.timezone);
  return res.status(200).json(result);
}
