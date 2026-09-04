import { useState } from 'react';
import Sheet from './Sheet';

export default function OwnerSheet({ open, owners, onClose, onAdd, onDelete }) {
  const [name, setName] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    onAdd(name);
    setName('');
  };

  return (
    <Sheet open={open} title="Owners" onClose={onClose}>
      <form className="row-form" onSubmit={submit}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Owner name" maxLength={24} />
        <button type="submit" className="btn primary">
          Add
        </button>
      </form>

      <ul className="stack-list">
        {owners.map((owner) => (
          <li key={owner.id}>
            <span className="pill" style={{ '--pill': owner.color }}>
              {owner.name}
            </span>
            <button type="button" className="micro-btn danger" onClick={() => onDelete(owner.id)} aria-label={`Delete ${owner.name}`}>
              🗑
            </button>
          </li>
        ))}
        {owners.length === 0 ? <li className="muted">No owners yet</li> : null}
      </ul>
    </Sheet>
  );
}
