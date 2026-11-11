import { useEffect, useState } from 'react';
import { sortByName } from '../lib/laundryView';
import Sheet from './Sheet';

function CountRow({ label, owner, count, onBump }) {
  return (
    <li className={count > 0 ? undefined : 'dim'}>
      <span className="summary-label">
        {label} · <span className="muted">{owner}</span>
      </span>
      <span className="stepper">
        <button type="button" onClick={() => onBump(-1)} disabled={count === 0} aria-label={`Decrease ${label}`}>
          −
        </button>
        <span className="stepper-value">{count}</span>
        <button type="button" onClick={() => onBump(1)} aria-label={`Increase ${label}`}>
          +
        </button>
      </span>
    </li>
  );
}

export default function EditBulkSheet({ open, session, items, owners, onClose, onSave }) {
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [counts, setCounts] = useState({});
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!open || !session) return;
    setDate(session.date);
    setNote(session.note ?? '');
    setCounts(Object.fromEntries((session.lines ?? []).map((line) => [line.itemId, line.count])));
    setAdding(false);
  }, [open, session]);

  if (!session) return null;

  const bump = (itemId, delta) =>
    setCounts((prev) => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] ?? 0) + delta) }));

  const ownerOf = (itemId) =>
    owners.find((owner) => owner.id === items.find((item) => item.id === itemId)?.ownerId)?.name;

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const saved = new Set((session.lines ?? []).map((line) => line.itemId));
  const rest = sortByName(items.filter((item) => !saved.has(item.id)));

  return (
    <Sheet
      open={open}
      title="Edit bulk"
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn primary block"
          disabled={total === 0}
          onClick={() => {
            onSave(session.id, { date, note, counts });
            onClose();
          }}
        >
          {total === 0 ? 'Nothing left to save' : `Save ${total} pieces`}
        </button>
      }
    >
      <label className="field-label" htmlFor="edit-date">
        Date
      </label>
      <input id="edit-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />

      <label className="field-label" htmlFor="edit-note">
        Note
      </label>
      <input id="edit-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" maxLength={60} />

      <label className="field-label">Counted</label>
      <ul className="stack-list">
        {(session.lines ?? []).map((line) => (
          <CountRow
            key={line.itemId}
            label={line.name}
            owner={ownerOf(line.itemId) ?? line.ownerName}
            count={counts[line.itemId] ?? 0}
            onBump={(delta) => bump(line.itemId, delta)}
          />
        ))}
      </ul>
      <p className="muted small">A line left at zero drops out of the bulk when you save.</p>

      {rest.length > 0 && !adding ? (
        <button type="button" className="btn block" onClick={() => setAdding(true)}>
          Add a clothing type
        </button>
      ) : null}

      {adding ? (
        <>
          <label className="field-label">Not in this bulk</label>
          <ul className="stack-list">
            {rest.map((item) => (
              <CountRow
                key={item.id}
                label={item.name}
                owner={ownerOf(item.id) ?? 'Unassigned'}
                count={counts[item.id] ?? 0}
                onBump={(delta) => bump(item.id, delta)}
              />
            ))}
          </ul>
        </>
      ) : null}
    </Sheet>
  );
}
