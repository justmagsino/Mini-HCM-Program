import { useCallback, useState } from 'react';
import { getApiErrorMessage } from '../api/axios.js';

/**
 * Shared loading/error state for data-fetch hooks and pages.
 * @template T
 * @param {() => Promise<T>} loader
 */
export function useAsyncLoad(loader) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const execute = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      return await loader();
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loader]);

  const clearError = useCallback(() => setError(''), []);

  return { loading, error, execute, clearError, setError };
}
