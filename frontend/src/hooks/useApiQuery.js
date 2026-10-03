/**
 * ECCD CARE — Custom Hook: useApiQuery
 * Standardized data fetching with loading, error, and empty states
 */

import { useState, useEffect, useCallback } from 'react';

export function useApiQuery(apiFn, deps = [], { immediate = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      if (res && res.ok !== false) {
        setData(res.data !== undefined ? res.data : res);
        return res.data !== undefined ? res.data : res;
      } else {
        const errMsg = res?.error || 'Failed to fetch data';
        setError(errMsg);
        return null;
      }
    } catch (err) {
      const errMsg = err?.message || 'Network or server error';
      setError(errMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const isEmpty = !loading && !error && (
    data === null ||
    data === undefined ||
    (Array.isArray(data) && data.length === 0)
  );

  return {
    data,
    loading,
    error,
    isEmpty,
    refetch: execute,
    execute,
    setData,
  };
}

export default useApiQuery;
