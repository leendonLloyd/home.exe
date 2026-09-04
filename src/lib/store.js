import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_STATE, OWNER_COLORS } from './defaults';

const STORAGE_KEY = 'home.exe:laundry:v1';

const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const readState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      owners: parsed.owners ?? [],
      items: parsed.items ?? [],
      counts: parsed.counts ?? {},
      sessions: parsed.sessions ?? [],
    };
  } catch {
    return DEFAULT_STATE;
  }
};

export const useLaundryStore = () => {
  const [state, setState] = useState(readState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addOwner = useCallback((name) => {
    setState((prev) => ({
      ...prev,
      owners: [...prev.owners, { id: uid('own'), name: name.trim(), color: OWNER_COLORS[prev.owners.length % OWNER_COLORS.length] }],
    }));
  }, []);

  const deleteOwner = useCallback((ownerId) => {
    setState((prev) => {
      const items = prev.items.filter((item) => item.ownerId !== ownerId);
      const counts = Object.fromEntries(Object.entries(prev.counts).filter(([id]) => items.some((item) => item.id === id)));
      return { ...prev, owners: prev.owners.filter((owner) => owner.id !== ownerId), items, counts };
    });
  }, []);

  const saveItem = useCallback((draft) => {
    const { colorTypes, ...rest } = draft;
    const colors = colorTypes?.length ? colorTypes : [draft.colorType];

    setState((prev) => {
      const [primary, ...extras] = colors;
      const base = draft.id
        ? prev.items.map((item) => (item.id === draft.id ? { ...item, ...rest, colorType: primary } : item))
        : [...prev.items, { ...rest, colorType: primary, id: uid('itm') }];

      const added = extras
        .filter(
          (colorType) =>
            !base.some((item) => item.name === rest.name && item.ownerId === rest.ownerId && item.colorType === colorType)
        )
        .map((colorType) => ({ ...rest, colorType, id: uid('itm') }));

      return { ...prev, items: [...base, ...added] };
    });
  }, []);

  const deleteItem = useCallback((itemId) => {
    setState((prev) => {
      const { [itemId]: removed, ...counts } = prev.counts;
      return { ...prev, items: prev.items.filter((item) => item.id !== itemId), counts };
    });
  }, []);

  const bumpCount = useCallback((itemId, delta) => {
    setState((prev) => {
      const next = Math.max(0, (prev.counts[itemId] ?? 0) + delta);
      return { ...prev, counts: { ...prev.counts, [itemId]: next } };
    });
  }, []);

  const resetCounts = useCallback(() => {
    setState((prev) => ({ ...prev, counts: {} }));
  }, []);

  const saveSession = useCallback((date, note) => {
    setState((prev) => {
      const lines = prev.items
        .filter((item) => (prev.counts[item.id] ?? 0) > 0)
        .map((item) => {
          const owner = prev.owners.find((entry) => entry.id === item.ownerId);
          return {
            itemId: item.id,
            name: item.name,
            icon: item.icon,
            colorType: item.colorType,
            ownerName: owner ? owner.name : 'Unassigned',
            count: prev.counts[item.id],
          };
        });
      if (!lines.length) return prev;
      const session = {
        id: uid('ses'),
        date,
        note: note.trim(),
        savedAt: new Date().toISOString(),
        total: lines.reduce((sum, line) => sum + line.count, 0),
        lines,
      };
      return { ...prev, counts: {}, sessions: [session, ...prev.sessions] };
    });
  }, []);

  const deleteSession = useCallback((sessionId) => {
    setState((prev) => ({ ...prev, sessions: prev.sessions.filter((session) => session.id !== sessionId) }));
  }, []);

  const exportState = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laundry-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importState = useCallback(async (file) => {
    const parsed = JSON.parse(await file.text());
    setState({
      owners: parsed.owners ?? [],
      items: parsed.items ?? [],
      counts: parsed.counts ?? {},
      sessions: parsed.sessions ?? [],
    });
  }, []);

  return {
    state,
    addOwner,
    deleteOwner,
    saveItem,
    deleteItem,
    bumpCount,
    resetCounts,
    saveSession,
    deleteSession,
    exportState,
    importState,
  };
};
