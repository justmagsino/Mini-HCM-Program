import { useCallback, useEffect, useState } from 'react';
import * as summaryApi from '../api/summary.api.js';
import { getApiErrorMessage } from '../api/axios.js';
import {
  getCurrentWeekStart,
  getWorkDateForTimezone,
  subtractDaysFromDateString,
} from '../utils/dates.js';
import { useAuthState } from './useAuth.js';
import { useProfileTimezone } from './useProfileTimezone.js';

export function useSummary() {
  const { profile } = useAuthState();
  const timezone = useProfileTimezone();

  const [todaySummary, setTodaySummary] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [rangeItems, setRangeItems] = useState([]);
  const [weekStart, setWeekStart] = useState('');
  const [loading, setLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [error, setError] = useState('');

  const loadToday = useCallback(async () => {
    const date = getWorkDateForTimezone(new Date(), timezone);
    const data = await summaryApi.getDaily(date);
    setTodaySummary(data);
    return data;
  }, [timezone]);

  const loadWeekly = useCallback(
    async (start) => {
      setWeeklyLoading(true);
      setError('');
      try {
        const ws = start ?? getCurrentWeekStart(timezone);
        setWeekStart(ws);
        const data = await summaryApi.getWeekly(ws);
        setWeekly(data);
        return data;
      } catch (err) {
        setError(getApiErrorMessage(err));
        throw err;
      } finally {
        setWeeklyLoading(false);
      }
    },
    [timezone],
  );

  const loadRange = useCallback(async () => {
    const to = getWorkDateForTimezone(new Date(), timezone);
    const from = subtractDaysFromDateString(to, 30);
    const items = await summaryApi.getDailyRange({ from, to });
    setRangeItems(items);
    return items;
  }, [timezone]);

  const refresh = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      await Promise.all([loadToday(), loadWeekly(), loadRange()]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loadToday, loadWeekly, loadRange]);

  useEffect(() => {
    if (!profile) {
      return;
    }
    refresh();
  }, [profile?.uid, refresh]);

  return {
    todaySummary,
    weekly,
    rangeItems,
    weekStart,
    timezone,
    loading,
    weeklyLoading,
    error,
    loadWeekly,
    refresh,
  };
}
