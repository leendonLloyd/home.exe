import { useCallback, useMemo } from 'react';
import { deleteDoc, increment, setDoc, writeBatch } from 'firebase/firestore';
import { docRef, useCloudDocs } from './cloudDocs';
import { db } from './firebase';

// `catalogue` is the standing list of things the household buys; `cart` holds
// how many of each are wanted on this trip, as one field per item so a tap is
// an increment() rather than a write that could undo the other phone's. `got`
// marks what is already in the trolley, and each finished trip is kept as its
// own document.
const ITEM = 'item-';
const TRIP = 'trip-';
const ref = (id) => docRef('grocery', id);

const uid = (prefix) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const atLeastZero = (value) => Math.max(0, Number(value) || 0);

export const useGroceryStore = () => {
  const { docs, ready, error, setError, report } = useCloudDocs('grocery');

  const state = useMemo(() => {
    const d = docs ?? {};
    const items = Object.entries(d)
      .filter(([id]) => id.startsWith(ITEM))
      .map(([, value]) => value)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Only for items that still exist. A quantity left behind by a deleted
    // item renders nowhere, but would still be counted in "still to get" —
    // a total that cannot be reconciled with anything on screen.
    const known = new Set(items.map((item) => item.id));
    const want = {};
    Object.entries(d.cart ?? {}).forEach(([itemId, value]) => {
      const n = atLeastZero(value);
      if (n > 0 && known.has(itemId)) want[itemId] = n;
    });

    const trips = Object.entries(d)
      .filter(([id]) => id.startsWith(TRIP))
      .map(([, value]) => value)
      .sort((a, b) => String(b.savedAt ?? b.date).localeCompare(String(a.savedAt ?? a.date)));

    // Only meaningful for items still wanted; a leftover tick on something
    // since removed from the list would otherwise skew the trolley count.
    const got = {};
    Object.entries(d.got ?? {}).forEach(([itemId, value]) => {
      if (value && want[itemId]) got[itemId] = true;
    });

    return { items, want, got, trips };
  }, [docs]);

  const saveItem = useCallback((draft) => {
    const id = draft.id || uid('g');
    return setDoc(ref(ITEM + id), { ...draft, id }, { merge: true }).catch(report);
  }, [report]);

  const deleteItem = useCallback((itemId) => {
    const batch = writeBatch(db);
    batch.delete(ref(ITEM + itemId));
    batch.set(ref('cart'), { [itemId]: 0 }, { merge: true });
    batch.set(ref('got'), { [itemId]: false }, { merge: true });
    return batch.commit().catch(report);
  }, [report]);

  // The write that has to be conflict-free: both of you adding to the list.
  const bumpWant = useCallback((itemId, delta) =>
    setDoc(ref('cart'), { [itemId]: increment(delta) }, { merge: true }).catch(report), [report]);

  const toggleGot = useCallback((itemId, next) =>
    setDoc(ref('got'), { [itemId]: next }, { merge: true }).catch(report), [report]);

  const clearList = useCallback(() => {
    const batch = writeBatch(db);
    batch.set(ref('cart'), {});
    batch.set(ref('got'), {});
    return batch.commit().catch(report);
  }, [report]);

  /** Files the trip into history and empties the list for the next one. */
  const saveTrip = useCallback((date, note) => {
    const lines = state.items
      .filter((item) => state.want[item.id] > 0)
      .map((item) => ({
        itemId: item.id,
        name: item.name,
        icon: item.icon,
        aisle: item.aisle,
        qty: state.want[item.id],
        got: Boolean(state.got[item.id]),
      }));
    if (!lines.length) return Promise.resolve();

    const id = uid('t');
    const batch = writeBatch(db);
    batch.set(ref(TRIP + id), {
      id,
      date,
      note: note.trim(),
      savedAt: new Date().toISOString(),
      total: lines.reduce((sum, line) => sum + line.qty, 0),
      picked: lines.filter((line) => line.got).reduce((sum, line) => sum + line.qty, 0),
      lines,
    });
    batch.set(ref('cart'), {});
    batch.set(ref('got'), {});
    return batch.commit().catch(report);
  }, [state.items, state.want, state.got, report]);

  const deleteTrip = useCallback((tripId) => deleteDoc(ref(TRIP + tripId)).catch(report), [report]);

  /** Puts a past trip's quantities back on the list — the weekly shop repeats. */
  const repeatTrip = useCallback((trip) => {
    const batch = writeBatch(db);
    batch.set(ref('cart'), Object.fromEntries(trip.lines.map((line) => [line.itemId, line.qty])));
    batch.set(ref('got'), {});
    return batch.commit().catch(report);
  }, [report]);

  const exportState = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grocery-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const seedPresets = useCallback((presets) => {
    const batch = writeBatch(db);
    presets.forEach((preset) => {
      const id = uid('g');
      batch.set(ref(ITEM + id), { ...preset, id });
    });
    return batch.commit().catch(report);
  }, [report]);

  return {
    state, ready, error, dismissError: () => setError(null),
    saveItem, deleteItem, bumpWant, toggleGot, clearList,
    saveTrip, deleteTrip, repeatTrip, exportState, seedPresets,
  };
};
