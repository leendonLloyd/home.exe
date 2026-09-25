import { useEffect, useState } from 'react';
import { money } from '../lib/money';
import { instalmentsOf, paidOf } from '../lib/paymentTotals';
import Sheet from './Sheet';

export default function PaymentSheet({ open, row, excluded, busy, hasDueDates, onClose, onToggleExcluded, onRecordPayment, onSetDueDate }) {
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState('');
  const [dueEdit, setDueEdit] = useState(null);

  useEffect(() => {
    if (!open) return;
    setPaying(false);
    setAmount(row && row.balance != null ? String(row.balance) : '');
    setDueEdit(null);
  }, [open, row]);

  if (!row) return null;

  const stages = row.stages.filter((stage) => stage.amount);
  const saved = row.due || '';
  const due = dueEdit === null ? saved : dueEdit;
  const paid = paidOf(row);
  const instalments = instalmentsOf(row);
  // Payments recorded against a roll-up leave the component line's instalment
  // columns empty even though the sheet shows it settled.
  const unrecorded = paid != null && Math.abs(paid - instalments) > 0.005;

  return (
    <Sheet open={open} title={row.vendor} onClose={onClose}>
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
              <label className="field-label" htmlFor="pay-amount">
                Amount to record
              </label>
              <input
                id="pay-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
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
                  disabled={busy || !(parseFloat(amount) > 0)}
                  onClick={() => {
                    onRecordPayment(row, parseFloat(amount));
                    onClose();
                  }}
                >
                  {busy ? 'Saving…' : 'Record payment'}
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="btn primary block" disabled={busy} onClick={() => setPaying(true)}>
              Mark as paid
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
