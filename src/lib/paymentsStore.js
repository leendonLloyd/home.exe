import { useCallback, useEffect, useMemo, useState } from 'react';
import { summarise } from './paymentTotals';
import { fetchPayments, readUrl, sendAction } from './todoApi';

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
  const [data, setData] = useState(() => readJson(CACHE_KEY, { rows: [], stageLabels: [], hasDueDates: false, fetchedAt: null }));
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
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
        hasDueDates: Boolean(payload.hasDueDates),
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

  // Writes go to the first empty instalment column; FINAL PAYMENT stays the
  // sheet's own formula and is never written.
  const recordPayment = useCallback(async (row, amount) => {
    if (!url) return false;
    setBusy(true);
    try {
      const payload = await sendAction(url, {
        action: 'payments.pay',
        row: row.row,
        expectVendor: row.vendor,
        amount,
      });
      const next = {
        rows: payload.rows ?? [],
        stageLabels: payload.stageLabels ?? [],
        hasDueDates: Boolean(payload.hasDueDates),
        fetchedAt: payload.fetchedAt ?? new Date().toISOString(),
      };
      setData(next);
      writeJson(CACHE_KEY, next);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      if (err.stale) refresh();
      return false;
    } finally {
      setBusy(false);
    }
  }, [url, refresh]);

  return { url, data, loading, busy, error, refresh, excluded, toggleExcluded, totals, recordPayment, dismissError: () => setError(null) };
};
