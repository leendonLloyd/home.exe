import { useEffect, useState } from 'react';
import { money } from '../lib/money';
import { instalmentsOf, paidOf } from '../lib/paymentTotals';
import Sheet from './Sheet';

export default function PaymentSheet({ open, row, excluded, busy, hasDueDates, onClose, onToggleExcluded, onRecordPayment, onSetDueDate, onEditAmounts }) {
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState('');
  const [dueEdit, setDueEdit] = useState(null);
  const [editing, setEditing] = useState(false);
  const [amounts, setAmounts] = useState({ total: '', stages: {} });

  useEffect(() => {
    if (!open) return;
    setPaying(false);
    setAmount(row && row.balance != null ? String(row.balance) : '');
    setDueEdit(null);
    setEditing(false);
    setAmounts({
      total: row && row.total != null ? String(row.total) : '',
      stages: Object.fromEntries((row?.stages ?? []).map((stage) => [stage.label, stage.amount == null ? '' : String(stage.amount)])),
    });
  }, [open, row]);

  if (!row) return null;

  const stages = row.stages.filter((stage) => stage.amount);
  const saved = row.due || '';
  const due = dueEdit === null ? saved : dueEdit;
  const entered = parseFloat(amount);
  const full = row.balance != null && Math.abs(entered - row.balance) < 0.005;
  const remaining = row.balance == null ? null : Math.round((row.balance - (entered || 0)) * 100) / 100;
  const paid = paidOf(row);
  const instalments = instalmentsOf(row);
  // Payments recorded against a roll-up leave the component line's instalment
  // columns empty even though the sheet shows it settled.
  const unrecorded = paid != null && Math.abs(paid - instalments) > 0.005;

  return (
    <Sheet open={open} title={row.vendor} onClose={onClose}>
      {editing ? (
        <>
          <label className="field-label" htmlFor="amt-total">
            Total package
          </label>
          <input
            id="amt-total"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amounts.total}
            placeholder="—"
            onChange={(event) => setAmounts((prev) => ({ ...prev, total: event.target.value }))}
          />

          {/* There is no "paid so far" column — the sheet derives it from
              these, so these are what there is to correct. */}
          <label className="field-label">Instalments paid</label>
          {(row.stages ?? []).map((stage) => (
            <div key={stage.label} className="amt-row">
              <span className="muted small">{stage.label}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                aria-label={stage.label}
                value={amounts.stages[stage.label] ?? ''}
                placeholder="—"
                onChange={(event) =>
                  setAmounts((prev) => ({ ...prev, stages: { ...prev.stages, [stage.label]: event.target.value } }))
                }
              />
            </div>
          ))}

          <p className="muted small">
            Leaving one blank clears it, which reads as not yet paid — a 0 would read as paid nothing. The sheet works
            the balance out from these; nothing writes to FINAL PAYMENT.
          </p>

          <div className="row-form">
            <button type="button" className="btn block" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn primary block"
              disabled={busy}
              onClick={() => {
                onEditAmounts(row, { total: amounts.total, stages: amounts.stages });
                setEditing(false);
              }}
            >
              {busy ? 'Saving…' : 'Save amounts'}
            </button>
          </div>
        </>
      ) : (
        <>
          <ul className="stack-list compact">
            <li>
              <span>Package</span>
              <strong>{money(row.total)}</strong>
            </li>
            {stages.map((stage) => (
              <li key={stage.label}>
                <span className="muted">{stage.label}</span>
                <strong>{money(stage.amount)}</strong>
              </li>
            ))}
            <li>
              <span>Paid so far</span>
              <strong>{money(paid)}</strong>
            </li>
            <li>
              <span>Balance</span>
              <strong className={row.balance ? 'warm' : 'up'}>{money(row.balance)}</strong>
            </li>
          </ul>
          <button type="button" className="btn block" disabled={busy} onClick={() => setEditing(true)}>
            Edit amounts
          </button>
        </>
      )}

      {stages.length === 0 ? <p className="muted small">No instalments recorded here.</p> : null}
      {unrecorded ? (
        <p className="muted small">
          The instalments above come to {money(instalments)}, but the sheet puts the balance at {money(row.balance)} —
          the rest was recorded on a roll-up row. Paid and balance follow the sheet.
        </p>
      ) : null}
      {row.notes ? <p className="muted small">Note: {row.notes}</p> : null}
      {row.pax ? <p className="muted small">Pax: {row.pax}</p> : null}
      <p className="muted small">Row {row.row} of the sheet.</p>

      {hasDueDates ? (
        <>
          <label className="field-label" htmlFor="v-duedate">
            Due date
          </label>
          <div className="row-form">
            <input id="v-duedate" type="date" value={due} onChange={(event) => setDueEdit(event.target.value)} />
            <button
              type="button"
              className="btn"
              disabled={busy || due === saved}
              onClick={() => onSetDueDate(row, due)}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
          {due ? (
            <button type="button" className="btn ghost block" disabled={busy} onClick={() => { setDueEdit(''); onSetDueDate(row, ''); }}>
              Clear due date
            </button>
          ) : null}
        </>
      ) : (
        <p className="muted small">
          Add a <strong>DUE DATE</strong> column to the tab to set one here.
        </p>
      )}

      {row.nextStage ? (
        <div className="danger-zone">
          {paying ? (
            <>
              <div className="row-form">
                <button
                  type="button"
                  className={full ? 'btn primary block' : 'btn block'}
                  onClick={() => setAmount(String(row.balance ?? ''))}
                >
                  Paid in full
                </button>
                <button
                  type="button"
                  className={full ? 'btn block' : 'btn primary block'}
                  onClick={() => setAmount('')}
                >
                  Part payment
                </button>
              </div>

              <label className="field-label" htmlFor="pay-amount">
                Amount to record
              </label>
              <input
                id="pay-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amount}
                placeholder="0.00"
                onChange={(event) => setAmount(event.target.value)}
              />

              {/* What this leaves owing is the thing worth knowing before
                  committing it, and it is the sheet's own arithmetic. */}
              {entered > 0 ? (
                <p className={remaining > 0 ? 'muted small' : 'muted small'}>
                  {remaining > 0
                    ? `Leaves ${money(remaining)} outstanding.`
                    : remaining === 0
                      ? 'Settles this vendor.'
                      : `That is ${money(-remaining)} more than the balance.`}
                </p>
              ) : null}

              <p className="muted small">
                Goes into <strong>{row.nextStage}</strong>, the first empty instalment column. The sheet recalculates
                the balance itself — nothing writes to FINAL PAYMENT.
              </p>

              <div className="row-form">
                <button type="button" className="btn block" onClick={() => setPaying(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn primary block"
                  disabled={busy || !(entered > 0)}
                  onClick={() => {
                    onRecordPayment(row, entered);
                    onClose();
                  }}
                >
                  {busy ? 'Saving…' : 'Record payment'}
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="btn primary block" disabled={busy} onClick={() => setPaying(true)}>
              Record a payment
            </button>
          )}
        </div>
      ) : (
        <p className="muted small">
          Every instalment column on this row is filled, so a further payment has nowhere to go. Add a column in the
          sheet, or record it there directly.
        </p>
      )}

      <div className="danger-zone">
        <p className="muted small">
          Roll-up rows like a “(Total Cost)” line, or a superseded quote, would be counted twice in the summary. Leave
          those out here.
        </p>
        <button type="button" className="btn block" onClick={() => onToggleExcluded(row.vendor)}>
          {excluded ? 'Count in totals' : 'Exclude from totals'}
        </button>
      </div>
    </Sheet>
  );
}
