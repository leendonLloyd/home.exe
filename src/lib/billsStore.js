import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_STATE } from './billDefaults';

const STORAGE_KEY = 'home.exe:bills:v1';

const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Payments are keyed by billId + period rather than a random id, so "mark
// paid" is a set on a known document, not a push into an array — the same
// shape a Firestore doc path (`payments/{billId}__{period}`) would need,
// and it makes marking a period paid twice an overwrite, not a duplicate.
export const paymentId = (billId, period) => `${billId}__${period}`;

const readState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      bills: parsed.bills ?? [],
      payments: parsed.payments ?? [],
    };
  } catch {
    return DEFAULT_STATE;
  }
};

export const useBillsStore = () => {
  const [state, setState] = useState(readState);
  const hydrated = useRef(false);

  // Skip the first write so a failed read can never overwrite stored data.
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addBill = useCallback((draft) => {
    setState((prev) => ({ ...prev, bills: [...prev.bills, { ...draft, id: uid('bill') }] }));
  }, []);

  const updateBill = useCallback((billId, patch) => {
    setState((prev) => ({
      ...prev,
      bills: prev.bills.map((bill) => (bill.id === billId ? { ...bill, ...patch } : bill)),
    }));
  }, []);

  const deleteBill = useCallback((billId) => {
    setState((prev) => ({
      ...prev,
      bills: prev.bills.filter((bill) => bill.id !== billId),
      payments: prev.payments.filter((payment) => payment.billId !== billId),
    }));
  }, []);

  // Upsert by deterministic id: logging the same period twice replaces the
  // record instead of stacking a second one.
  const markPaid = useCallback((billId, period, entry) => {
    setState((prev) => {
      const id = paymentId(billId, period);
      const record = { ...entry, id, billId, period };
      const exists = prev.payments.some((payment) => payment.id === id);
      const payments = exists
        ? prev.payments.map((payment) => (payment.id === id ? record : payment))
        : [...prev.payments, record];
      return { ...prev, payments };
    });
  }, []);

  const unmarkPaid = useCallback((billId, period) => {
    setState((prev) => ({
      ...prev,
      payments: prev.payments.filter((payment) => payment.id !== paymentId(billId, period)),
    }));
  }, []);

  const deletePayment = useCallback((id) => {
    setState((prev) => ({ ...prev, payments: prev.payments.filter((payment) => payment.id !== id) }));
  }, []);

  const exportState = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bills-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importState = useCallback(async (file) => {
    const parsed = JSON.parse(await file.text());
    setState({
      bills: parsed.bills ?? [],
      payments: parsed.payments ?? [],
    });
  }, []);

  return {
    state,
    addBill,
    updateBill,
    deleteBill,
    markPaid,
    unmarkPaid,
    deletePayment,
    exportState,
    importState,
  };
};
