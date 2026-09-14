import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Sheet from '../components/Sheet';
import { PARTS, STANDING } from '../lib/workoutHistory';
import { useWorkoutStore } from '../lib/workoutStore';

export default function WorkoutLog() {
  const store = useWorkoutStore();
  const [sheet, setSheet] = useState(null);
  const [collapsed, setCollapsed] = useState(() =>
    Object.fromEntries(PARTS.map((part) => [part, !store.groups.some((group) => group.part === part && group.entries.length)]))
  );
  const fileRef = useRef(null);

  const toggle = (part) => setCollapsed((prev) => ({ ...prev, [part]: !prev[part] }));

  const sections = useMemo(
    () =>
      PARTS.map((part) => ({ part, groups: store.groups.filter((group) => group.part === part) })).filter(
        (section) => section.groups.length > 0
      ),
    [store.groups]
  );

  const logged = store.sessions.length;

  return (
    <div className="screen">
      <header className="app-bar">
        <Link to="/workout" className="icon-btn" aria-label="Back to tracker">
          ←
        </Link>
        <div>
          <h1>Training log</h1>
          <p className="muted">
            {logged} sessions · totals are reps summed across sets
          </p>
        </div>
        <button type="button" className="btn small" onClick={() => setSheet('sessions')}>
          Sessions
        </button>
      </header>

      <main className="scroll">
        <div className="flag warn">
          <strong>Lower day: zero sessions.</strong> Never once performed in the block. Squats, RDLs, split squats, hip
          thrusts, calves, carries and lying leg raises have had no exposure.
        </div>

        {sections.map((section) => (
          <section className="group" key={section.part} style={{ '--tint': 'var(--accent)' }}>
            <button type="button" className="group-head" aria-expanded={!collapsed[section.part]} onClick={() => toggle(section.part)}>
              <span className="dot" />
              <h2>{section.part}</h2>
              <span className="badge">{section.groups.reduce((sum, group) => sum + group.entries.length, 0)}</span>
              <span className={collapsed[section.part] ? 'caret' : 'caret open'} aria-hidden="true">
                ⌄
              </span>
            </button>

            {collapsed[section.part]
              ? null
              : section.groups.map((group) => {
                  const best = group.entries.reduce((max, entry) => Math.max(max, entry.total), 0);
                  return (
                    <div className="lift" key={group.key}>
                      <div className="lift-head">
                        <strong>{group.exercise}</strong>
                        <span className="muted small">{group.slot}</span>
                      </div>

                      {group.entries.length === 0 ? (
                        <p className="muted small">No sessions logged.</p>
                      ) : (
                        <table className="log">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Day</th>
                              <th>Reps</th>
                              <th>Load</th>
                              <th>Σ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.entries.map((entry) => (
                              <tr key={`${group.key}-${entry.session}`} className={entry.total === best && best > 0 ? 'best' : undefined}>
                                <td>{entry.session}</td>
                                <td>{entry.day}</td>
                                <td>{entry.reps.length ? entry.reps.join(' · ') : <span className="muted">{entry.note}</span>}</td>
                                <td className="kg">{entry.load ?? '—'}</td>
                                <td className="sum">{entry.total || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {group.entries.some((entry) => entry.reps.length && entry.note) ? (
                        <p className="muted small">
                          {group.entries
                            .filter((entry) => entry.reps.length && entry.note)
                            .map((entry) => `s${entry.session}: ${entry.note}`)
                            .join(' · ')}
                        </p>
                      ) : null}
                      {group.note ? <p className="muted small">{group.note}</p> : null}
                      {group.flag ? <div className="flag warn small">{group.flag}</div> : null}
                    </div>
                  );
                })}
          </section>
        ))}

        <section className="group" style={{ '--tint': 'var(--accent)' }}>
          <div className="group-head static">
            <span className="dot" />
            <h2>Where it stands</h2>
          </div>
          <ul className="stack-list">
            {STANDING.map((item) => (
              <li key={item.label} className="standing">
                <strong className={item.warn ? 'dn' : undefined}>{item.label}</strong>
                <span className="muted small">{item.body}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <nav className="tab-bar">
        <button type="button" className="btn" onClick={store.exportState}>
          Export JSON
        </button>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) store.importState(file);
            event.target.value = '';
          }}
        />
      </nav>

      <Sheet open={sheet === 'sessions'} title="Sessions completed" onClose={() => setSheet(null)}>
        <ul className="stack-list">
          {store.sessions.map((session) => (
            <li key={session.session}>
              <span className="summary-label">
                <strong>{session.session}</strong> · {session.day}
              </span>
              <span className="muted small">{session.note || '—'}</span>
              {session.logged ? (
                <button type="button" className="micro-btn danger" aria-label={`Delete session ${session.session}`} onClick={() => store.deleteSession(session.session)}>
                  ✕
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
}
