import { useCallback, useEffect, useMemo, useRef } from 'react';
import { deleteDoc, deleteField, increment, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { docRef, useCloudDocs } from './cloudDocs';
import { DEFAULT_STATE, OWNER_COLORS } from './defaults';
import { db } from './firebase';

// One collection holds everything laundry. Owners, clothing types and saved
// bulks are each their own document, so two phones adding different things
// write to different records and neither can overwrite the other. Counts are
// the exception — one document with a field per item, because increment() is
// what makes two people counting the same pile at once safe.
//
// `config` is the old shape, a single document holding both arrays. It is
// still read so nothing disappears before it has been migrated.
const ref = (id) => docRef('laundry', id);
const OWNER = 'own-';
const ITEM = 'itm-';
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

    // Per-document records win; anything still only in `config` is carried
    // until it is migrated, so the move needs no flag day.
    const byId = (prefix, fallback) => {
      const own = Object.entries(d).filter(([id]) => id.startsWith(prefix)).map(([, value]) => value);
      const have = new Set(own.map((entry) => entry.id));
      return [...own, ...(fallback ?? []).filter((entry) => !have.has(entry.id))];
    };
    const owners = byId(OWNER, config.owners);
    const items = byId(ITEM, config.items);

    const counts = {};
    Object.entries(d.counts ?? {}).forEach(([itemId, value]) => {
      const n = atLeastZero(value);
      if (n > 0) counts[itemId] = n;
    });
    const sessions = Object.entries(d)
      .filter(([id]) => id.startsWith(BULK))
      .map(([, value]) => value)
      .sort((a, b) => String(b.savedAt ?? b.date).localeCompare(String(a.savedAt ?? a.date)));
    return { owners, items, counts, sessions, legacyConfig: Boolean(config.owners || config.items) };
  }, [docs]);

  const addOwner = useCallback((name) => {
    const id = `own-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    return setDoc(ref(id), { id, name: name.trim(), color: OWNER_COLORS[state.owners.length % OWNER_COLORS.length] }).catch(report);
  }, [state.owners.length, report]);

  const deleteOwner = useCallback((ownerId) => {
    const orphaned = state.items.filter((item) => item.ownerId === ownerId);
    const batch = writeBatch(db);
    batch.delete(ref(ownerId));
    orphaned.forEach((item) => batch.delete(ref(item.id)));
    if (orphaned.length) {
      batch.set(ref('counts'), Object.fromEntries(orphaned.map((item) => [item.id, 0])), { merge: true });
    }
    // Only meaningful while the old single-document shape is still around.
    if (state.legacyConfig) {
      batch.set(ref('config'), {
        owners: state.owners.filter((owner) => owner.id !== ownerId),
        items: state.items.filter((item) => item.ownerId !== ownerId),
      }, { merge: true });
    }
    return batch.commit().catch(report);
  }, [state.owners, state.items, state.legacyConfig, report]);

  const saveItem = useCallback((draft) => {
    const { colorTypes, ...rest } = draft;
    const colors = colorTypes?.length ? colorTypes : [draft.colorType];
    const [primary, ...extras] = colors;
    const batch = writeBatch(db);

    const id = draft.id || `itm-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    batch.set(ref(id), { ...rest, id, colorType: primary }, { merge: true });

    extras
      .filter((colorType) => !state.items.some((item) =>
        item.name === rest.name && item.ownerId === rest.ownerId && item.colorType === colorType))
      .forEach((colorType, index) => {
        const extraId = `itm-${Date.now().toString(36)}${index}${Math.random().toString(36).slice(2, 6)}`;
        batch.set(ref(extraId), { ...rest, id: extraId, colorType });
      });

    return batch.commit().catch(report);
  }, [state.items, report]);

  const deleteItem = useCallback((itemId) => {
    const batch = writeBatch(db);
    batch.delete(ref(itemId));
    batch.set(ref('counts'), { [itemId]: 0 }, { merge: true });
    if (state.legacyConfig) {
      batch.set(ref('config'), { items: state.items.filter((item) => item.id !== itemId) }, { merge: true });
    }
    return batch.commit().catch(report);
  }, [state.items, state.legacyConfig, report]);

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
  const seedDefaults = useCallback(() => {
    const batch = writeBatch(db);
    DEFAULT_STATE.owners.forEach((owner) => batch.set(ref(owner.id), owner));
    DEFAULT_STATE.items.forEach((item) => batch.set(ref(item.id), item));
    return batch.commit().catch(report);
  }, [report]);

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
    // Clear the lot first: a replace that left yesterday's owners behind would
    // be a merge, which is exactly what the import promises not to do.
    Object.keys(docs ?? {})
      .filter((id) => id !== 'counts')
      .forEach((id) => batch.delete(ref(id)));
    (incoming.owners ?? []).forEach((owner) => batch.set(ref(owner.id), owner));
    (incoming.items ?? []).forEach((item) => batch.set(ref(item.id), item));
    batch.set(ref('counts'), incoming.counts ?? {});
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

  // Idempotent: the ids are already own-* and itm-*, so writing them as their
  // own documents produces the same records whichever phone gets there first,
  // and dropping an already-dropped config is a no-op.
  const migrated = useRef(false);
  useEffect(() => {
    if (!ready || !state.legacyConfig || migrated.current) return;
    migrated.current = true;
    const batch = writeBatch(db);
    state.owners.forEach((owner) => batch.set(ref(owner.id), owner));
    state.items.forEach((item) => batch.set(ref(item.id), item));
    batch.set(ref('config'), { owners: deleteField(), items: deleteField() }, { merge: true });
    batch.commit().catch(report);
  }, [ready, state.legacyConfig, state.owners, state.items, report]);

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
