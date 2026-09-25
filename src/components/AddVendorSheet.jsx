import { useEffect, useState } from 'react';
import Sheet from './Sheet';

// Down payment and the first instalment cover most new entries; the rest are
// there when a schedule is already agreed, and stay out of the way otherwise.
const ALWAYS_SHOWN = 2;

const empty = () => ({ vendor: '', total: '', stages: {}, due: '', notes: '', pax: '' });

export default function AddVendorSheet({ open, stageLabels, hasDueDates, busy, onClose, onSave }) {
  const [draft, setDraft] = useState(empty);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(empty());
    setShowMore(false);
  }, [open]);

  const patch = (partial) => setDraft((prev) => ({ ...prev, ...partial }));
  const setStage = (label, value) =>
    setDraft((prev) => ({ ...prev, stages: { ...prev.stages, [label]: value } }));

  const canSubmit = Boolean(draft.vendor.trim());
  const extras = stageLabels.slice(ALWAYS_SHOWN);
  const filledExtras = extras.filter((label) => draft.stages[label]).length;

  const submit = () => {
    if (!canSubmit) return;
    // Blank instalments are left out entirely so the sheet keeps empty cells
    // rather than zeros, which would read as "paid nothing" instead of "not yet".
    const stages = {};
    stageLabels.forEach((label) => {
      const value = draft.stages[label];
      if (value !== undefined && String(value).trim() !== '') stages[label] = Number(value);
    });
    onSave({
      vendor: draft.vendor.trim(),
      total: draft.total === '' ? null : Number(draft.total),
      stages,
      due: draft.due,
      notes: draft.notes.trim(),
      pax: draft.pax.trim(),
    });
    onClose();
  };

  const field = (label) => (
    <div key={label}>
      <label className="field-label" htmlFor={`stage-${label}`}>
        {label} <span className="muted">· optional</span>
      </label>
      <input
        id={`stage-${label}`}
        type="number"
        inputMode="decimal"
        step="0.01"
        value={draft.stages[label] ?? ''}
        onChange={(event) => setStage(label, event.target.value)}
        placeholder="—"
      />
    </div>
  );

  return (
    <Sheet
      open={open}
      title="Add vendor"
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" disabled={!canSubmit || busy} onClick={submit}>
          {busy ? 'Adding…' : 'Add to sheet'}
        </button>
      }
    >
      <label className="field-label" htmlFor="v-name">
        Vendor
      </label>
      <input
        id="v-name"
        value={draft.vendor}
        onChange={(event) => patch({ vendor: event.target.value })}
        placeholder="e.g. Photobooth Co"
      />

      <label className="field-label" htmlFor="v-total">
        Total package <span className="muted">· optional</span>
      </label>
      <input
        id="v-total"
        type="number"
        inputMode="decimal"
        step="0.01"
        value={draft.total}
        onChange={(event) => patch({ total: event.target.value })}
        placeholder="—"
      />

      {stageLabels.slice(0, ALWAYS_SHOWN).map(field)}

      {extras.length > 0 ? (
        showMore ? (
          extras.map(field)
        ) : (
          <button type="button" className="btn block" onClick={() => setShowMore(true)}>
            + {extras.length} more instalment{extras.length === 1 ? '' : 's'}
            {filledExtras > 0 ? ` (${filledExtras} set)` : ''}
          </button>
        )
      ) : null}

      {hasDueDates ? (
        <>
          <label className="field-label" htmlFor="v-due">
            Due date <span className="muted">· optional</span>
          </label>
          <input id="v-due" type="date" value={draft.due} onChange={(event) => patch({ due: event.target.value })} />
        </>
      ) : null}

      <label className="field-label" htmlFor="v-notes">
        Notes <span className="muted">· optional</span>
      </label>
      <input id="v-notes" value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} placeholder="—" />

      <label className="field-label" htmlFor="v-pax">
        # of pax <span className="muted">· optional</span>
      </label>
      <input id="v-pax" value={draft.pax} onChange={(event) => patch({ pax: event.target.value })} placeholder="—" />

      <p className="muted small">
        Added just above the last vendor so the sheet&apos;s <strong>TOTAL AMOUNT</strong> formula takes it in, and the
        balance column is inherited from the row below — the sheet works the balance out itself.
      </p>
    </Sheet>
  );
}
