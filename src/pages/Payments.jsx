import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PaymentRow from '../components/PaymentRow';
import PaymentSheet from '../components/PaymentSheet';
import { money } from '../lib/money';
import { usePaymentsStore } from '../lib/paymentsStore';

const FILTERS = [
  { id: 'due', label: 'Outstanding' },
  { id: 'all', label: 'All' },
  { id: 'settled', label: 'Settled' },
];

export default function Payments() {
  const store = usePaymentsStore();
  const [filter, setFilter] = useState('due');
  const [detail, setDetail] = useState(null);

  const rows = useMemo(() => {
    const settled = (row) => row.balance === 0 && row.total != null;
    const visible = store.data.rows.filter((row) =>
      filter === 'all' ? true : filter === 'settled' ? settled(row) : !settled(row)
    );
    // Biggest outstanding first — that is the question this page answers.
    return [...visible].sort((a, b) => (b.balance || 0) - (a.balance || 0));
  }, [store.data.rows, filter]);

  if (!store.url) {
    return (
      <div className="screen">
        <header className="app-bar">
          <Link to="/" className="icon-btn" aria-label="Back to hub">
            ←
          </Link>
          <div>
            <h1>Payments</h1>
            <p className="muted">Not connected</p>
          </div>
        </header>
        <main className="scroll">
          <div className="flag">
            <strong>Connect the planner sheet first.</strong> Payments uses the same Apps Script deployment as To Do —
            set it up there and it appears here too.
          </div>
          <Link to="/todo" className="btn primary block">
            Go to To Do
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="app-bar">
        <Link to="/" className="icon-btn" aria-label="Back to hub">
          ←
        </Link>
        <div>
          <h1>Payments</h1>
          <p className="muted">{store.loading ? 'Syncing…' : `${store.data.rows.length} vendors · read-only`}</p>
        </div>
        <button type="button" className="icon-btn" onClick={store.refresh} disabled={store.loading} aria-label="Reload">
          ↻
        </button>
      </header>

      <main className="scroll">
        {store.error ? (
          <div className="flag warn">
            <strong>{store.error}</strong>
            <button type="button" className="btn small" onClick={store.dismissError}>
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="kpi-total">
          <div>
            <span className="kpi-total-value">{money(store.totals.balance)}</span>
            <span className="kpi-total-label">still to pay</span>
          </div>
          <div className="kpi-total-meta">
            <span>paid {money(store.totals.paid)}</span>
            <span>of {money(store.totals.package)}</span>
          </div>
        </div>

        <p className="muted small">
          Totals cover {store.totals.counted} row{store.totals.counted === 1 ? '' : 's'}
          {store.totals.excluded > 0 ? `, ${store.totals.excluded} excluded` : ''}. Tap a vendor to leave roll-up or
          superseded rows out.
        </p>

        <div className="segmented" role="tablist" aria-label="Filter payments">
          {FILTERS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={filter === entry.id}
              className={filter === entry.id ? 'seg active' : 'seg'}
              onClick={() => setFilter(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="stack-rows">
          {rows.map((row) => (
            <PaymentRow
              key={`${row.row}-${row.vendor}`}
              row={row}
              excluded={store.excluded.includes(row.vendor)}
              onOpen={() => setDetail(row)}
            />
          ))}
        </div>

        {rows.length === 0 ? (
          <p className="empty">
            {store.loading ? 'Loading from the sheet…' : filter === 'due' ? 'Nothing outstanding.' : 'Nothing here.'}
          </p>
        ) : null}
      </main>

      <PaymentSheet
        open={Boolean(detail)}
        row={detail}
        excluded={detail ? store.excluded.includes(detail.vendor) : false}
        onClose={() => setDetail(null)}
        onToggleExcluded={(vendor) => {
          store.toggleExcluded(vendor);
          setDetail(null);
        }}
      />
    </div>
  );
}
