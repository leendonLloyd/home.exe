import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// The wedding games page is read by the host's and the LED tech's browsers,
// which never sign in, so this lives outside the household subtree in a
// collection the rules let anyone read and only the household write.
export const GAMES_COLLECTION = 'weddingGames';
export const GAMES_PAGE = 'https://shira-don.github.io/wedding-invite/games.html';
const SITE = 'https://shira-don.github.io/wedding-invite/';
export const TIERS = ['minor', 'major', 'grand'];

export const KINDS = {
  question: { prefix: 'q-', label: 'Question' },
  tiebreaker: { prefix: 'tb-', label: 'Tiebreaker' },
  song: { prefix: 'song-', label: 'Song' },
  prize: { prefix: 'prize-', label: 'Prize' },
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
    return Object.fromEntries(Object.entries(KINDS).map(([kind, { prefix }]) => [kind, pick(prefix)]));
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

  // The site's JSON files are the fallback copies; seeding from them means the first edit
  // starts from exactly what the pages already show.
  const seedFromJson = useCallback(async (kind) => {
    try {
      const fetchJson = async (file) => (await fetch(SITE + file, { cache: 'no-cache' })).json();
      const games = kind === 'prize' ? null : await fetchJson('games.json');
      const rows = {
        question: () => games.lms?.questions ?? [],
        tiebreaker: () => games.lms?.tiebreakers ?? [],
        song: () => (games.tune?.songs ?? []).filter((s) => !/^to follow$/i.test(s.title)),
        prize: async () => fetchJson('raffle-prizes.json'),
      }[kind];
      const batch = writeBatch(db);
      (await rows()).forEach((row, n) => batch.set(ref(KINDS[kind].prefix + uid() + n), { ...row, order: n + 1 }));
      await batch.commit();
    } catch (err) {
      report(err);
    }
  }, [report]);

  return { lists, ready: docs !== null, error, dismissError: () => setError(null), save, remove, move, seedFromJson };
}
