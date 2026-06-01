import { useCallback, useEffect, useMemo, useState } from 'react';
import * as adminApi from '../api/admin.api.js';
import { getApiErrorMessage } from '../api/axios.js';
import { buildTeamOvertimeByDay } from '../utils/chartData.js';
import { getWeekStartForDate, getWorkDateForTimezone } from '../utils/dates.js';
import { useProfileTimezone } from './useProfileTimezone.js';

export function useAdminDashboard() {
  const timezone = useProfileTimezone();

  const [date, setDate] = useState(() => getWorkDateForTimezone(new Date(), timezone));
  const [kpis, setKpis] = useState(null);
  const [roster, setRoster] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /** Monday of the week that contains the selected dashboard date */
  const weekStart = useMemo(() => getWeekStartForDate(date, timezone), [date, timezone]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [dayOverview, weekly] = await Promise.all([
        adminApi.getDayOverview(date),
        adminApi.getTeamWeeklyReport({ weekStart, page: 1, limit: 100 }),
      ]);
      setKpis(dayOverview.kpis);
      setRoster(dayOverview.roster);
      setWeeklyReport(weekly);
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
    otChartData,
    timezone,
    loading,
    error,
    retry: load,
  };
}
