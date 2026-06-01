import { useCallback, useEffect, useState } from 'react';
import * as attendanceApi from '../api/attendance.api.js';
import * as summaryApi from '../api/summary.api.js';
import { getApiErrorMessage } from '../api/axios.js';
import { getCurrentWeekStart, getWorkDateForTimezone } from '../utils/dates.js';
import { useAuthState } from './useAuth.js';
import { useProfileTimezone } from './useProfileTimezone.js';

export function useEmployeeDashboard() {
  const { profile } = useAuthState();
  const timezone = useProfileTimezone();
  const profileUid = profile?.uid;

  const [attendanceToday, setAttendanceToday] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!profileUid) {
      return;
    }

    setLoading(true);
    setError('');

    const today = getWorkDateForTimezone(new Date(), timezone);
    const weekStart = getCurrentWeekStart(timezone);

    try {
      const [attendance, summary, week] = await Promise.all([
        attendanceApi.getToday(),
        summaryApi.getDaily(today),
        summaryApi.getWeekly(weekStart),
      ]);
      setAttendanceToday(attendance);
      setDailySummary(summary);
      setWeekly(week);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [profileUid, timezone]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    attendanceToday,
    dailySummary,
    weekly,
    timezone,
    loading,
    error,
    retry: load,
  };
}
