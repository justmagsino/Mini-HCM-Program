import { useCallback, useEffect, useState } from 'react';
import * as attendanceApi from '../api/attendance.api.js';
import { getApiErrorMessage } from '../api/axios.js';
import { getWorkDateForTimezone, subtractDaysFromDateString } from '../utils/dates.js';
import { useAuthState } from './useAuth.js';
import { useProfileTimezone } from './useProfileTimezone.js';

export function useAttendance() {
  const { profile } = useAuthState();
  const timezone = useProfileTimezone();

  const [today, setToday] = useState(null);
  const [history, setHistory] = useState({ items: [], page: 1, limit: 31, total: 0 });
  const [historyRange, setHistoryRange] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const loadToday = useCallback(async () => {
    const data = await attendanceApi.getToday();
    setToday(data);
    return data;
  }, []);

  const loadHistory = useCallback(async (range) => {
    if (!range?.from || !range?.to) {
      return;
    }
    setHistoryLoading(true);
    try {
      const result = await attendanceApi.getHistory({
        from: range.from,
        to: range.to,
        page: 1,
        limit: 93,
      });
      setHistory(result);
      setHistoryRange(range);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      await Promise.all([loadToday(), loadHistory(historyRange)]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loadToday, loadHistory, historyRange]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const to = getWorkDateForTimezone(new Date(), timezone);
    const from = subtractDaysFromDateString(to, 30);
    const range = { from, to };
    setHistoryRange(range);

    (async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([loadToday(), loadHistory(range)]);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load on profile mount only
  }, [profile?.uid]);

  const punchIn = useCallback(async () => {
    setActionLoading(true);
    setError('');
    try {
      const attendance = await attendanceApi.punchIn();
      setToday(attendance);
      await loadHistory(historyRange);
      return attendance;
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [loadHistory, historyRange]);

  const punchOut = useCallback(async () => {
    setActionLoading(true);
    setError('');
    try {
      const result = await attendanceApi.punchOut();
      setToday(result.attendance);
      await loadHistory(historyRange);
      return result;
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [loadHistory, historyRange]);

  const applyHistoryFilter = useCallback(
    async (range) => {
      setError('');
      try {
        await loadHistory(range);
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    },
    [loadHistory],
  );

  return {
    today,
    history,
    historyRange,
    timezone,
    loading,
    historyLoading,
    actionLoading,
    error,
    isPunchedIn: today?.status === 'open',
    isDayClosed: today?.status === 'closed',
    punchIn,
    punchOut,
    refresh,
    applyHistoryFilter,
  };
}
