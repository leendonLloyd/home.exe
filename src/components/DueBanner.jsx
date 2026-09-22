import { useState } from 'react';
import { money } from '../lib/money';
import { dueLabel } from '../lib/paymentTotals';

/**
 * Collapsed it is a list of who is owed and how much; opening it adds the
 * instalment history behind each figure, so the summary stays scannable.
 */
export default function DueBanner({ entries, onOpenVendor }) {
  const [open, setOpen] = useState(false);
  if (!entries.length) return null;

  const overdue = entries.filter((entry) => entry.days < 0).length;
  const total = entries.reduce((sum, entry) => sum + (entry.row.balance || 0), 0);

  return (
    <section className={overdue ? 'flag warn due-banner' : 'flag due-banner'}>
      <button type="button" className="due-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>
          <strong>
            {entries.length === 1 ? '1 payment' : `${entries.length} payments`} due within 7 days
            {overdue > 0 ? ` · ${overdue} overdue` : ''}
          </strong>
          <span className="muted small">{money(total)} in total · tap for the breakdown</span>
        </span>
        <span className={open ? 'caret open' : 'caret'} aria-hidden="true">
          ⌄
        </span>
      </button>

      <ul className="stack-list compact">
        {entries.map(({ row, days }) => (
          <li key={`${row.row}-${row.vendor}`}>
            <span className="summary-label">
              {row.vendor}
              <span className={days < 0 ? 'dn' : 'warm'}> · {dueLabel(days)}</span>
            </span>
            <strong>{money(row.balance)}</strong>
          </li>
        ))}
      </ul>

      {open ? (
        <div className="due-detail">
          {entries.map(({ row }) => {
            const paid = row.stages.filter((stage) => stage.amount);
            return (
              <div className="due-vendor" key={`d-${row.row}-${row.vendor}`}>
                <strong>{row.vendor}</strong>
                <ul className="stack-list compact">
                  <li>
                    <span>Package</span>
                    <strong>{money(row.total)}</strong>
                  </li>
                  {paid.map((stage) => (
                    <li key={stage.label}>
                      <span className="muted">{stage.label}</span>
                      <strong>{money(stage.amount)}</strong>
                    </li>
                  ))}
                  {paid.length === 0 ? (
                    <li>
                      <span className="muted">No instalments recorded</span>
                    </li>
                  ) : null}
                  <li>
                    <span>Balance</span>
                    <strong className="warm">{money(row.balance)}</strong>
                  </li>
                </ul>
                <button type="button" className="btn small" onClick={() => onOpenVendor(row)}>
                  Open {row.vendor}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
