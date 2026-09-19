import Icon from './Icon';
import { CADENCES, dueLabel } from '../lib/billing';

const cadenceLabel = (id) => CADENCES.find((entry) => entry.id === id)?.label ?? 'Monthly';

const fmt = (value) => value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function BillRow({ bill, dueDate, status, payment, today, onPay, onOpenActions }) {
  const paid = Boolean(payment);

  return (
    <article
      className={paid ? 'bill-row paid' : `bill-row ${status}`}
      role="button"
      tabIndex={0}
      aria-label={`Options for ${bill.name}`}
      onClick={onOpenActions}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpenActions();
      }}
    >
      <span className="bill-icon">
        <Icon name={bill.icon} size={20} />
      </span>

      <span className="bill-text">
        <span className="bill-name">{bill.name}</span>
        <span className="muted small">
          {cadenceLabel(bill.cadence)} · due {bill.dueDay} · {fmt(bill.amount)}
        </span>
      </span>

      {paid ? (
        <span className="pill" style={{ '--pill': 'var(--good)' }}>
          Paid {fmt(payment.amountPaid)}
        </span>
      ) : (
        <span className="bill-action" onClick={(event) => event.stopPropagation()} role="presentation">
          <span className={status === 'overdue' ? 'due-label dn' : status === 'due-soon' ? 'due-label warm' : 'due-label muted'}>
            {dueLabel(dueDate, today)}
          </span>
          <button type="button" className="btn primary small" onClick={onPay}>
            Mark paid
          </button>
        </span>
      )}
    </article>
  );
}
