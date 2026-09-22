import { money } from '../lib/money';
import { daysUntil, dueLabel, paidOf } from '../lib/paymentTotals';

export default function PaymentRow({ row, excluded, onOpen }) {
  const settled = row.balance === 0 && row.total != null;
  // A row with neither a package nor a balance has nothing filled in yet —
  // reporting "0 due" would read as settled when it is really just blank.
  const blank = row.total == null && !row.balance;

  const days = daysUntil(row.due);
  const owing = (row.balance || 0) > 0;
  const urgent = owing && days != null && days <= 7;

  return (
    <article
      className={`pay-row${settled ? ' settled' : ''}${excluded ? ' excluded' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Payment detail for ${row.vendor}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onOpen();
      }}
    >
      <span className="pay-text">
        <span className="pay-vendor">{row.vendor}</span>
        <span className="muted small">
          {[
            row.total == null ? 'no package total' : `paid ${money(paidOf(row))} of ${money(row.total)}`,
            row.dueText ? `due ${row.dueText}` : null,
            excluded ? 'not counted' : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>

      <span className="pay-amount">
        {blank ? (
          <span className="muted small">no figures</span>
        ) : settled ? (
          <span className="pill" style={{ '--pill': 'var(--good)' }}>
            Settled
          </span>
        ) : (
          <>
            <strong className={row.balance ? 'warm' : undefined}>{money(row.balance)}</strong>
            <span className={urgent ? (days < 0 ? 'due-label dn' : 'due-label warm') : 'muted small'}>
              {days == null ? 'due' : dueLabel(days)}
            </span>
          </>
        )}
      </span>
    </article>
  );
}
