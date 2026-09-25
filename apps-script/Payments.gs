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

// Optional. The tab has no date column today; add any one of these headers and
// the app starts flagging what is due without needing a code change.
const PAYMENTS_DUE = ['DUE DATE', 'DUE', 'PAYMENT DUE', 'NEXT DUE', 'DUE ON', 'SCHEDULE'];

// The vendor table ends here; rows below are other sections.
const PAYMENTS_GRAND = /^(grand\s+total|total\s+amount)\b/i;

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

  let dueCol = 0;
  for (let i = 0; i < PAYMENTS_DUE.length && !dueCol; i += 1) {
    const at = header.indexOf(PAYMENTS_DUE[i]);
    if (at >= 0) dueCol = at + 1;
  }

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
        due: dueCol ? isoDate_(raw[i][dueCol - 1]) : '',
        dueText: dueCol ? String(shown[i][dueCol - 1] || '').trim() : '',
        // Which instalment column a payment would land in, so the app can say
        // up front whether there is room to record one.
        nextStage: nextStage_(raw[i], stages),
      });
    }
  }

  return {
    tab: PAYMENTS_SHEET,
    headerRow: headerRow,
    headers: labels.filter(String),
    stageLabels: stages.map((s) => s.label),
    hasDueDates: Boolean(dueCol),
    rows: rows,
    fetchedAt: new Date().toISOString(),
  };
}

/** The first instalment column with nothing in it, or null when all are used. */
function nextStage_(rowValues, stages) {
  for (let i = 0; i < stages.length; i += 1) {
    const v = rowValues[stages[i].col - 1];
    if (v === '' || v == null) return stages[i].label;
  }
  return null;
}

/**
 * Records a payment by writing it into the first empty instalment column, which
 * is what the sheet's own FINAL PAYMENT formula subtracts from. Nothing writes
 * to FINAL PAYMENT itself — that stays the sheet's calculation.
 */
function payVendor_(body) {
  const amount = Number(body.amount);
  if (!(amount > 0)) return { ok: false, error: 'Amount must be greater than zero.' };

  const sheet = tab_(PAYMENTS_SHEET);
  const row = Number(body.row);
  if (!row) return { ok: false, error: 'Missing row' };

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
  if (!headerRow) return { ok: false, error: 'Could not find the payments header row' };

  const header = scan[headerRow - 1].map(norm);
  const labels = scan[headerRow - 1].map((v) => String(v == null ? '' : v).trim());
  const vendorCol = header.indexOf(PAYMENTS_HEADER) + 1;
  const totalCol = header.indexOf(PAYMENTS_TOTAL) + 1;
  const balanceCol = header.indexOf(PAYMENTS_BALANCE) + 1;

  // Same guard as the to-do list: rows shift, so name what you expect to find.
  const actual = String(sheet.getRange(row, vendorCol).getDisplayValue() || '').trim();
  if (actual !== String(body.expectVendor == null ? '' : body.expectVendor).trim()) {
    return {
      ok: false,
      stale: true,
      error: 'Row ' + row + ' now reads "' + actual + '". The sheet changed — reload before recording a payment.',
    };
  }

  const stages = [];
  for (let c = totalCol + 1; c < balanceCol; c += 1) {
    if (labels[c - 1]) stages.push({ col: c, label: labels[c - 1] });
  }

  const values = sheet.getRange(row, 1, 1, width).getValues()[0];
  let target = null;
  for (let i = 0; i < stages.length && !target; i += 1) {
    const v = values[stages[i].col - 1];
    if (v === '' || v == null) target = stages[i];
  }
  if (!target) {
    return { ok: false, error: 'Every instalment column on this row is already filled, so there is nowhere to record it.' };
  }

  sheet.getRange(row, target.col).setValue(amount);
  SpreadsheetApp.flush();
  return { ok: true, row: row, stage: target.label, amount: amount };
}


