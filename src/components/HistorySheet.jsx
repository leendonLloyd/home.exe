import { useRef, useState } from 'react';
import Sheet from './Sheet';

export default function HistorySheet({ open, sessions, onClose, onDelete, onExport, onImport }) {
  const [openId, setOpenId] = useState(null);
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
        {sessions.map((session) => (
          <li key={session.id} className="session">
            <button type="button" className="session-head" onClick={() => setOpenId(openId === session.id ? null : session.id)}>
              <span>
                <strong>{session.date}</strong>
                {session.note ? <span className="muted"> · {session.note}</span> : null}
              </span>
              <span className="badge">{session.total}</span>
            </button>
            {openId === session.id ? (
              <>
                <ul className="stack-list compact">
                  {session.lines.map((line) => (
                    <li key={line.itemId}>
                      <span>
                        {line.name} · <span className="muted">{line.ownerName}</span>
                      </span>
                      <strong>{line.count}</strong>
                    </li>
                  ))}
                </ul>
                <button type="button" className="btn danger block" onClick={() => onDelete(session.id)}>
                  Delete bulk
                </button>
              </>
            ) : null}
          </li>
        ))}
        {sessions.length === 0 ? <li className="muted">No saved bulks yet</li> : null}
      </ul>
    </Sheet>
  );
}
