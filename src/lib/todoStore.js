import { useCallback, useEffect, useState } from 'react';
import { fetchTasks, readCache, readUrl, sendAction, writeCache, writeUrl } from './todoApi';

const EMPTY = { tasks: [], summary: {}, priorityOptions: [], fetchedAt: null, build: null };

export const useTodoStore = () => {
  const [url, setUrl] = useState(readUrl);
  // Paint the last known list immediately; the network refresh lands after.
  const [data, setData] = useState(() => readCache() ?? EMPTY);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const accept = useCallback((payload) => {
    const next = {
      tasks: payload.tasks ?? [],
      summary: payload.summary ?? {},
      priorityOptions: payload.priorityOptions ?? [],
      fetchedAt: payload.fetchedAt ?? new Date().toISOString(),
      build: payload.build ?? null,
    };
    setData(next);
    writeCache(next);
    setError(null);
    return next;
  }, []);

  const refresh = useCallback(async (override) => {
    const target = override ?? url;
    if (!target) return;
    setLoading(true);
    try {
      accept(await fetchTasks(target));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url, accept]);

  useEffect(() => {
    if (url) refresh(url);
    // Only on url change — refresh is recreated per render and would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const connect = useCallback((next) => {
    const trimmed = next.trim();
    writeUrl(trimmed);
    setUrl(trimmed);
    setError(null);
  }, []);

  const disconnect = useCallback(() => {
    writeUrl('');
    setUrl('');
    setData(EMPTY);
    writeCache(EMPTY);
  }, []);

  const send = useCallback(async (body) => {
    if (!url) return false;
    setBusy(true);
    try {
      accept(await sendAction(url, body));
      return true;
    } catch (err) {
      setError(err.message);
      // A refused write means the sheet moved under us, so pull the truth back.
      if (err.stale) refresh();
      return false;
    } finally {
      setBusy(false);
    }
  }, [url, accept, refresh]);

  const updateTask = useCallback((task, fields) =>
    send({ action: 'update', row: task.row, expectItem: task.item, fields }), [send]);

  const addTask = useCallback((fields) => send({ action: 'add', fields }), [send]);

  const removeTask = useCallback((task) =>
    send({ action: 'remove', row: task.row, expectItem: task.item }), [send]);

  // The checkbox is the action people tap most, so it flips locally first and
  // rolls back if the sheet refuses it.
  const toggleDone = useCallback(async (task) => {
    const optimistic = {
      ...data,
      tasks: data.tasks.map((entry) => (entry.row === task.row ? { ...entry, done: !entry.done } : entry)),
    };
    setData(optimistic);
    const ok = await send({
      action: 'update',
      row: task.row,
      expectItem: task.item,
      fields: { done: !task.done },
    });
    if (!ok) setData(data);
  }, [data, send]);

  return {
    url,
    data,
    loading,
    busy,
    error,
    connect,
    disconnect,
    refresh,
    updateTask,
    addTask,
    removeTask,
    toggleDone,
    dismissError: () => setError(null),
  };
};
