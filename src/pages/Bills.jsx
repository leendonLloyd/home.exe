import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BillHistorySheet from '../components/BillHistorySheet';
import BillRow from '../components/BillRow';
import BillSheet from '../components/BillSheet';
import PaySheet from '../components/PaySheet';
import Sheet from '../components/Sheet';
import { activeCycle, dueDateOf, periodKey, statusOf } from '../lib/billing';
import { paymentId, useBillsStore } from '../lib/billsStore';

export default function Bills() {
  const store = useBillsStore();
  const { bills, payments } = store.state;

  const [sheet, setSheet] = useState(null);
  const [editing, setEditing] = useState(null);
  const [payTarget, setPayTarget] = useState(null);

  // Fixed for the life of the page visit, so "due in N days" doesn't shift
  // under your finger while you're looking at it — recomputed fresh each
  // time the page mounts, which is what "on load" means here.
  const [today] = useState(() => new Date());

  const paymentsByKey = useMemo(() => new Map(payments.map((payment) => [payment.id, payment])), [payments]);

  const rows = useMemo(() => {
    return bills
      .map((bill) => {
        const cycle = activeCycle(bill, today);
        const period = periodKey(cycle.year, cycle.month);
        const dueDate = dueDateOf(bill, cycle);
        const payment = paymentsByKey.get(paymentId(bill.id, period)) ?? null;
        const status = payment ? 'paid' : statusOf(dueDate, today);
        return { bill, period, dueDate, payment, status };
      })
      .sort((a, b) => a.dueDate - b.dueDate);
  }, [bills, paymentsByKey, today]);

  const needsAttention = rows.filter((row) => row.status === 'overdue' || row.status === 'due-soon');
  const unpaidTotal = rows.filter((row) => row.status !== 'paid').reduce((sum, row) => sum + row.bill.amount, 0);
  const paidCount = rows.filter((row) => row.status === 'paid').length;

  const openAdd = () => {
    setEditing(null);
    setSheet('bill');
  };

  const openEdit = (bill) => {
    setEditing(bill);
    setSheet('bill');
  };

  const openPay = (row) => setPayTarget(row);

  return (
    <div className="screen">
      <header className="app-bar">
        <Link to="/" className="icon-btn" aria-label="Back to hub">
          ←
        </Link>
        <div>
          <h1>Bills</h1>
          <p className="muted">{bills.length ? `${paidCount} / ${bills.length} paid this cycle` : 'No bills yet'}</p>
        </div>
        <button type="button" className="btn small" onClick={() => setSheet('history')}>
          History
        </button>
      </header>

      <main className="scroll">
        {needsAttention.length > 0 ? (
          <div className="flag warn">
            <strong>{needsAttention.length === 1 ? '1 bill needs attention.' : `${needsAttention.length} bills need attention.`}</strong>
            <ul className="stack-list compact">
              {needsAttention.map((row) => (
                <li key={row.bill.id}>
                  <span>{row.bill.name}</span>
                  <span className={row.status === 'overdue' ? 'dn' : 'warm'}>
                    {row.status === 'overdue' ? 'overdue' : 'due soon'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {bills.length > 0 ? (
          <div className="kpi-total">
            <div>
              <span className="kpi-total-value">{unpaidTotal.toLocaleString()}</span>
              <span className="kpi-total-label">unpaid this cycle</span>
            </div>
            <div className="kpi-total-meta">
              <span>{paidCount} paid</span>
              <span>{bills.length - paidCount} unpaid</span>
            </div>
          </div>
        ) : null}

        <div className="stack-rows">
          {rows.map((row) => (
            <BillRow
              key={row.bill.id}
              bill={row.bill}
              dueDate={row.dueDate}
              status={row.status}
              payment={row.payment}
              today={today}
              onPay={() => openPay(row)}
              onOpenActions={() => {
                setEditing(row.bill);
                setSheet('actions');
              }}
            />
          ))}
        </div>

        {bills.length === 0 ? <p className="empty">No bills yet. Add one below.</p> : null}
      </main>

      <nav className="tab-bar">
        <button type="button" className="btn primary" onClick={openAdd}>
          + Bill
        </button>
      </nav>

      <BillSheet
        open={sheet === 'bill'}
        bill={editing}
        onClose={() => setSheet(null)}
        onSave={(draft) => {
          if (editing) store.updateBill(editing.id, draft);
          else store.addBill(draft);
        }}
      />

      <Sheet open={sheet === 'actions'} title={editing ? editing.name : 'Bill'} onClose={() => setSheet(null)}>
        <button type="button" className="btn block" onClick={() => openEdit(editing)}>
          Edit bill
        </button>
        <button
          type="button"
          className="btn danger block"
          onClick={() => {
            store.deleteBill(editing.id);
            setSheet(null);
            setEditing(null);
          }}
        >
          Delete bill
        </button>
      </Sheet>

      <PaySheet
        open={Boolean(payTarget)}
        bill={payTarget?.bill}
        period={payTarget?.period}
        onClose={() => setPayTarget(null)}
        onSave={(entry) => {
          store.markPaid(payTarget.bill.id, payTarget.period, { ...entry, billName: payTarget.bill.name });
        }}
      />

      <BillHistorySheet
        open={sheet === 'history'}
        payments={payments}
        onClose={() => setSheet(null)}
        onDelete={store.deletePayment}
        onExport={store.exportState}
        onImport={store.importState}
      />
    </div>
  );
}
