import { useEffect, useState } from 'react';
import Sheet from './Sheet';

const today = () => new Date().toISOString().slice(0, 10);

export default function SaveSheet({ open, total, lines, onClose, onSave }) {
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setDate(today());
    setNote('');
  }, [open]);

  return (
    <Sheet
      open={open}
      title="Save laundry bulk"
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn primary block"
          disabled={total === 0}
          onClick={() => {
            onSave(date, note);
            onClose();
          }}
        >
          Save {total} pieces
        </button>
      }
    >
      <label className="field-label" htmlFor="bulk-date">
        Date
      </label>
      <input id="bulk-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />

      <label className="field-label" htmlFor="bulk-note">
        Note
      </label>
      <input id="bulk-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" maxLength={60} />

      <label className="field-label">Summary</label>
      <ul className="stack-list compact">
        {lines.map((line) => (
          <li key={line.itemId}>
            <span>
              {line.name} · <span className="muted">{line.ownerName}</span>
            </span>
            <strong>{line.count}</strong>
          </li>
        ))}
        {lines.length === 0 ? <li className="muted">Nothing counted yet</li> : null}
      </ul>
    </Sheet>
  );
}
