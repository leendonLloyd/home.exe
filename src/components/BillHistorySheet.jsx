import { useRef } from 'react';
import Sheet from './Sheet';

export default function BillHistorySheet({ open, payments, onClose, onDelete, onExport, onImport }) {
  const fileRef = useRef(null);
  const sorted = [...payments].sort((a, b) => (a.paidOn < b.paidOn ? 1 : -1));

  return (
    <Sheet
      open={open}
      title="Payment history"
      onClose={onClose}
      footer={
        <div className="row-form">
          <button type="button" className="btn block" onClick={onExport}>
            Export JSON
          </button>
          <button type="button" className="btn block" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.target.value = '';
            }}
          />
        </div>
      }
    >
      <ul className="stack-list">
        {sorted.map((payment) => (
          <li key={payment.id}>
            <span className="summary-label">
              <strong>{payment.billName}</strong>
              <span className="muted"> · {payment.period}</span>
              {payment.paidBy ? <span className="muted"> · {payment.paidBy}</span> : null}
            </span>
            <strong>{payment.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</strong>
            <button type="button" className="micro-btn danger" onClick={() => onDelete(payment.id)} aria-label={`Undo payment for ${payment.billName} ${payment.period}`}>
              🗑
            </button>
          </li>
        ))}
        {sorted.length === 0 ? <li className="muted">No payments logged yet</li> : null}
      </ul>
    </Sheet>
  );
}
