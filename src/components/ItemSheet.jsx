import { useEffect, useState } from 'react';
import Icon, { ICON_KEYS } from './Icon';
import Sheet from './Sheet';
import { COLOR_TYPES, PRESET_TYPES } from '../lib/defaults';

const DEFAULT_COLOR_TYPES = ['whites', 'darks'];

const emptyDraft = (owners) => ({
  name: '',
  icon: 'tshirt',
  ownerId: owners[0]?.id ?? '',
  colorTypes: DEFAULT_COLOR_TYPES,
});

export default function ItemSheet({ open, owners, item, onClose, onSave }) {
  const [draft, setDraft] = useState(() => emptyDraft(owners));

  useEffect(() => {
    if (!open) return;
    setDraft(item ? { ...item, colorTypes: [item.colorType] } : emptyDraft(owners));
  }, [open, item, owners]);

  const patch = (partial) => setDraft((prev) => ({ ...prev, ...partial }));

  const toggleColor = (colorId) =>
    setDraft((prev) => {
      const selected = prev.colorTypes.includes(colorId)
        ? prev.colorTypes.filter((id) => id !== colorId)
        : [...prev.colorTypes, colorId];
      return { ...prev, colorTypes: selected };
    });

  const canSubmit = Boolean(draft.name.trim()) && Boolean(draft.ownerId) && draft.colorTypes.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSave({ ...draft, name: draft.name.trim() });
    onClose();
  };

  return (
    <Sheet
      open={open}
      title={item ? 'Edit item' : 'Add clothing type'}
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" onClick={submit} disabled={!canSubmit}>
          {item ? 'Save changes' : `Add item${draft.colorTypes.length > 1 ? ` ×${draft.colorTypes.length}` : ''}`}
        </button>
      }
    >
      <label className="field-label">Presets</label>
      <div className="chip-wrap">
        {PRESET_TYPES.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className={draft.name === preset.name ? 'chip active' : 'chip'}
            onClick={() => patch({ name: preset.name, icon: preset.icon })}
          >
            <Icon name={preset.icon} size={16} />
            {preset.name}
          </button>
        ))}
      </div>

      <label className="field-label" htmlFor="item-name">
        Name
      </label>
      <input
        id="item-name"
        value={draft.name}
        onChange={(event) => patch({ name: event.target.value })}
        placeholder="e.g. Duvet Cover"
        maxLength={28}
      />

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

      <label className="field-label">Owner</label>
      <div className="chip-wrap">
        {owners.map((owner) => (
          <button
            key={owner.id}
            type="button"
            className={draft.ownerId === owner.id ? 'chip active' : 'chip'}
            style={{ '--pill': owner.color }}
            onClick={() => patch({ ownerId: owner.id })}
          >
            {owner.name}
          </button>
        ))}
        {owners.length === 0 ? <span className="muted">Add an owner first</span> : null}
      </div>

      <label className="field-label">Color groups</label>
      <div className="chip-wrap">
        {COLOR_TYPES.map((color) => (
          <button
            key={color.id}
            type="button"
            aria-pressed={draft.colorTypes.includes(color.id)}
            className={draft.colorTypes.includes(color.id) ? 'chip active' : 'chip'}
            style={{ '--pill': color.tint }}
            onClick={() => toggleColor(color.id)}
          >
            {color.label}
          </button>
        ))}
      </div>
      <p className="muted small">One entry is created per selected color group.</p>
    </Sheet>
  );
}
