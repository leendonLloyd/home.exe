/**
 * Shared helpers. Every file in an Apps Script project shares one global
 * scope, so anything declared here is callable from any other file — and,
 * equally, a name declared twice across files is a hard error.
 *
 * Top-level constants are evaluated in file order, so never reference another
 * file's constant at the top level. Inside a function is always safe, because
 * functions only run once a request arrives.
 */

// Bump on any change to this project. Every response echoes it, so you can
// tell whether the deployment is serving the code you just pasted — editing
// the script does nothing until you publish a NEW VERSION of the web app.
const BUILD = '2026-09-22-payments-due';

// Only needed when this is a standalone project rather than one created from
// the sheet, because a standalone script has no "active" spreadsheet.
//
// Prefer Project Settings > Script properties > SPREADSHEET_ID, which keeps the
// id out of the code. Filling the constant in also works, but this file is
// committed to a public repo, so an id left here gets published.
const SPREADSHEET_ID = '';

function json_(payload) {
  const withBuild = payload.build ? payload : { ...payload, build: BUILD };
  return ContentService.createTextOutput(JSON.stringify(withBuild)).setMimeType(ContentService.MimeType.JSON);
}

function fail_(err) {
  return json_({ ok: false, build: BUILD, error: String(err && err.message ? err.message : err) });
}

function configuredId_() {
  if (SPREADSHEET_ID) return SPREADSHEET_ID;
  try {
    return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '';
  } catch (err) {
    return '';
  }
}

function book_() {
  const id = configuredId_();
  if (id) return SpreadsheetApp.openById(id);

  const active = SpreadsheetApp.getActive();
  if (active) return active;

  throw new Error(
    'This script is not attached to a spreadsheet, so there is no active one to read. ' +
    'Add the sheet id under Project Settings > Script properties as SPREADSHEET_ID ' +
    '(or set the constant in Common.gs), then redeploy a new version.'
  );
}

function tab_(name) {
  const book = book_();
  const sheet = book.getSheetByName(name);
  if (sheet) return sheet;
  const names = book.getSheets().map(function (s) { return s.getName(); }).join(', ');
  throw new Error('No tab named "' + name + '". Tabs found: ' + names);
}

function num_(value) {
  return typeof value === 'number' && !isNaN(value) ? value : null;
}

function isoDate_(value) {
  if (!(value instanceof Date) || isNaN(value.getTime())) return '';
  return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
