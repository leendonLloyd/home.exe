/**
 * home.exe — TO DO LIST bridge.
 *
 * Paste into Extensions > Apps Script on the wedding planner sheet, then
 * Deploy > New deployment > Web app, "Execute as: Me", "Who has access:
 * Anyone". The "Anyone" part matters: "Anyone with a Google account" makes
 * the browser fetch fail on auth, not on permissions.
 *
 * The layout is discovered at runtime rather than hardcoded, so moving a
 * column or inserting rows above the table won't break the app.
 */

const SHEET_NAME = 'TO DO LIST';

// Header labels as they read in the sheet, mapped to the keys the app uses.
const FIELDS = {
  item: 'ITEM',
  person: 'PERSON IN CHARGE',
  due: 'DUE DATE',
  daysLeft: 'DAYS LEFT',
  priority: 'PRIORITY',
  done: 'DONE',
  notes: 'NOTES',
};

// DAYS LEFT is derived from DUE DATE in the sheet, and the summary cells are
// formulas too. The app reads both and writes neither.
const READ_ONLY = ['daysLeft'];

const SUMMARY_LABELS = ['Total Tasks', 'Completed Tasks', 'Pending Tasks', 'Overdue Tasks'];

function doGet() {
  try {
    return json_({ ok: true, ...readAll_() });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const result =
      body.action === 'update' ? update_(body) :
      body.action === 'add' ? add_(body) :
      body.action === 'remove' ? remove_(body) :
      { ok: false, error: 'Unknown action: ' + body.action };

    // Every mutation answers with fresh state, so the app never has to guess
    // what the sheet looks like afterwards.
    return json_(result.ok ? { ...result, ...readAll_() } : result);
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function layout_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('No tab named "' + SHEET_NAME + '"');

  const width = Math.max(sheet.getLastColumn(), 1);
  const scanDepth = Math.min(40, sheet.getLastRow() || 1);
  const scan = sheet.getRange(1, 1, scanDepth, width).getDisplayValues();

  const norm = (v) => String(v == null ? '' : v).trim().toUpperCase();

  let headerRow = 0;
  for (let r = 0; r < scan.length; r += 1) {
    if (scan[r].some((v) => norm(v) === FIELDS.item)) {
      headerRow = r + 1;
      break;
    }
  }
  if (!headerRow) throw new Error('Could not find a header row containing "' + FIELDS.item + '"');

  const header = scan[headerRow - 1].map(norm);
  const cols = {};
  Object.keys(FIELDS).forEach((key) => {
    const index = header.indexOf(norm(FIELDS[key]));
    if (index >= 0) cols[key] = index + 1;
  });
  if (!cols.item) throw new Error('No ITEM column found in the header row');

  return { sheet, headerRow, cols, width };
}

function summary_(sheet, headerRow, width) {
  if (headerRow <= 1) return {};
  const block = sheet.getRange(1, 1, headerRow - 1, width).getDisplayValues();
  const out = {};

  block.forEach((row) => {
    row.forEach((cell, index) => {
      const label = String(cell == null ? '' : cell).trim();
      if (SUMMARY_LABELS.indexOf(label) === -1) return;
      // Take the first non-empty cell to the right of the label.
      for (let c = index + 1; c < row.length; c += 1) {
        const value = String(row[c] == null ? '' : row[c]).trim();
        if (value !== '') {
          out[label] = value;
          return;
        }
      }
    });
  });

  return out;
}

function priorityOptions_(sheet, cols, firstDataRow) {
  if (!cols.priority) return [];
  try {
    const rule = sheet.getRange(firstDataRow, cols.priority).getDataValidation();
    if (!rule) return [];
    const values = rule.getCriteriaValues();
    const list = values && values[0];
    return Array.isArray(list) ? list.map(String) : [];
  } catch (err) {
    return [];
  }
}

function isoDate_(value) {
  if (!(value instanceof Date) || isNaN(value.getTime())) return '';
  return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function readAll_() {
  const { sheet, headerRow, cols, width } = layout_();
  const firstDataRow = headerRow + 1;
  const lastRow = sheet.getLastRow();

  const tasks = [];
  if (lastRow >= firstDataRow) {
    const height = lastRow - firstDataRow + 1;
    const raw = sheet.getRange(firstDataRow, 1, height, width).getValues();
    const shown = sheet.getRange(firstDataRow, 1, height, width).getDisplayValues();

    const at = (arr, col) => (col ? arr[col - 1] : '');

    for (let i = 0; i < height; i += 1) {
      const item = String(at(raw[i], cols.item) || '').trim();
      if (!item) continue; // blank spacer rows inside the table
      tasks.push({
        row: firstDataRow + i,
        item: item,
        person: String(at(raw[i], cols.person) || '').trim(),
        due: isoDate_(at(raw[i], cols.due)),
        dueText: String(at(shown[i], cols.due) || '').trim(),
        daysLeft: String(at(shown[i], cols.daysLeft) || '').trim(),
        priority: String(at(raw[i], cols.priority) || '').trim(),
        done: at(raw[i], cols.done) === true,
        notes: String(at(raw[i], cols.notes) || '').trim(),
      });
    }
  }

  return {
    sheetName: SHEET_NAME,
    fields: Object.keys(cols),
    tasks: tasks,
    summary: summary_(sheet, headerRow, width),
    priorityOptions: priorityOptions_(sheet, cols, firstDataRow),
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Row numbers shift if anyone inserts or deletes rows in the sheet while the
 * app is open, so a write names the item it expects to find there. A mismatch
 * refuses rather than overwriting whatever moved into that row.
 */
function guardRow_(sheet, cols, row, expectItem) {
  const actual = String(sheet.getRange(row, cols.item).getDisplayValue() || '').trim();
  if (actual === String(expectItem == null ? '' : expectItem).trim()) return null;
  return {
    ok: false,
    stale: true,
    error: 'Row ' + row + ' now reads "' + actual + '". The sheet changed — reload before editing.',
  };
}

function writeFields_(sheet, cols, row, fields) {
  Object.keys(fields).forEach((key) => {
    if (READ_ONLY.indexOf(key) !== -1) return;
    const col = cols[key];
    if (!col) return;

    const value = fields[key];
    const cell = sheet.getRange(row, col);

    if (key === 'done') {
      cell.setValue(value === true);
    } else if (key === 'due') {
      if (!value) cell.clearContent();
      else cell.setValue(new Date(value + 'T00:00:00'));
    } else {
      cell.setValue(value == null ? '' : value);
    }
  });
}

function update_(body) {
  const { sheet, cols } = layout_();
  const row = Number(body.row);
  if (!row) return { ok: false, error: 'Missing row' };

  const stale = guardRow_(sheet, cols, row, body.expectItem);
  if (stale) return stale;

  writeFields_(sheet, cols, row, body.fields || {});
  SpreadsheetApp.flush();
  return { ok: true };
}

/**
 * Prefers an already-blank row inside the table, because those rows still
 * carry the checkbox, the priority dropdown and the DAYS LEFT formula. Only
 * when there isn't one does it grow the table, copying the last row first so
 * the new one inherits all of that.
 */
function add_(body) {
  const { sheet, headerRow, cols, width } = layout_();
  const firstDataRow = headerRow + 1;
  const lastRow = sheet.getLastRow();

  let target = 0;
  if (lastRow >= firstDataRow) {
    const items = sheet.getRange(firstDataRow, cols.item, lastRow - firstDataRow + 1, 1).getValues();
    for (let i = 0; i < items.length; i += 1) {
      if (String(items[i][0] || '').trim() === '') {
        target = firstDataRow + i;
        break;
      }
    }
  }

  if (!target) {
    const source = Math.max(lastRow, firstDataRow);
    sheet.insertRowAfter(source);
    target = source + 1;
    sheet.getRange(source, 1, 1, width).copyTo(sheet.getRange(target, 1, 1, width));
    Object.keys(cols).forEach((key) => {
      if (key === 'daysLeft' || key === 'done') return;
      sheet.getRange(target, cols[key]).clearContent();
    });
  }

  writeFields_(sheet, cols, target, { ...(body.fields || {}), done: body.fields && body.fields.done === true });
  SpreadsheetApp.flush();
  return { ok: true, row: target };
}

function remove_(body) {
  const { sheet, cols } = layout_();
  const row = Number(body.row);
  if (!row) return { ok: false, error: 'Missing row' };

  const stale = guardRow_(sheet, cols, row, body.expectItem);
  if (stale) return stale;

  sheet.deleteRow(row);
  SpreadsheetApp.flush();
  return { ok: true };
}
