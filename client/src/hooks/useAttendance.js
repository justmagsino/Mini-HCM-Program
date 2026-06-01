import { useCallback, useEffect, useState } from 'react';
import * as attendanceApi from '../api/attendance.api.js';
import { getApiErrorMessage } from '../api/axios.js';
import { getWorkDateForTimezone, subtractDaysFromDateString } from '../utils/dates.js';
import { useAuthState } from './useAuth.js';
import { useProfileTimezone } from './useProfileTimezone.js';

export const ATTENDANCE_HISTORY_PAGE_SIZE = 10;

export function useAttendance() {
  const { profile } = useAuthState();
  const timezone = useProfileTimezone();

  const [today, setToday] = useState(null);
  const [history, setHistory] = useState({
    items: [],
    page: 1,
    limit: ATTENDANCE_HISTORY_PAGE_SIZE,
    total: 0,
  });
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

  const loadHistory = useCallback(async (range, page = 1) => {
    if (!range?.from || !range?.to) {
      return;
    }
    setHistoryLoading(true);
    try {
      const result = await attendanceApi.getHistory({
        from: range.from,
        to: range.to,
        page,
        limit: ATTENDANCE_HISTORY_PAGE_SIZE,
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
      await Promise.all([loadToday(), loadHistory(historyRange, history.page)]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loadToday, loadHistory, historyRange, history.page]);

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
      await loadHistory(historyRange, history.page);
      return attendance;
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [loadHistory, historyRange, history.page]);

  const punchOut = useCallback(async () => {
    setActionLoading(true);
    setError('');
    try {
      const result = await attendanceApi.punchOut();
      setToday(result.attendance);
      await loadHistory(historyRange, history.page);
      return result;
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [loadHistory, historyRange, history.page]);

  const applyHistoryFilter = useCallback(
    async (range) => {
      setError('');
      try {
        await loadHistory(range, 1);
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    },
    [loadHistory],
  );

  const changeHistoryPage = useCallback(
    async (page) => {
      setError('');
      try {
        await loadHistory(historyRange, page);
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    },
    [loadHistory, historyRange],
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
    changeHistoryPage,
    historyPageSize: ATTENDANCE_HISTORY_PAGE_SIZE,
  };
}
