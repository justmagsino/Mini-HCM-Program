import { useCallback, useEffect, useMemo, useState } from 'react';
import * as adminApi from '../api/admin.api.js';
import { getApiErrorMessage } from '../api/axios.js';
import { buildTeamOvertimeByDay } from '../utils/chartData.js';
import { getCurrentWeekStart, getWorkDateForTimezone } from '../utils/dates.js';
import { useProfileTimezone } from './useProfileTimezone.js';

export function useAdminDashboard() {
  const timezone = useProfileTimezone();

  const [date, setDate] = useState(() => getWorkDateForTimezone(new Date(), timezone));
  const [kpis, setKpis] = useState(null);
  const [roster, setRoster] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const weekStart = useMemo(() => getCurrentWeekStart(timezone), [timezone]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [dayOverview, weekly, exc] = await Promise.all([
        adminApi.getDayOverview(date),
        adminApi.getTeamWeeklyReport({ weekStart, page: 1, limit: 100 }),
        adminApi.getExceptionsReport({ from: weekStart, to: date }),
      ]);
      setKpis(dayOverview.kpis);
      setRoster(dayOverview.roster);
      setWeeklyReport(weekly);
      setExceptions(exc);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [date, weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const otChartData = useMemo(
    () => buildTeamOvertimeByDay(weeklyReport?.items ?? [], weekStart),
    [weeklyReport, weekStart],
  );

  return {
    date,
    setDate,
    kpis,
    roster,
    exceptions,
    otChartData,
    timezone,
    loading,
    error,
    retry: load,
  };
}
