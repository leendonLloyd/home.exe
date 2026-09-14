import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import RirGauge from '../components/RirGauge';
import SetSheet from '../components/SetSheet';
import { PLANS, loadLabel, planById } from '../lib/workoutPlans';
import { useWorkoutStore } from '../lib/workoutStore';

const today = () => new Date().toISOString().slice(0, 10);

export default function Workout() {
  const store = useWorkoutStore();
  const plan = planById(store.state.planId);

  const [dayIdx, setDayIdx] = useState(0);
  const [target, setTarget] = useState(null);

  const day = plan.days[Math.min(dayIdx, plan.days.length - 1)];
  const exKeyOf = (index) => `${plan.id}|${day.key}|${index}`;
  const setsOf = (index) => store.state.sets[exKeyOf(index)] ?? [];

  const rows = useMemo(
    () =>
      day.ex.map((exercise, index) => {
        const logged = (store.state.sets[`${plan.id}|${day.key}|${index}`] ?? []).filter((set) => set && set.reps > 0);
        return {
          exercise,
          index,
          exKey: `${plan.id}|${day.key}|${index}`,
          total: logged.reduce((sum, set) => sum + set.reps, 0),
          done: logged.length,
          last: store.lastOf(exercise.log),
          best: store.bestOf(exercise.log),
        };
      }),
    [plan, day, store.state.sets, store.lastOf, store.bestOf]
  );

  const totals = rows.reduce(
    (acc, row) => ({
      reps: acc.reps + row.total,
      done: acc.done + row.done,
      sets: acc.sets + row.exercise.sets,
      lifts: acc.lifts + (row.total > 0 ? 1 : 0),
    }),
    { reps: 0, done: 0, sets: 0, lifts: 0 }
  );

  const switchPlan = (planId) => {
    store.setPlan(planId);
    setDayIdx(0);
  };

  const finish = () => {
    store.finishDay({
      day: day.tab,
      date: today(),
      exercises: rows.map((row) => ({
        exKey: row.exKey,
        logKey: row.exercise.log,
        name: row.exercise.n,
        slot: `${day.tab} · ${row.exercise.sets} × ${row.exercise.reps}`,
        part: store.groups.find((group) => group.key === row.exercise.log)?.part ?? 'Other',
      })),
    });
  };

  return (
    <div className="screen">
      <header className="app-bar">
        <Link to="/" className="icon-btn" aria-label="Back to hub">
          ←
        </Link>
        <div>
          <h1>Workout</h1>
          <p className="muted">{plan.name}</p>
        </div>
        <Link to="/workout/notes" className="btn small">
          Notes
        </Link>
        <Link to="/workout/log" className="btn small">
          Log
        </Link>
      </header>

      <div className="sub-bar">
        <div className="seg" role="group" aria-label="Choose a plan">
          {PLANS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={entry.id === plan.id}
              onClick={() => switchPlan(entry.id)}
            >
              {entry.tab}
            </button>
          ))}
        </div>

        <div className="daybar" role="tablist" aria-label="Training days">
          {plan.days.map((entry, index) => (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={index === dayIdx}
              className={index === dayIdx ? 'day-chip on' : 'day-chip'}
              onClick={() => setDayIdx(index)}
            >
              {entry.tab}
            </button>
          ))}
        </div>
      </div>

      <main className="scroll">
        <p className="muted small">{plan.schedule}</p>

        <div className="kpi-total">
          <div>
            <span className="kpi-total-value">{totals.reps}</span>
            <span className="kpi-total-label">reps logged · {day.title}</span>
          </div>
          <div className="kpi-total-meta">
            <span>
              {totals.done} / {totals.sets} sets
            </span>
            <span>{day.note}</span>
          </div>
        </div>

        {rows.map((row) => {
          const { exercise, index } = row;
          const logged = setsOf(index);
          return (
            <article className="ex" key={row.exKey}>
              <div className="ex-top">
                <span className="ex-idx">{String(index + 1).padStart(2, '0')}</span>
                <div className="ex-text">
                  <span className="ex-name">{exercise.n}</span>
                  {exercise.sub ? <p className="muted small">{exercise.sub}</p> : null}
                </div>
                <span className={exercise.load ? 'pill' : 'pill bw'}>{loadLabel(exercise.load)}</span>
              </div>

              <div className="ex-meta">
                <span>
                  {exercise.sets} × {exercise.reps}
                </span>
                <span>rest {exercise.rest}</span>
                <RirGauge rir={exercise.rir} />
              </div>

              <div className="pips">
                {Array.from({ length: exercise.sets }, (unused, setIdx) => {
                  const value = logged[setIdx];
                  const off = value && value.weight != null && exercise.load && value.weight !== exercise.load.kg;
                  return (
                    <button
                      key={setIdx}
                      type="button"
                      className={['pip', value ? 'done' : '', off ? 'alt' : ''].filter(Boolean).join(' ')}
                      title={value ? `${value.reps} reps${value.weight != null ? ` @ ${value.weight} kg` : ''}` : ''}
                      aria-label={`Log set ${setIdx + 1} of ${exercise.sets}, ${exercise.n}`}
                      onClick={() =>
                        setTarget({
                          exKey: row.exKey,
                          setIdx,
                          setNo: setIdx + 1,
                          sets: exercise.sets,
                          name: exercise.n,
                          reps: exercise.reps,
                          load: exercise.load,
                          current: value ?? null,
                        })
                      }
                    >
                      {value ? value.reps : ''}
                    </button>
                  );
                })}
              </div>

              {row.total || row.last ? (
                <p className="tally">
                  {row.total ? (
                    <span>
                      Σ <strong>{row.total}</strong> today
                    </span>
                  ) : null}
                  {row.last ? (
                    <span className={row.total && row.total > row.last.total ? 'up' : row.total && row.total < row.last.total ? 'dn' : ''}>
                      last {row.last.total}
                      {row.last.load ? ` @ ${row.last.load}` : ''} · s{row.last.session}
                    </span>
                  ) : null}
                  {row.best && row.best !== row.last ? <span className="muted small">best {row.best.total}</span> : null}
                </p>
              ) : (
                <p className="tally muted small">No history for this lift yet.</p>
              )}
            </article>
          );
        })}
      </main>

      <nav className="tab-bar">
        <button type="button" className="btn" disabled={totals.done === 0} onClick={() => store.clearDay(rows.map((row) => row.exKey))}>
          Clear day
        </button>
        <button type="button" className="btn primary" disabled={totals.done === 0} onClick={finish}>
          Finish · save session {store.nextSession}
        </button>
      </nav>

      <SetSheet
        open={Boolean(target)}
        target={target}
        onClose={() => setTarget(null)}
        onSave={(value) => {
          store.saveSet(target.exKey, target.setIdx, value);
          setTarget(null);
        }}
        onClear={() => {
          store.saveSet(target.exKey, target.setIdx, null);
          setTarget(null);
        }}
      />
    </div>
  );
}
