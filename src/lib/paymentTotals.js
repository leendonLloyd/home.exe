// The PAYMENT MONITORING tab mixes three kinds of row: vendor lines, roll-ups
// over other lines, and the sheet's own totals. Summing all of them triple
// counts, so the sheet's own total row is trusted ahead of anything computed
// here — the same way the to-do summary tiles are read rather than recalculated.

// Anchored at the start so "Soiree Events Place (Total Cost)" — a roll-up, but
// still a line of its own — is not mistaken for a totals row.
const TOTAL_ROW = /^(grand\s+)?total\b/i;
const GRAND_ROW = /^(grand\s+total|total\s+amount)\b/i;

export const isTotalRow = (vendor) => TOTAL_ROW.test(String(vendor || '').trim());

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * What has been paid, taken from the sheet rather than added up here.
 *
 * FINAL PAYMENT is the sheet's own formula for what is left, so package minus
 * it is the sheet's own answer for what has been settled. Summing the
 * instalment columns instead disagrees wherever payments were recorded on a
 * roll-up row and the component lines were simply marked settled — three rows
 * do exactly that, and adding their columns up wrongly calls them part-paid.
 */
export function paidOf(row) {
  if (row.total == null || row.balance == null) return null;
  return round2(row.total - row.balance);
}

/** Sum of the instalment columns actually filled in, which can be less than paidOf. */
export const instalmentsOf = (row) => round2((row.stages || []).reduce((sum, s) => sum + (s.amount || 0), 0));

export function splitRows(rows) {
  const totals = rows.filter((row) => isTotalRow(row.vendor));
  return { vendors: rows.filter((row) => !isTotalRow(row.vendor)), totals };
}

/** The most authoritative total row, or null when the sheet has none. */
export function sheetTotal(totals) {
  if (!totals.length) return null;
  const grand = totals.filter((row) => GRAND_ROW.test(String(row.vendor || '').trim()));
  if (grand.length === 1) return grand[0];
  if (grand.length > 1) return grand.reduce((a, b) => ((b.total || 0) > (a.total || 0) ? b : a));
  // No row names itself the grand total, so only an unambiguous single one counts.
  return totals.length === 1 ? totals[0] : null;
}

export function summarise(rows, excluded) {
  const { vendors, totals } = splitRows(rows);
  const counted = vendors.filter((row) => !excluded.includes(row.vendor));
  const computed = {
    package: round2(counted.reduce((sum, row) => sum + (row.total || 0), 0)),
    paid: round2(counted.reduce((sum, row) => sum + (paidOf(row) || 0), 0)),
    balance: round2(counted.reduce((sum, row) => sum + (row.balance || 0), 0)),
  };

  const fromSheet = sheetTotal(totals);
  return {
    vendors,
    totals,
    counted: counted.length,
    excluded: vendors.length - counted.length,
    computed,
    fromSheet,
    // What the headline shows, and where it came from.
    headline: fromSheet
      ? { package: fromSheet.total, paid: paidOf(fromSheet), balance: fromSheet.balance, source: fromSheet.vendor }
      : { ...computed, source: null },
  };
}
