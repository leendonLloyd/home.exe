import { money } from '../lib/money';
import Sheet from './Sheet';

export default function PaymentSheet({ open, row, excluded, onClose, onToggleExcluded }) {
  if (!row) return null;

  const stages = row.stages.filter((stage) => stage.amount);

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
          <strong>{money(row.paid)}</strong>
        </li>
        <li>
          <span>Balance</span>
          <strong className={row.balance ? 'warm' : 'up'}>{money(row.balance)}</strong>
        </li>
      </ul>

      {stages.length === 0 ? <p className="muted small">No instalments recorded yet.</p> : null}
      {row.notes ? <p className="muted small">Note: {row.notes}</p> : null}
      {row.pax ? <p className="muted small">Pax: {row.pax}</p> : null}
      <p className="muted small">Row {row.row} of the sheet. This view never writes.</p>

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