/** Shared column map, so the write paths agree with the read path. */
function paymentsLayout_() {
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
  const totalCol = header.indexOf(PAYMENTS_TOTAL) + 1;
  const balanceCol = header.indexOf(PAYMENTS_BALANCE) + 1;

  const stages = [];
  for (let c = totalCol + 1; c < balanceCol; c += 1) {
    if (labels[c - 1]) stages.push({ col: c, label: labels[c - 1] });
  }

  let dueCol = 0;
  for (let i = 0; i < PAYMENTS_DUE.length && !dueCol; i += 1) {
    const at = header.indexOf(PAYMENTS_DUE[i]);
    if (at >= 0) dueCol = at + 1;
  }

  return {
    sheet: sheet,
    width: width,
    headerRow: headerRow,
    vendorCol: header.indexOf(PAYMENTS_HEADER) + 1,
    totalCol: totalCol,
    balanceCol: balanceCol,
    notesCol: header.indexOf('NOTES') + 1,
    paxCol: header.indexOf('# OF PAX') + 1,
    dueCol: dueCol,
    stages: stages,
  };
}

/** Row number of the grand total, which marks the end of the vendor table. */
function grandTotalRow_(L) {
  const first = L.headerRow + 1;
  const last = L.sheet.getLastRow();
  if (last < first) return 0;
  const names = L.sheet.getRange(first, L.vendorCol, last - first + 1, 1).getDisplayValues();
  for (let i = 0; i < names.length; i += 1) {
    if (PAYMENTS_GRAND.test(String(names[i][0] || '').trim())) return first + i;
  }
  return 0;
}

/**
 * Adds a vendor to the end of the table.
 *
 * Placed one row above the last existing vendor rather than directly after it:
 * a grand total written as SUM over the vendor rows only grows when a row is
 * inserted inside that range, and appending below it would leave the new
 * vendor out of the sheet's own total. The reply reports whether the total
 * actually moved, so a formula that needs widening doesn't pass unnoticed.
 */
function addVendor_(body) {
  const fields = body.fields || {};
  const vendor = String(fields.vendor == null ? '' : fields.vendor).trim();
  if (!vendor) return { ok: false, error: 'A vendor name is required.' };

  const L = paymentsLayout_();
  const grandRow = grandTotalRow_(L);
  const firstData = L.headerRow + 1;

  // Last vendor row above the grand total, skipping trailing blanks.
  let lastVendor = (grandRow ? grandRow : L.sheet.getLastRow() + 1) - 1;
  while (lastVendor >= firstData && !String(L.sheet.getRange(lastVendor, L.vendorCol).getDisplayValue() || '').trim()) {
    lastVendor -= 1;
  }
  if (lastVendor < firstData) return { ok: false, error: 'The vendor table appears to be empty.' };

  const totalBefore = grandRow ? Number(L.sheet.getRange(grandRow, L.totalCol).getValue()) || 0 : null;

  L.sheet.insertRowBefore(lastVendor);
  const target = lastVendor;
  // Inherit formatting and the FINAL PAYMENT formula from the row below.
  L.sheet.getRange(target + 1, 1, 1, L.width).copyTo(L.sheet.getRange(target, 1, 1, L.width));

  const clear = [L.vendorCol, L.totalCol, L.notesCol, L.paxCol, L.dueCol]
    .concat(L.stages.map(function (s) { return s.col; }))
    .filter(Boolean);
  clear.forEach(function (col) { L.sheet.getRange(target, col).clearContent(); });

  L.sheet.getRange(target, L.vendorCol).setValue(vendor);
  if (L.totalCol && fields.total != null && fields.total !== '') {
    L.sheet.getRange(target, L.totalCol).setValue(Number(fields.total));
  }
  const stageValues = fields.stages || {};
  L.stages.forEach(function (stage) {
    const v = stageValues[stage.label];
    if (v != null && v !== '') L.sheet.getRange(target, stage.col).setValue(Number(v));
  });
  if (L.notesCol && fields.notes) L.sheet.getRange(target, L.notesCol).setValue(String(fields.notes));
  if (L.paxCol && fields.pax) L.sheet.getRange(target, L.paxCol).setValue(fields.pax);
  if (L.dueCol && fields.due) L.sheet.getRange(target, L.dueCol).setValue(new Date(String(fields.due) + 'T00:00:00'));

  SpreadsheetApp.flush();

  let countedInTotal = null;
  if (grandRow) {
    const movedTo = grandTotalRow_(paymentsLayout_());
    const totalAfter = Number(L.sheet.getRange(movedTo, L.totalCol).getValue()) || 0;
    const added = Number(fields.total) || 0;
    countedInTotal = Math.abs(totalAfter - totalBefore - added) < 0.005;
  }

  return { ok: true, row: target, countedInTotal: countedInTotal };
}
