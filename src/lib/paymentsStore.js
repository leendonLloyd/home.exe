import { useCallback, useEffect, useMemo, useState } from 'react';
import { summarise } from './paymentTotals';
import { fetchPayments, readUrl } from './todoApi';

const CACHE_KEY = 'home.exe:payments:cache:v1';
const EXCLUDE_KEY = 'home.exe:payments:excluded:v1';

const readJson = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* cache is a convenience, not a requirement */
  }
};

export const usePaymentsStore = () => {
  const [url] = useState(readUrl);
  const [data, setData] = useState(() => readJson(CACHE_KEY, { rows: [], stageLabels: [], fetchedAt: null }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keyed by vendor name rather than row number, because rows shift and the
  // name is what the exclusion actually means.
  const [excluded, setExcluded] = useState(() => readJson(EXCLUDE_KEY, []));

  const refresh = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      const payload = await fetchPayments(url);
      const next = {
        rows: payload.rows ?? [],
        stageLabels: payload.stageLabels ?? [],
        fetchedAt: payload.fetchedAt ?? new Date().toISOString(),
      };
      setData(next);
      writeJson(CACHE_KEY, next);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (url) refresh();
  }, [url, refresh]);

  const toggleExcluded = useCallback((vendor) => {
    setExcluded((prev) => {
      const next = prev.includes(vendor) ? prev.filter((v) => v !== vendor) : [...prev, vendor];
      writeJson(EXCLUDE_KEY, next);
      return next;
    });
  }, []);

  const totals = useMemo(() => summarise(data.rows, excluded), [data.rows, excluded]);

  return { url, data, loading, error, refresh, excluded, toggleExcluded, totals, dismissError: () => setError(null) };
};
