/**
 * GUEST LIST tab — entourage listing and RSVP.
 *
 * Merged in from the standalone entourage project. The query shapes
 * (?list=entourage, ?rsvp=lookup, ?rsvp=submit) and the {status, message}
 * response format are kept exactly as they were, because the live RSVP form
 * and entourage page already point at this URL.
 *
 * The guest list is one row per person, data from row 4. Invitations are the
 * blocks of rows between BLANK rows, so searching any member pulls up the
 * whole block and one person can RSVP for everyone. Writes touch RSVP
 * RESPONSE (col G) and NOTES (col H) only.
 */

const GUESTS_TAB = 'GUEST LIST';
const LOG_TAB = 'RSVP_Log';
const DATA_START = 4; // first data row; rows 1-3 are title/header

// 1-based column indexes in the GUEST LIST tab.
const COL = { NO: 1, NAME: 2, RELATIONSHIP: 3, TABLE: 4, ROLE: 5, SENT: 6, RESPONSE: 7, NOTES: 8 };

/**
 * Returns a response for the entourage/RSVP query shapes, or null when the
 * request isn't one of theirs so the main router can carry on.
 */
function guestsRoute_(p) {
  if (String(p.list || '').toLowerCase() === 'entourage') return json_(getEntourage());

  const action = String(p.rsvp || '').toLowerCase();
  if (action !== 'lookup' && action !== 'submit') return null;

  try {
    if (action === 'lookup') return json_(lookup_(p.name || ''));
    return json_(submit_(p));
  } catch (err) {
    // The form reads {status, message}; keep that shape rather than the
    // {ok, error} one the rest of this project uses.
    return json_({ status: 'error', message: String(err) });
  }
}

function getEntourage() {
  const sheet = guestsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < DATA_START) return { updated: new Date().toISOString(), people: [] };
  const values = sheet.getRange(DATA_START, 1, lastRow - (DATA_START - 1), 8).getValues();
  const people = values
    .map((r) => ({
      name: cleanName_(r[COL.NAME - 1]),
      relationship: String(r[COL.RELATIONSHIP - 1] || '').trim(),
      table: String(r[COL.TABLE - 1] || '').trim(),
      role: String(r[COL.ROLE - 1] || '').trim(),
    }))
    .filter((p) => p.name && p.role)
    .map((p) => ({ ...p, side: sideOf_(p.relationship) }));
  return { updated: new Date().toISOString(), people };
}

/**
 * Finds the invitation block(s) a typed name belongs to. Match is by name-word
 * subset: every word typed must appear in a member's name, ignoring order,
 * case, accents and titles — so a first name alone pulls up the whole block.
 */
function lookup_(rawName) {
  const inTokens = nameTokens_(rawName);
  if (!inTokens.length) return { status: 'success', groups: [] };

  const groups = buildGroups_(guestsSheet_().getDataRange().getValues());
  const hits = groups.filter((g) => g.some((m) => subsetOf_(inTokens, m.tokens)));

  return {
    status: 'success',
    groups: hits.map((g) => ({
      headId: g[0].id,
      seats: g.length,
      members: g.map((m) => ({ id: m.id, name: m.name, role: m.role, response: m.response })),
    })),
  };
}

/** Writes yes/no per member (col G), and mobile + message to the head's Notes (col H). */
function submit_(p) {
  const sheet = guestsSheet_();
  const members = String(p.m || '')
    .split(';')
    .filter(String)
    .map((s) => {
      const a = s.split(':');
      return { id: Number(a[0]), resp: a[1] === 'yes' ? 'yes' : 'no' };
    });
  if (!members.length) return { status: 'error', message: 'No guests were selected.' };

  const mobile = String(p.mobile || '').trim();
  if (!mobile) return { status: 'error', message: 'A mobile number is required.' };

  const lastRow = sheet.getLastRow();
  let yes = 0;
  let no = 0;
  members.forEach((m) => {
    if (m.id >= DATA_START && m.id <= lastRow) {
      const name = String(sheet.getRange(m.id, COL.NAME, 1, 1).getValue() || '').trim();
      if (!name) return; // never write to a blank separator row
      sheet.getRange(m.id, COL.RESPONSE, 1, 1).setValue(m.resp);
      if (m.resp === 'yes') yes += 1;
      else no += 1;
    }
  });

  const head = Number(p.head) || members[0].id;
  const headName = String(sheet.getRange(head, COL.NAME, 1, 1).getValue() || '').trim();
  const note = 'RSVP · ' + mobile + (p.message ? ' · ' + String(p.message).trim() : '');
  sheet.getRange(head, COL.NOTES, 1, 1).setValue(note);

  logSheet_().appendRow([new Date(), headName, mobile, yes, no, String(p.message || '').trim()]);

  return { status: 'success', attending: yes, declined: no };
}

/**
 * Groups the sheet into invitations. Family (Groom/Bride side) invitations are
 * blocks of consecutive rows between blank rows. "Mutual" guests are not
 * grouped — each is its own single invitation.
 */
function buildGroups_(rows) {
  const groups = [];
  let fam = null;
  const closeFam = () => {
    if (fam) {
      groups.push(fam);
      fam = null;
    }
  };
  for (let i = DATA_START - 1; i < rows.length; i += 1) {
    const raw = String(rows[i][COL.NAME - 1] || '').trim();
    if (!raw) {
      closeFam(); // blank row ends a family block
      continue;
    }
    const m = {
      id: i + 1, // 1-based sheet row
      name: cleanName_(raw),
      tokens: nameTokens_(raw),
      role: String(rows[i][COL.ROLE - 1] || '').trim(),
      response: String(rows[i][COL.RESPONSE - 1] || '').trim(),
    };
    if (sideOf_(rows[i][COL.RELATIONSHIP - 1]) === 'mutual') {
      closeFam(); // mutual guest = individual invitation
      groups.push([m]);
    } else {
      if (!fam) fam = [];
      fam.push(m);
    }
  }
  closeFam();
  return groups;
}

function sideOf_(relationship) {
  const r = String(relationship || '');
  return /groom/i.test(r) ? 'groom' : /bride/i.test(r) ? 'bride' : 'mutual';
}

function guestsSheet_() {
  return tab_(GUESTS_TAB);
}

function logSheet_() {
  const ss = book_();
  let s = ss.getSheetByName(LOG_TAB);
  if (!s) {
    s = ss.insertSheet(LOG_TAB);
    s.appendRow(['Timestamp', 'Invitation (head)', 'Mobile', 'Attending', 'Declined', 'Message']);
  }
  return s;
}

/** Strips the sheet's trailing name markers (^, *) for display and matching. */
function cleanName_(name) {
  return String(name || '').trim().replace(/\s*[\^*]+\s*$/, '');
}

/** Normalises a name to comparable word tokens, ignoring titles/case/accents. */
function nameTokens_(name) {
  const s = String(name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // combining marks, escaped so copy-paste can't mangle them
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\b(mr|mrs|ms|miss|sir|madam|dr|doctor|engr|atty|rev|fr|hon|prof|sr|jr|iii|iv|ii)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s ? s.split(' ') : [];
}

/** True if every token in `a` also appears in `b`. */
function subsetOf_(a, b) {
  return a.length > 0 && a.every((t) => b.indexOf(t) !== -1);
}
