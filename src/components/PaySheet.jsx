import { useEffect, useState } from 'react';
import Sheet from './Sheet';

const today = () => new Date().toISOString().slice(0, 10);

export default function PaySheet({ open, bill, period, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState(today);
  const [paidBy, setPaidBy] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open || !bill) return;
    setAmount(String(bill.amount));
    setPaidOn(today());
    setPaidBy('');
    setNote('');
  }, [open, bill]);

  if (!bill) return null;

  const value = parseFloat(amount);
  const canSubmit = value > 0 && Boolean(paidOn);

  const submit = () => {
    if (!canSubmit) return;
    onSave({ amountPaid: value, paidOn, paidBy: paidBy.trim(), note: note.trim() });
    onClose();
  };

  return (
    <Sheet
      open={open}
      title="Mark as paid"
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" disabled={!canSubmit} onClick={submit}>
          Save payment
        </button>
      }
    >
      <p className="muted small">
        {bill.name} · {period}
      </p>

      <label className="field-label" htmlFor="pay-amount">
        Amount paid
      </label>
      <input id="pay-amount" type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />

      <label className="field-label" htmlFor="pay-date">
        Date paid
      </label>
      <input id="pay-date" type="date" value={paidOn} onChange={(event) => setPaidOn(event.target.value)} />

      <label className="field-label" htmlFor="pay-by">
        Paid by
      </label>
      <input id="pay-by" value={paidBy} onChange={(event) => setPaidBy(event.target.value)} placeholder="Optional" maxLength={24} />

      <label className="field-label" htmlFor="pay-note">
        Note
      </label>
      <input id="pay-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" maxLength={60} />
    </Sheet>
  );
}
