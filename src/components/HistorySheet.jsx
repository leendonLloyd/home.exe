import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { checkProgress } from '../lib/laundryCheck';
import Sheet from './Sheet';

// Selecting a bulk opens its check-in page, which lists the same breakdown the
// row used to expand into — plus the counting-back-in flow.
function statusOf(session) {
  const progress = checkProgress(session);
  if (progress.closed && progress.complete) return { label: 'All back', color: 'var(--good)' };
  if (progress.closed) return { label: `${progress.missing} short`, color: 'var(--danger)' };
  if (progress.started) return { label: `${progress.back}/${progress.sent} back`, color: 'var(--warm)' };
  return null;
}

export default function HistorySheet({ open, sessions, onClose, onDelete, onExport, onImport }) {
  const fileRef = useRef(null);

  return (
    <Sheet
      open={open}
      title="History"
      onClose={onClose}
      footer={
        <div className="row-form">
          <button type="button" className="btn block" onClick={onExport}>
            Export JSON
          </button>
          <button type="button" className="btn block" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.target.value = '';
            }}
          />
        </div>
      }
    >
      <ul className="stack-list">
        {sessions.map((session) => {
          const status = statusOf(session);
          return (
            <li key={session.id}>
              <Link to={`/laundry/check/${session.id}`} className="session-link">
                <span className="summary-label">
                  <strong>{session.date}</strong>
                  {session.note ? <span className="muted"> · {session.note}</span> : null}
                </span>
                {status ? (
                  <span className="pill" style={{ '--pill': status.color }}>
                    {status.label}
                  </span>
                ) : null}
                <span className="badge">{session.total}</span>
              </Link>
              <button
                type="button"
                className="micro-btn danger"
                onClick={() => onDelete(session.id)}
                aria-label={`Delete bulk from ${session.date}`}
              >
                🗑
              </button>
            </li>
          );
        })}
        {sessions.length === 0 ? <li className="muted">No saved bulks yet</li> : null}
      </ul>
    </Sheet>
  );
}
