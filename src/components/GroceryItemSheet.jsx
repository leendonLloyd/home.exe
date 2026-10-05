import { useEffect, useState } from 'react';
import { AISLES, GROCERY_PRESETS } from '../lib/groceryDefaults';
import Icon, { ICON_KEYS } from './Icon';
import Sheet from './Sheet';

const empty = () => ({ name: '', icon: 'cart', aisle: 'pantry' });

export default function GroceryItemSheet({ open, item, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setDraft(item ? { ...item } : empty());
  }, [open, item]);

  const patch = (partial) => setDraft((prev) => ({ ...prev, ...partial }));
  const canSubmit = Boolean(draft.name.trim());

  return (
    <Sheet
      open={open}
      title={item ? 'Edit item' : 'Add item'}
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn primary block"
          disabled={!canSubmit}
          onClick={() => {
            onSave({ ...draft, name: draft.name.trim() });
            onClose();
          }}
        >
          {item ? 'Save changes' : 'Add to the list'}
        </button>
      }
    >
      {!item ? (
        <>
          <label className="field-label">Common items</label>
          <div className="chip-wrap">
            {GROCERY_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className={draft.name === preset.name ? 'chip active' : 'chip'}
                onClick={() => patch(preset)}
              >
                <Icon name={preset.icon} size={16} />
                {preset.name}
              </button>
            ))}
          </div>
        </>
      ) : null}

      <label className="field-label" htmlFor="g-name">
        Name
      </label>
      <input
        id="g-name"
        value={draft.name}
        onChange={(event) => patch({ name: event.target.value })}
        placeholder="e.g. Peanut butter"
        maxLength={32}
      />

      <label className="field-label">Aisle</label>
      <div className="chip-wrap">
        {AISLES.map((aisle) => (
          <button
            key={aisle.id}
            type="button"
            className={draft.aisle === aisle.id ? 'chip active' : 'chip'}
            style={{ '--pill': aisle.tint }}
            onClick={() => patch({ aisle: aisle.id })}
          >
            {aisle.label}
          </button>
        ))}
      </div>

      <label className="field-label">Icon</label>
      <div className="icon-grid">
        {ICON_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={draft.icon === key ? 'icon-pick active' : 'icon-pick'}
            onClick={() => patch({ icon: key })}
            aria-label={key}
          >
            <Icon name={key} size={20} />
          </button>
        ))}
      </div>

      {item ? (
        <div className="danger-zone">
          <button
            type="button"
            className="btn danger block"
            onClick={() => {
              onDelete(item.id);
              onClose();
            }}
          >
            Remove from the list
          </button>
        </div>
      ) : null}
    </Sheet>
  );
}
