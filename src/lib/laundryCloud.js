import { useCallback, useMemo } from 'react';
import { deleteDoc, increment, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { docRef, useCloudDocs } from './cloudDocs';
import { DEFAULT_STATE, OWNER_COLORS } from './defaults';
import { db } from './firebase';

// One collection holds everything laundry: a `config` doc for owners and items,
// a `counts` doc whose fields are per-item tallies, and one `bulk-*` doc per
// saved session. A single listener then covers the whole app, and counts can be
// bumped with increment() instead of rewriting a document two people are both
// editing over the same pile of washing.
const ref = (id) => docRef('laundry', id);
const BULK = 'bulk-';

const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// increment() cannot clamp, and clamping in a transaction would give up the
// conflict-free property that is the whole reason for using it. So a stray
// negative is corrected on the way out instead.
const atLeastZero = (value) => Math.max(0, Number(value) || 0);

export const useLaundryStore = () => {
  const { docs, ready, error, setError, report } = useCloudDocs('laundry');

  const state = useMemo(() => {
    const d = docs ?? {};
    const config = d.config ?? {};
    const counts = {};
    Object.entries(d.counts ?? {}).forEach(([itemId, value]) => {
      const n = atLeastZero(value);
      if (n > 0) counts[itemId] = n;
    });
    const sessions = Object.entries(d)
      .filter(([id]) => id.startsWith(BULK))
      .map(([, value]) => value)
      .sort((a, b) => String(b.savedAt ?? b.date).localeCompare(String(a.savedAt ?? a.date)));
    return { owners: config.owners ?? [], items: config.items ?? [], counts, sessions };
  }, [docs]);

  const writeConfig = useCallback((patch) => {
    const next = { owners: state.owners, items: state.items, ...patch };
    return setDoc(ref('config'), next, { merge: true }).catch(report);
  }, [state.owners, state.items]);

  const addOwner = useCallback((name) => writeConfig({
    owners: [...state.owners, { id: uid('own'), name: name.trim(), color: OWNER_COLORS[state.owners.length % OWNER_COLORS.length] }],
  }), [state.owners, writeConfig]);

  const deleteOwner = useCallback((ownerId) => {
    const items = state.items.filter((item) => item.ownerId !== ownerId);
    const dropped = state.items.filter((item) => item.ownerId === ownerId).map((item) => item.id);
    const batch = writeBatch(db);
    batch.set(ref('config'), { owners: state.owners.filter((o) => o.id !== ownerId), items }, { merge: true });
    if (dropped.length) {
      batch.set(ref('counts'), Object.fromEntries(dropped.map((id) => [id, 0])), { merge: true });
    }
    return batch.commit().catch(report);
  }, [state.owners, state.items]);

  const saveItem = useCallback((draft) => {
    const { colorTypes, ...rest } = draft;
    const colors = colorTypes?.length ? colorTypes : [draft.colorType];
    const [primary, ...extras] = colors;
    const base = draft.id
      ? state.items.map((item) => (item.id === draft.id ? { ...item, ...rest, colorType: primary } : item))
      : [...state.items, { ...rest, colorType: primary, id: uid('itm') }];
    const added = extras
      .filter((colorType) => !base.some((i) => i.name === rest.name && i.ownerId === rest.ownerId && i.colorType === colorType))
      .map((colorType) => ({ ...rest, colorType, id: uid('itm') }));
    return writeConfig({ items: [...base, ...added] });
  }, [state.items, writeConfig]);

  const deleteItem = useCallback((itemId) => {
    const batch = writeBatch(db);
    batch.set(ref('config'), { items: state.items.filter((i) => i.id !== itemId) }, { merge: true });
    batch.set(ref('counts'), { [itemId]: 0 }, { merge: true });
    return batch.commit().catch(report);
  }, [state.items]);

  // The one write that genuinely needs to be conflict-free.
  const bumpCount = useCallback((itemId, delta) =>
    setDoc(ref('counts'), { [itemId]: increment(delta) }, { merge: true }).catch(report), []);

  const resetCounts = useCallback(() =>
    setDoc(ref('counts'), {}).catch(report), []);

  const saveSession = useCallback((date, note) => {
    const lines = state.items
      .filter((item) => (state.counts[item.id] ?? 0) > 0)
      .map((item) => {
        const owner = state.owners.find((o) => o.id === item.ownerId);
        return {
          itemId: item.id, name: item.name, icon: item.icon, colorType: item.colorType,
          ownerName: owner ? owner.name : 'Unassigned', count: state.counts[item.id],
        };
      });
    if (!lines.length) return Promise.resolve();
    const id = uid('ses');
    const batch = writeBatch(db);
    batch.set(ref(BULK + id), {
      id, date, note: note.trim(), savedAt: new Date().toISOString(),
      total: lines.reduce((sum, line) => sum + line.count, 0), lines, returned: {}, closedAt: null,
    });
    batch.set(ref('counts'), {});
    return batch.commit().catch(report);
  }, [state.items, state.counts, state.owners]);

  const deleteSession = useCallback((sessionId) =>
    deleteDoc(ref(BULK + sessionId)).catch(report), []);

  const bumpReturn = useCallback((sessionId, itemId, delta) =>
    updateDoc(ref(BULK + sessionId), { [`returned.${itemId}`]: increment(delta) }).catch(report), []);

  const resetReturns = useCallback((sessionId) =>
    updateDoc(ref(BULK + sessionId), { returned: {}, closedAt: null }).catch(report), []);

  const closeCheck = useCallback((sessionId) =>
    updateDoc(ref(BULK + sessionId), { closedAt: new Date().toISOString() }).catch(report), []);

  const reopenCheck = useCallback((sessionId) =>
    updateDoc(ref(BULK + sessionId), { closedAt: null }).catch(report), []);

  /**
   * Writes the starting owners and clothing types.
   *
   * Offered rather than written on first load: two phones opening a fresh
   * household would both seed it, and seeding after someone has imported their
   * own data would leave the defaults sitting among it.
   */
  const seedDefaults = useCallback(() =>
    setDoc(ref('config'), { owners: DEFAULT_STATE.owners, items: DEFAULT_STATE.items }).catch(report), [report]);

  const exportState = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laundry-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state]);

  /** Replaces everything, so an import is never half-merged with what is there. */
  const replaceAll = useCallback(async (incoming) => {
    const batch = writeBatch(db);
    batch.set(ref('config'), { owners: incoming.owners ?? [], items: incoming.items ?? [] });
    batch.set(ref('counts'), incoming.counts ?? {});
    Object.keys(docs ?? {}).filter((id) => id.startsWith(BULK)).forEach((id) => batch.delete(ref(id)));
    (incoming.sessions ?? []).forEach((session) => {
      const id = session.id || uid('ses');
      batch.set(ref(BULK + id), { ...session, id, returned: session.returned ?? {}, closedAt: session.closedAt ?? null });
    });
    await batch.commit();
  }, [docs]);

  const importState = useCallback(async (file) => {
    try {
      await replaceAll(JSON.parse(await file.text()));
    } catch (err) {
      report(err);
    }
  }, [replaceAll]);

  return {
    state,
    ready,
    error,
    dismissError: () => setError(null),
    addOwner, deleteOwner, saveItem, deleteItem, bumpCount, resetCounts,
    saveSession, deleteSession, bumpReturn, resetReturns, closeCheck, reopenCheck,
    seedDefaults, exportState, importState, replaceAll,
  };
};
