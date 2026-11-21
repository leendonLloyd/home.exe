import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// The wedding games page is read by the host's and the LED tech's browsers,
// which never sign in, so this lives outside the household subtree in a
// collection the rules let anyone read and only the household write.
export const GAMES_COLLECTION = 'weddingGames';
export const GAMES_PAGE = 'https://shira-don.github.io/wedding-invite/games.html';
const GAMES_JSON = 'https://shira-don.github.io/wedding-invite/games.json';

export const KINDS = {
  question: { prefix: 'q-', label: 'Question' },
  tiebreaker: { prefix: 'tb-', label: 'Tiebreaker' },
  song: { prefix: 'song-', label: 'Song' },
};

const ref = (id) => doc(db, GAMES_COLLECTION, id);
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const explain = (err) =>
  err.code === 'permission-denied'
    ? 'Firestore refused the request. Check the weddingGames rule is published and lists this Google account.'
    : err.message || String(err);

export function useGamesStore() {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => onSnapshot(
    collection(db, GAMES_COLLECTION),
    (snap) => {
      const next = {};
      snap.forEach((d) => { next[d.id] = d.data(); });
      setDocs(next);
      setError(null);
    },
    (err) => setError(explain(err))
  ), []);

  const report = useCallback((err) => setError(explain(err)), []);

  const lists = useMemo(() => {
    const pick = (prefix) => Object.entries(docs ?? {})
      .filter(([id]) => id.startsWith(prefix))
      .map(([id, value]) => ({ ...value, id }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return { question: pick(KINDS.question.prefix), tiebreaker: pick(KINDS.tiebreaker.prefix), song: pick(KINDS.song.prefix) };
  }, [docs]);

  const save = useCallback((kind, item) => {
    const { id, ...data } = item;
    if (id) return setDoc(ref(id), data, { merge: true }).catch(report);
    const order = lists[kind].reduce((max, entry) => Math.max(max, entry.order ?? 0), 0) + 1;
    return setDoc(ref(KINDS[kind].prefix + uid()), { ...data, order }).catch(report);
  }, [lists, report]);

  const remove = useCallback((id) => deleteDoc(ref(id)).catch(report), [report]);

  // Swapping the two orders in one batch keeps the list from ever showing both at the same position.
  const move = useCallback((kind, id, step) => {
    const list = lists[kind];
    const at = list.findIndex((entry) => entry.id === id);
    const other = list[at + step];
    if (!other) return undefined;
    const batch = writeBatch(db);
    batch.update(ref(id), { order: other.order ?? at + step });
    batch.update(ref(other.id), { order: list[at].order ?? at });
    return batch.commit().catch(report);
  }, [lists, report]);

  // The games page's games.json is the fallback copy; seeding from it means the
  // first edit starts from exactly what the page already shows.
  const seedFromJson = useCallback(async () => {
    try {
      const data = await (await fetch(GAMES_JSON, { cache: 'no-cache' })).json();
      const batch = writeBatch(db);
      (data.lms?.questions ?? []).forEach((q, n) => batch.set(ref(KINDS.question.prefix + uid() + n), { ...q, order: n + 1 }));
      (data.lms?.tiebreakers ?? []).forEach((t, n) => batch.set(ref(KINDS.tiebreaker.prefix + uid() + n), { ...t, order: n + 1 }));
      (data.tune?.songs ?? [])
        .filter((s) => !/^to follow$/i.test(s.title))
        .forEach((s, n) => batch.set(ref(KINDS.song.prefix + uid() + n), { ...s, order: n + 1 }));
      await batch.commit();
    } catch (err) {
      report(err);
    }
  }, [report]);

  return { lists, ready: docs !== null, empty: docs !== null && !Object.keys(docs).length, error, dismissError: () => setError(null), save, remove, move, seedFromJson };
}
