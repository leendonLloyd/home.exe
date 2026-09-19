import { useEffect, useState } from 'react';
import { BILL_PRESETS } from '../lib/billDefaults';
import { CADENCES, MONTH_NAMES } from '../lib/billing';
import Icon, { ICON_KEYS } from './Icon';
import Sheet from './Sheet';

const DUE_DAY_QUICK = [1, 5, 10, 15, 20, 25, 30];

const emptyDraft = () => ({
  name: '',
  icon: 'receipt',
  amount: '',
  cadence: 'monthly',
  dueDay: 5,
  anchorMonth: 0,
});

export default function BillSheet({ open, bill, onClose, onSave }) {
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => {
    if (!open) return;
    setDraft(bill ? { ...bill, amount: String(bill.amount) } : emptyDraft());
  }, [open, bill]);

  const patch = (partial) => setDraft((prev) => ({ ...prev, ...partial }));

  const amount = parseFloat(draft.amount);
  const dueDay = parseInt(draft.dueDay, 10);
  const canSubmit = Boolean(draft.name.trim()) && amount > 0 && dueDay >= 1 && dueDay <= 31;

  const submit = () => {
    if (!canSubmit) return;
    onSave({ ...draft, name: draft.name.trim(), amount, dueDay, anchorMonth: draft.cadence === 'monthly' ? 0 : draft.anchorMonth });
    onClose();
  };

  return (
    <Sheet
      open={open}
      title={bill ? 'Edit bill' : 'Add bill'}
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" onClick={submit} disabled={!canSubmit}>
          {bill ? 'Save changes' : 'Add bill'}
        </button>
      }
    >
      <label className="field-label">Presets</label>
      <div className="chip-wrap">
        {BILL_PRESETS.map((preset) => (
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

      <label className="field-label" htmlFor="bill-name">
        Name
      </label>
      <input
        id="bill-name"
        value={draft.name}
        onChange={(event) => patch({ name: event.target.value })}
        placeholder="e.g. Condo dues"
        maxLength={28}
      />

      <label className="field-label" htmlFor="bill-amount">
        Amount
      </label>
      <input
        id="bill-amount"
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={draft.amount}
        onChange={(event) => patch({ amount: event.target.value })}
        placeholder="0.00"
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

      <label className="field-label">Repeats</label>
      <div className="chip-wrap">
        {CADENCES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={draft.cadence === entry.id ? 'chip active' : 'chip'}
            onClick={() => patch({ cadence: entry.id })}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <label className="field-label" htmlFor="bill-dueday">
        Due day of month
      </label>
      <input
        id="bill-dueday"
        type="number"
        inputMode="numeric"
        min="1"
        max="31"
        value={draft.dueDay}
        onChange={(event) => patch({ dueDay: event.target.value })}
      />
      <div className="chip-wrap">
        {DUE_DAY_QUICK.map((day) => (
          <button key={day} type="button" className={dueDay === day ? 'chip active' : 'chip'} onClick={() => patch({ dueDay: day })}>
            {day}
          </button>
        ))}
      </div>

      {draft.cadence !== 'monthly' ? (
        <>
          <label className="field-label">First due month</label>
          <div className="chip-wrap">
            {MONTH_NAMES.map((label, index) => (
              <button
                key={label}
                type="button"
                className={draft.anchorMonth === index ? 'chip active' : 'chip'}
                onClick={() => patch({ anchorMonth: index })}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="muted small">
            {draft.cadence === 'quarterly' ? 'Repeats every 3 months from here.' : 'Repeats once a year on this month.'}
          </p>
        </>
      ) : null}
    </Sheet>
  );
}
