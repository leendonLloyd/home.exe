import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BASE_GROUPS, PARTS, SEED_SESSIONS } from './workoutHistory';
import { PLANS } from './workoutPlans';

const STORAGE_KEY = 'home.exe:workout:v1';

const DEFAULT_STATE = { planId: PLANS[0].id, sets: {}, entries: [] };

const uid = () => `ent-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const readState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      planId: parsed.planId ?? DEFAULT_STATE.planId,
      sets: parsed.sets ?? {},
      entries: parsed.entries ?? [],
    };
  } catch {
    return DEFAULT_STATE;
  }
};

// One weight across the sets reads as "8"; a mixed set reads as "8 / 7 / 7".
const loadLabelOf = (logged) => {
  const weights = logged.filter((set) => set && set.reps > 0).map((set) => set.weight);
  if (!weights.length || weights.every((value) => value == null)) return null;
  const shown = weights.map((value) => (value == null ? 'bw' : String(value)));
  return shown.every((value) => value === shown[0]) ? shown[0] : shown.join(' / ');
};

export const useWorkoutStore = () => {
  const [state, setState] = useState(readState);
  const hydrated = useRef(false);

  // Skip the first write so a failed read can never overwrite stored data.
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Seeded groups stay authoritative in code; logged sessions layer on top of them.
  const groups = useMemo(() => {
    const byKey = new Map(BASE_GROUPS.map((group) => [group.key, { ...group, entries: [...group.entries] }]));
    state.entries.forEach((entry) => {
      const group = byKey.get(entry.key);
      if (group) group.entries.push(entry);
      else byKey.set(entry.key, { key: entry.key, part: entry.part ?? 'Other', exercise: entry.exercise, slot: entry.slot, entries: [entry] });
    });
    const all = [...byKey.values()].map((group) => ({
      ...group,
      entries: [...group.entries].sort((a, b) => a.session - b.session),
    }));
    const order = (part) => (PARTS.includes(part) ? PARTS.indexOf(part) : PARTS.length);
    return all.sort((a, b) => order(a.part) - order(b.part));
  }, [state.entries]);

  const sessions = useMemo(() => {
    const byNumber = new Map(SEED_SESSIONS.map((session) => [session.session, session]));
    state.entries.forEach((entry) => {
      if (!byNumber.has(entry.session)) byNumber.set(entry.session, { session: entry.session, day: entry.day, note: entry.date ?? '', logged: true });
    });
    return [...byNumber.values()].sort((a, b) => b.session - a.session);
  }, [state.entries]);

  const nextSession = useMemo(
    () => groups.reduce((max, group) => group.entries.reduce((inner, entry) => Math.max(inner, entry.session), max), 0) + 1,
    [groups]
  );

  const bestOf = useCallback(
    (key) => groups.find((group) => group.key === key)?.entries.reduce((best, entry) => (entry.total > (best?.total ?? -1) ? entry : best), null) ?? null,
    [groups]
  );

  const lastOf = useCallback((key) => {
    const entries = groups.find((group) => group.key === key)?.entries ?? [];
    return entries.length ? entries[entries.length - 1] : null;
  }, [groups]);

  const setPlan = useCallback((planId) => setState((prev) => ({ ...prev, planId })), []);

  const saveSet = useCallback((exKey, setIdx, value) => {
    setState((prev) => {
      const logged = [...(prev.sets[exKey] ?? [])];
      logged[setIdx] = value;
      const sets = { ...prev.sets };
      if (logged.every((set) => set == null)) delete sets[exKey];
      else sets[exKey] = logged;
      return { ...prev, sets };
    });
  }, []);

  const clearDay = useCallback((exKeys) => {
    setState((prev) => {
      const sets = { ...prev.sets };
      exKeys.forEach((key) => delete sets[key]);
      return { ...prev, sets };
    });
  }, []);

  const finishDay = useCallback(({ day, date, exercises }) => {
    setState((prev) => {
      const used = new Set(prev.entries.map((entry) => entry.session));
      const seeded = SEED_SESSIONS.map((session) => session.session);
      const session = Math.max(0, ...used, ...seeded) + 1;

      const entries = exercises
        .map((exercise) => {
          const logged = (prev.sets[exercise.exKey] ?? []).filter((set) => set && set.reps > 0);
          if (!logged.length) return null;
          return {
            id: uid(),
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
          };
        })
        .filter(Boolean);

      if (!entries.length) return prev;

      const sets = { ...prev.sets };
      exercises.forEach((exercise) => delete sets[exercise.exKey]);
      return { ...prev, sets, entries: [...prev.entries, ...entries] };
    });
  }, []);

  const deleteSession = useCallback((session) => {
    setState((prev) => ({ ...prev, entries: prev.entries.filter((entry) => entry.session !== session) }));
  }, []);

  const exportState = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workout-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importState = useCallback(async (file) => {
    const parsed = JSON.parse(await file.text());
    setState({
      planId: parsed.planId ?? DEFAULT_STATE.planId,
      sets: parsed.sets ?? {},
      entries: parsed.entries ?? [],
    });
  }, []);

  return { state, groups, sessions, nextSession, bestOf, lastOf, setPlan, saveSet, clearDay, finishDay, deleteSession, exportState, importState };
};

export { loadLabelOf };
