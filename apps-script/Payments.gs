/**
 * PAYMENT MONITORING tab — read only.
 *
 * FINAL PAYMENT is a formula and these are real amounts, so nothing here
 * writes. Payment stages are whatever columns sit between TOTAL PACKAGE and
 * FINAL PAYMENT, so adding a 6th instalment needs no change here.
 */

// Payment monitoring is read-only: the balance column is a formula and the
// numbers are the source of truth for real money, so nothing here writes.
const PAYMENTS_SHEET = 'PAYMENT MONITORING';

const PAYMENTS_HEADER = 'VENDORS';

const PAYMENTS_TOTAL = 'TOTAL PACKAGE';

const PAYMENTS_BALANCE = 'FINAL PAYMENT';

/**
 * The payment stages are whatever columns sit between TOTAL PACKAGE and FINAL
 * PAYMENT, rather than a fixed list of "1ST PAYMENT".."5TH PAYMENT" — adding a
 * 6th instalment in the sheet then needs no change here.
 */
function readPayments_() {
  const sheet = tab_(PAYMENTS_SHEET);

  const width = Math.max(sheet.getLastColumn(), 1);
  const lastRow = sheet.getLastRow();
  const scan = sheet.getRange(1, 1, Math.min(20, lastRow || 1), width).getDisplayValues();
  const norm = (v) => String(v == null ? '' : v).trim().toUpperCase();

  let headerRow = 0;
  for (let r = 0; r < scan.length; r += 1) {
    if (scan[r].some((v) => norm(v) === PAYMENTS_HEADER)) {
      headerRow = r + 1;
      break;
    }
  }
  if (!headerRow) throw new Error('Could not find a header row containing "' + PAYMENTS_HEADER + '"');

  const header = scan[headerRow - 1].map(norm);
  const labels = scan[headerRow - 1].map((v) => String(v == null ? '' : v).trim());

  const vendorCol = header.indexOf(PAYMENTS_HEADER) + 1;
  const totalCol = header.indexOf(PAYMENTS_TOTAL) + 1;
  const balanceCol = header.indexOf(PAYMENTS_BALANCE) + 1;
  const notesCol = header.indexOf('NOTES') + 1;
  const paxCol = header.indexOf('# OF PAX') + 1;

  const stages = [];
  if (totalCol && balanceCol) {
    for (let c = totalCol + 1; c < balanceCol; c += 1) {
      if (labels[c - 1]) stages.push({ col: c, label: labels[c - 1] });
    }
  }

  const firstDataRow = headerRow + 1;
  const rows = [];

  if (lastRow >= firstDataRow) {
    const height = lastRow - firstDataRow + 1;
    const raw = sheet.getRange(firstDataRow, 1, height, width).getValues();
    const shown = sheet.getRange(firstDataRow, 1, height, width).getDisplayValues();

    for (let i = 0; i < height; i += 1) {
      const vendor = String(raw[i][vendorCol - 1] || '').trim();
      if (!vendor) continue;

      const paidStages = stages.map((stage) => ({
        label: stage.label,
        amount: num_(raw[i][stage.col - 1]),
        text: String(shown[i][stage.col - 1] || '').trim(),
      }));

      rows.push({
        row: firstDataRow + i,
        vendor: vendor,
        total: totalCol ? num_(raw[i][totalCol - 1]) : null,
        totalText: totalCol ? String(shown[i][totalCol - 1] || '').trim() : '',
        balance: balanceCol ? num_(raw[i][balanceCol - 1]) : null,
        balanceText: balanceCol ? String(shown[i][balanceCol - 1] || '').trim() : '',
        paid: paidStages.reduce((sum, s) => sum + (s.amount || 0), 0),
        stages: paidStages,
        notes: notesCol ? String(shown[i][notesCol - 1] || '').trim() : '',
        pax: paxCol ? String(shown[i][paxCol - 1] || '').trim() : '',
      });
    }
  }

  return {
    tab: PAYMENTS_SHEET,
    headerRow: headerRow,
    stageLabels: stages.map((s) => s.label),
    rows: rows,
    fetchedAt: new Date().toISOString(),
  };
}
