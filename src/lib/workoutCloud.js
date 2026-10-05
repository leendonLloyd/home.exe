import { useCallback, useMemo } from 'react';
import { deleteField, setDoc, writeBatch } from 'firebase/firestore';
import { docRef, useCloudDocs } from './cloudDocs';
import { db } from './firebase';
import { BASE_GROUPS, PARTS, SEED_SESSIONS } from './workoutHistory';
import { PLANS } from './workoutPlans';

// `current` holds the chosen plan and the sets part-way through today; each
// finished session's exercises are their own documents. Logging a set is a
// field write on one document, so it never rewrites a session already filed.
const ENTRY = 'entry-';
const ref = (id) => docRef('workout', id);

const uid = () => `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const loadLabelOf = (logged) => {
  const weights = logged.filter((set) => set && set.reps > 0).map((set) => set.weight);
  if (!weights.length || weights.every((value) => value == null)) return null;
  const shown = weights.map((value) => (value == null ? 'bw' : String(value)));
  return shown.every((value) => value === shown[0]) ? shown[0] : shown.join(' / ');
};

export const useWorkoutStore = () => {
  const { docs, ready, error, setError, report } = useCloudDocs('workout');

  const state = useMemo(() => {
    const d = docs ?? {};
    const current = d.current ?? {};
    return {
      planId: current.planId ?? PLANS[0].id,
      sets: current.sets ?? {},
      entries: Object.entries(d).filter(([id]) => id.startsWith(ENTRY)).map(([, value]) => value),
    };
  }, [docs]);

  // Seeded history stays authoritative in code; logged sessions layer on top.
  const groups = useMemo(() => {
    const byKey = new Map(BASE_GROUPS.map((group) => [group.key, { ...group, entries: [...group.entries] }]));
    state.entries.forEach((entry) => {
      const group = byKey.get(entry.key);
      if (group) group.entries.push(entry);
      else byKey.set(entry.key, { key: entry.key, part: entry.part ?? 'Other', exercise: entry.exercise, slot: entry.slot, entries: [entry] });
    });
    const order = (part) => (PARTS.includes(part) ? PARTS.indexOf(part) : PARTS.length);
    return [...byKey.values()]
      .map((group) => ({ ...group, entries: [...group.entries].sort((a, b) => a.session - b.session) }))
      .sort((a, b) => order(a.part) - order(b.part));
  }, [state.entries]);

  const sessions = useMemo(() => {
    const byNumber = new Map(SEED_SESSIONS.map((session) => [session.session, session]));
    state.entries.forEach((entry) => {
      if (!byNumber.has(entry.session)) {
        byNumber.set(entry.session, { session: entry.session, day: entry.day, note: entry.date ?? '', logged: true });
      }
    });
    return [...byNumber.values()].sort((a, b) => b.session - a.session);
  }, [state.entries]);

  const nextSession = useMemo(
    () => groups.reduce((max, group) => group.entries.reduce((inner, entry) => Math.max(inner, entry.session), max), 0) + 1,
    [groups]
  );

  const bestOf = useCallback((key) =>
    groups.find((group) => group.key === key)?.entries.reduce((best, entry) => (entry.total > (best?.total ?? -1) ? entry : best), null) ?? null,
    [groups]);

  const lastOf = useCallback((key) => {
    const entries = groups.find((group) => group.key === key)?.entries ?? [];
    return entries.length ? entries[entries.length - 1] : null;
  }, [groups]);

  const setPlan = useCallback((planId) =>
    setDoc(ref('current'), { planId }, { merge: true }).catch(report), [report]);

  const saveSet = useCallback((exKey, setIdx, value) => {
    const logged = [...(state.sets[exKey] ?? [])];
    logged[setIdx] = value;
    const empty = logged.every((set) => set == null);
    // A sparse array holds undefined where a set is unlogged, which Firestore
    // will not store, so the holes become nulls on the way out.
    return setDoc(
      ref('current'),
      { sets: { [exKey]: empty ? deleteField() : logged.map((set) => set ?? null) } },
      { merge: true }
    ).catch(report);
  }, [state.sets, report]);

  const clearDay = useCallback((exKeys) =>
    setDoc(
      ref('current'),
      { sets: Object.fromEntries(exKeys.map((key) => [key, deleteField()])) },
      { merge: true }
    ).catch(report), [report]);

  const finishDay = useCallback(({ day, date, exercises }) => {
    const used = new Set(state.entries.map((entry) => entry.session));
    const seeded = SEED_SESSIONS.map((session) => session.session);
    const session = Math.max(0, ...used, ...seeded) + 1;

    const batch = writeBatch(db);
    let wrote = 0;
    exercises.forEach((exercise) => {
      const logged = (state.sets[exercise.exKey] ?? []).filter((set) => set && set.reps > 0);
      if (!logged.length) return;
      const id = uid();
      batch.set(ref(ENTRY + id), {
        id,
        key: exercise.logKey,
        part: exercise.part,
        exercise: exercise.name,
        slot: exercise.slot,
        session,
        day,
        date,
        reps: logged.map((set) => set.reps),
        load: loadLabelOf(logged),
        total: logged.reduce((sum, set) => sum + set.reps, 0),
      });
      wrote += 1;
    });
    if (!wrote) return Promise.resolve();

    batch.set(
      ref('current'),
      { sets: Object.fromEntries(exercises.map((exercise) => [exercise.exKey, deleteField()])) },
      { merge: true }
    );
    return batch.commit().catch(report);
  }, [state.entries, state.sets, report]);

  const deleteSession = useCallback((session) => {
    const batch = writeBatch(db);
    state.entries.filter((entry) => entry.session === session).forEach((entry) => batch.delete(ref(ENTRY + entry.id)));
    return batch.commit().catch(report);
  }, [state.entries, report]);

  const exportState = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workout-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state]);

  /** Replaces everything, so an import is never half-merged with what is there. */
  const replaceAll = useCallback(async (incoming) => {
    const batch = writeBatch(db);
    Object.keys(docs ?? {}).filter((id) => id.startsWith(ENTRY)).forEach((id) => batch.delete(ref(id)));
    batch.set(ref('current'), {
      planId: incoming.planId ?? PLANS[0].id,
      sets: Object.fromEntries(
        Object.entries(incoming.sets ?? {}).map(([key, value]) => [key, (value ?? []).map((set) => set ?? null)])
      ),
    });
    (incoming.entries ?? []).forEach((entry) => {
      const id = entry.id || uid();
      batch.set(ref(ENTRY + id), { ...entry, id });
    });
    await batch.commit();
  }, [docs]);

  const importState = useCallback(async (file) => {
    try {
      await replaceAll(JSON.parse(await file.text()));
    } catch (err) {
      report(err);
    }
  }, [replaceAll, report]);

  return {
    state, ready, error, dismissError: () => setError(null),
    groups, sessions, nextSession, bestOf, lastOf,
    setPlan, saveSet, clearDay, finishDay, deleteSession,
    exportState, importState, replaceAll,
  };
};
