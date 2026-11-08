import Sheet from './Sheet';

/**
 * Picks any past bulk to start a new one from, newest first.
 *
 * Each row says up front how much of it still applies: a bulk referencing
 * clothing types that have since been deleted will load short, and knowing
 * that before picking beats finding out from the total afterwards.
 */
export default function TemplateSheet({ open, sessions, items, onClose, onPick }) {
  const live = new Set(items.map((item) => item.id));

  return (
    <Sheet open={open} title="Start from a previous bulk" onClose={onClose}>
      {sessions.length === 0 ? (
        <p className="muted small">No saved bulks yet. Count one and save it, then it can be reused here.</p>
      ) : (
        <>
          <p className="muted small">Loads that bulk&apos;s quantities as the starting point for a new one.</p>
          <ul className="stack-list">
            {sessions.map((session) => {
              const missing = (session.lines ?? []).filter((line) => !live.has(line.itemId)).length;
              const usable = (session.lines ?? []).length - missing;
              return (
                <li key={session.id}>
                  <button type="button" className="session-head" onClick={() => onPick(session)}>
                    <span>
                      <strong>{session.date}</strong>
                      {session.note ? <span className="muted"> · {session.note}</span> : null}
                      <span className="muted small">
                        {usable} type{usable === 1 ? '' : 's'}
                        {missing ? ` · ${missing} no longer exist${missing === 1 ? 's' : ''}` : ''}
                      </span>
                    </span>
                    <span className="badge">{session.total}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Sheet>
  );
}
