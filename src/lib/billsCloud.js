import { useCallback, useMemo } from 'react';
import { deleteDoc, setDoc, writeBatch } from 'firebase/firestore';
import { docRef, useCloudDocs } from './cloudDocs';
import { db } from './firebase';

// A document per bill and per payment, so adding a bill on one phone and
// marking another paid on the other never touch the same record.
const BILL = 'bill-';
const PAY = 'pay-';
const ref = (id) => docRef('bills', id);

const uid = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Payments keep their billId + period key, which was chosen for exactly this:
// marking a period paid twice overwrites one document instead of stacking two.
export const paymentId = (billId, period) => `${billId}__${period}`;

export const useBillsStore = () => {
  const { docs, ready, error, setError, report } = useCloudDocs('bills');

  const state = useMemo(() => {
    const d = docs ?? {};
    const pick = (prefix) => Object.entries(d).filter(([id]) => id.startsWith(prefix)).map(([, value]) => value);
    return { bills: pick(BILL), payments: pick(PAY) };
  }, [docs]);

  const addBill = useCallback((draft) => {
    const id = uid();
    return setDoc(ref(BILL + id), { ...draft, id }).catch(report);
  }, [report]);

  const updateBill = useCallback((billId, patch) =>
    setDoc(ref(BILL + billId), patch, { merge: true }).catch(report), [report]);

  const deleteBill = useCallback((billId) => {
    const batch = writeBatch(db);
    batch.delete(ref(BILL + billId));
    // A payment outliving its bill would sit in history with nothing to name it.
    state.payments
      .filter((payment) => payment.billId === billId)
      .forEach((payment) => batch.delete(ref(PAY + payment.id)));
    return batch.commit().catch(report);
  }, [state.payments, report]);

  const markPaid = useCallback((billId, period, entry) => {
    const id = paymentId(billId, period);
    return setDoc(ref(PAY + id), { ...entry, id, billId, period }).catch(report);
  }, [report]);

  const unmarkPaid = useCallback((billId, period) =>
    deleteDoc(ref(PAY + paymentId(billId, period))).catch(report), [report]);

  const deletePayment = useCallback((id) => deleteDoc(ref(PAY + id)).catch(report), [report]);

  const exportState = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bills-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state]);

  /** Replaces everything, so an import is never half-merged with what is there. */
  const replaceAll = useCallback(async (incoming) => {
    const batch = writeBatch(db);
    Object.keys(docs ?? {}).forEach((id) => batch.delete(ref(id)));
    (incoming.bills ?? []).forEach((bill) => {
      const id = bill.id || uid();
      batch.set(ref(BILL + id), { ...bill, id });
    });
    (incoming.payments ?? []).forEach((payment) => {
      const id = payment.id || paymentId(payment.billId, payment.period);
      batch.set(ref(PAY + id), { ...payment, id });
    });
    await batch.commit();
  }, [docs]);

  const importState = useCallback(async (file) => {
    try {
      await replaceAll(JSON.parse(await file.text()));
    } catch (err) {
      report(err);
    }
  }, [replaceAll, report]);

  return {
    state, ready, error, dismissError: () => setError(null),
    addBill, updateBill, deleteBill, markPaid, unmarkPaid, deletePayment,
    exportState, importState, replaceAll,
  };
};
