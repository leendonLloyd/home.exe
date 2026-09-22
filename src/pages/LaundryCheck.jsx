import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CheckCard from '../components/CheckCard';
import Sheet from '../components/Sheet';
import { COLOR_TYPES } from '../lib/defaults';
import { checkProgress, remainingOf, shortLines } from '../lib/laundryCheck';
import { useLaundryStore } from '../lib/store';

export default function LaundryCheck() {
  const { sessionId } = useParams();
  const store = useLaundryStore();
  const { owners, sessions } = store.state;

  const [groupBy, setGroupBy] = useState('color');
  const [collapsed, setCollapsed] = useState({});
  const [confirming, setConfirming] = useState(false);

  const session = sessions.find((entry) => entry.id === sessionId);

  const toggleSection = (sectionId) => setCollapsed((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));

  const colorById = useMemo(() => Object.fromEntries(COLOR_TYPES.map((color) => [color.id, color])), []);
  const ownerByName = useMemo(() => Object.fromEntries(owners.map((owner) => [owner.name, owner])), [owners]);

  const sections = useMemo(() => {
    if (!session) return [];
    if (groupBy === 'owner') {
      const names = [...new Set(session.lines.map((line) => line.ownerName))];
      return names
        .map((name) => ({
          id: name,
          label: name,
          tint: ownerByName[name]?.color ?? '#6c7789',
          entries: session.lines.filter((line) => line.ownerName === name),
        }))
        .filter((section) => section.entries.length > 0);
    }
    return COLOR_TYPES.map((color) => ({
      ...color,
      entries: session.lines.filter((line) => line.colorType === color.id),
    })).filter((section) => section.entries.length > 0);
  }, [session, groupBy, ownerByName]);

  if (!session) {
    return (
      <div className="screen">
        <header className="app-bar">
          <Link to="/laundry" className="icon-btn" aria-label="Back to counter">
            ←
          </Link>
          <div>
            <h1>Check in</h1>
          </div>
        </header>
        <main className="scroll">
          <p className="empty">That bulk is no longer saved.</p>
        </main>
      </div>
    );
  }

  const progress = checkProgress(session);
  const missingLines = shortLines(session);

  // In colour view the pill names the owner, and vice versa — whichever the
  // sections aren't already grouped by is the useful one to show.
  const pillFor = (line) =>
    groupBy === 'owner'
      ? { label: colorById[line.colorType]?.label ?? 'Other', color: colorById[line.colorType]?.tint ?? '#6c7789' }
      : { label: line.ownerName, color: ownerByName[line.ownerName]?.color ?? '#6c7789' };

  return (
    <div className="screen">
      <header className="app-bar">
        <Link to="/laundry" className="icon-btn" aria-label="Back to counter">
          ←
        </Link>
        <div>
          <h1>Check in</h1>
          <p className="muted">
            {session.date}
            {session.note ? ` · ${session.note}` : ''}
          </p>
        </div>
        <button type="button" className="btn small" onClick={() => store.resetReturns(session.id)} disabled={!progress.started}>
          Reset
        </button>
      </header>

      <main className="scroll">
        {progress.closed ? (
          <div className={progress.complete ? 'flag' : 'flag warn'}>
            {progress.complete ? (
              <strong>All {progress.sent} pieces accounted for.</strong>
            ) : (
              <>
                <strong>Closed {progress.missing} short.</strong>
                <ul className="stack-list compact">
                  {missingLines.map((line) => (
                    <li key={line.itemId}>
                      <span>
                        {line.name} · <span className="muted">{line.ownerName}</span>
                      </span>
                      <strong className="dn">{remainingOf(session, line)}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : null}

        <div className="kpi-total">
          <div>
            <span className="kpi-total-value">{progress.missing}</span>
            <span className="kpi-total-label">still to find</span>
          </div>
          <div className="kpi-total-meta">
            <span>
              {progress.back} of {progress.sent} back
            </span>
            <span>{progress.complete ? 'all accounted for' : `${progress.missing} outstanding`}</span>
          </div>
        </div>

        <div className="segmented" role="tablist" aria-label="Group by">
          <button
            type="button"
            role="tab"
            aria-selected={groupBy === 'color'}
            className={groupBy === 'color' ? 'seg active' : 'seg'}
            onClick={() => setGroupBy('color')}
          >
            By color
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={groupBy === 'owner'}
            className={groupBy === 'owner' ? 'seg active' : 'seg'}
            onClick={() => setGroupBy('owner')}
          >
            By owner
          </button>
        </div>

        {sections.map((section) => {
          const outstanding = section.entries.reduce((sum, line) => sum + remainingOf(session, line), 0);
          return (
            <section className="group" key={section.id} style={{ '--tint': section.tint }}>
              <button
                type="button"
                className="group-head"
                aria-expanded={!collapsed[section.id]}
                onClick={() => toggleSection(section.id)}
              >
                <span className="dot" />
                <h2>{section.label}</h2>
                <span className="badge">{outstanding}</span>
                <span className={collapsed[section.id] ? 'caret' : 'caret open'} aria-hidden="true">
                  ⌄
                </span>
              </button>
              {collapsed[section.id] ? null : (
                <div className="grid">
                  {section.entries.map((line) => (
                    <CheckCard
                      key={line.itemId}
                      line={line}
                      pill={pillFor(line)}
                      remaining={remainingOf(session, line)}
                      locked={progress.closed}
                      onBump={(delta) => store.bumpReturn(session.id, line.itemId, delta)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>

      <nav className="tab-bar">
        {progress.closed ? (
          <button type="button" className="btn" onClick={() => store.reopenCheck(session.id)}>
            Reopen check
          </button>
        ) : (
          <button
            type="button"
            className="btn primary"
            onClick={() => (progress.complete ? store.closeCheck(session.id) : setConfirming(true))}
          >
            {progress.complete ? 'All accounted for' : `Finish · ${progress.missing} missing`}
          </button>
        )}
      </nav>

      <Sheet open={confirming} title="Some pieces are missing" onClose={() => setConfirming(false)}>
        <p className="muted small">
          {progress.missing} of {progress.sent} pieces haven&apos;t been counted back in.
        </p>
        <ul className="stack-list compact">
          {missingLines.map((line) => (
            <li key={line.itemId}>
              <span>
                {line.name} · <span className="muted">{line.ownerName}</span>
              </span>
              <strong className="dn">{remainingOf(session, line)}</strong>
            </li>
          ))}
        </ul>
        <button type="button" className="btn primary block" onClick={() => setConfirming(false)}>
          Keep checking
        </button>
        <button
          type="button"
          className="btn danger block"
          onClick={() => {
            store.closeCheck(session.id);
            setConfirming(false);
          }}
        >
          Close {progress.missing} short
        </button>
      </Sheet>
    </div>
  );
}
