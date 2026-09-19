// Pure date math for recurring bills. No state, no storage — the store and
// pages both lean on this so "what's due" is computed the same way everywhere.

export const CADENCES = [
  { id: 'monthly', label: 'Monthly', months: 1 },
  { id: 'quarterly', label: 'Quarterly', months: 3 },
  { id: 'yearly', label: 'Yearly', months: 12 },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export { MONTH_NAMES };

const cadenceMonths = (cadence) => CADENCES.find((entry) => entry.id === cadence)?.months ?? 1;

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const pad = (n) => String(n).padStart(2, '0');

export const periodKey = (year, month) => `${year}-${pad(month + 1)}`;

// The bill's current cycle as of `today` — the most recent due month that has
// started, whether or not it's been paid yet. Monthly bills are always "this
// month"; longer cadences roll back to the last month that lines up with the
// bill's anchor.
export function activeCycle(bill, today = new Date()) {
  const months = cadenceMonths(bill.cadence);
  const anchor = ((bill.anchorMonth ?? 0) % 12 + 12) % 12;

  if (months === 1) {
    return { year: today.getFullYear(), month: today.getMonth() };
  }

  // Cycle months form the arithmetic sequence anchor + k*months (k any integer).
  // Find the largest one that hasn't started yet — closed-form, so it can't
  // loop: floor-dividing linear month indices handles the year rollover for free.
  const todayIndex = today.getFullYear() * 12 + today.getMonth();
  const k = Math.floor((todayIndex - anchor) / months);
  const cycleIndex = anchor + k * months;
  return { year: Math.floor(cycleIndex / 12), month: ((cycleIndex % 12) + 12) % 12 };
}

export function dueDateOf(bill, cycle) {
  const day = Math.min(bill.dueDay ?? 1, daysInMonth(cycle.year, cycle.month));
  return new Date(cycle.year, cycle.month, day);
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// 'overdue' | 'due-soon' | 'ok' — ok covers "paid" and "not due for a while".
export function statusOf(dueDate, today = new Date(), dueSoonDays = 5) {
  const days = Math.round((startOfDay(dueDate) - startOfDay(today)) / 86400000);
  if (days < 0) return 'overdue';
  if (days <= dueSoonDays) return 'due-soon';
  return 'ok';
}

export function dueLabel(dueDate, today = new Date()) {
  const days = Math.round((startOfDay(dueDate) - startOfDay(today)) / 86400000);
  if (days === 0) return 'due today';
  if (days === 1) return 'due tomorrow';
  if (days > 1) return `due in ${days} days`;
  if (days === -1) return '1 day overdue';
  return `${-days} days overdue`;
}

export const monthLabel = (month) => MONTH_NAMES[month];
