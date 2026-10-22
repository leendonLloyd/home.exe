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
 * Seating: everyone who has not declined, with whatever is in TABLE NO.
 * (col D). The wedding site's seat plan renders that column directly, so the
 * sheet stays the source of truth — edit a cell and the page follows.
 */
function readSeats_() {
  const sheet = guestsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < DATA_START) return { updated: new Date().toISOString(), guests: [] };
  const values = sheet.getRange(DATA_START, 1, lastRow - (DATA_START - 1), 8).getValues();
  const guests = values
    .map((r) => ({
      name: cleanName_(r[COL.NAME - 1]),
      relationship: String(r[COL.RELATIONSHIP - 1] || '').trim(),
      table: String(r[COL.TABLE - 1] || '').trim(),
      vip: String(r[COL.NAME - 1] || '').trim().slice(-1) === '^',
      response: String(r[COL.RESPONSE - 1] || '').trim().toLowerCase(),
    }))
    .filter((g) => g.name && g.response !== 'no');
  return { updated: new Date().toISOString(), guests };
}

/**
 * One-off backfill: writes the generated seat plan into TABLE NO. (col D).
 * Run once from the editor (Run > applySeatPlan), then edit column D by hand.
 * Matches on name only; never clears a cell it cannot match, so a guest added
 * after the plan was generated keeps whatever is already there.
 */
function applySeatPlan() {
  const PLAN = {
    "1 babysitter dodge": "TABLE 4",
    "2 babysitter dodge": "TABLE 4",
    "abonador mike": "TABLE 5",
    "abris ayrton john": "TABLE 6",
    "actorani cahuya": "TABLE 6",
    "adela lara": "VIP 1",
    "adelina magbanua": "TABLE 12",
    "aduna vincent": "TABLE 5",
    "agabon janessa": "TABLE 11",
    "agabon rogelio": "TABLE 11",
    "aguihap eve jasmine": "TABLE 1",
    "aguihap ivy jarmaine": "TABLE 1",
    "aguihap jenny rose": "TABLE 1",
    "aguihap john": "TABLE 1",
    "aguihap justine vnz": "TABLE 1",
    "aj b dhustine lobrido": "TABLE 8",
    "alimoot marian mi": "TABLE 6",
    "aliyah calunsag": "TABLE 10",
    "alyssa blaza": "TABLE 8",
    "amante analie": "TABLE 11",
    "andrea dimamay karriel": "TABLE 4",
    "angelie morales": "TABLE 11",
    "ann jenny razonales": "TABLE 12",
    "ann mary sulmaca": "VIP 2",
    "annabelle moscoso": "TABLE 4",
    "annabelle rojo": "VIP 2",
    "anne buno judy": "TABLE 6",
    "anthony legaspi mark": "TABLE 7",
    "anthony romeo tubianosa": "VIP 1",
    "arimas gabriel leo": "TABLE 9",
    "arimas khaeleigh": "TABLE 9",
    "arimas leo": "TABLE 9",
    "arimas rutchelie": "TABLE 9",
    "arlu dominic perlas": "TABLE 3",
    "austria dimamay goefrey": "TABLE 3",
    "austria dimamay lenie": "TABLE 3",
    "auxillador avitus dofelis": "TABLE 4",
    "baluya lorenz": "TABLE 5",
    "bangcaya dimamay nenita": "TABLE 1",
    "beth pangan": "TABLE 12",
    "bill jun sulmaca": "VIP 2",
    "bolneo steline": "TABLE 13",
    "boyet rojo": "VIP 2",
    "brent jeremy rojo": "VIP 2",
    "brian verdadero": "TABLE 3",
    "brize nathaniel verdadero": "TABLE 3",
    "calunsag colt": "TABLE 10",
    "calunsag pinky": "TABLE 10",
    "capua christopher": "TABLE 13",
    "carlito lobrido": "TABLE 9",
    "caspillo donato": "VIP 2",
    "caspillo felicitas": "VIP 2",
    "castillo chavez edmund very": "VIP 2",
    "ceniza june patrick": "TABLE 5",
    "cenon vergara": "VIP 2",
    "christiana gimenez marie": "TABLE 5",
    "christine sulmaca": "TABLE 10",
    "claire young": "TABLE 6",
    "condrado pangan": "TABLE 12",
    "cruz dela xian": "TABLE 11",
    "cumla james tyrone": "TABLE 3",
    "dainn evangelio izellah": "TABLE 13",
    "dale rhylvin tinador": "TABLE 5",
    "dalumpines esther labrague": "VIP 1",
    "dalumpines gerardo": "VIP 1",
    "daniella lobrido": "TABLE 7",
    "de gerdalym guzman": "TABLE 2",
    "de grano mae via": "TABLE 11",
    "de grano verline": "TABLE 11",
    "de guzman gwen michaela": "TABLE 2",
    "de guzman michael": "TABLE 2",
    "de guzman perlita": "TABLE 11",
    "dee fabilla lysa": "TABLE 5",
    "desiree legaspi": "TABLE 7",
    "deviza edwin": "TABLE 5",
    "dexter john vergara": "TABLE 8",
    "dianara lobrido": "TABLE 7",
    "dimamay edna erta": "TABLE 1",
    "dimamay goefrey": "TABLE 3",
    "dimamay grace melody": "VIP 1",
    "dimamay jimiswil": "TABLE 1",
    "dimamay kaiden": "TABLE 2",
    "dimamay kailah": "TABLE 4",
    "dimamay karl": "TABLE 2",
    "dimamay karmila": "TABLE 2",
    "dimamay keishaun": "TABLE 2",
    "dimamay kristian": "TABLE 2",
    "dimamay kristina": "TABLE 2",
    "dimamay l leo": "VIP 1",
    "dimamay leenie lou": "VIP 1",
    "dimamay lenn leonard": "VIP 1",
    "dimamay leonardo": "VIP 1",
    "dimamay meriel": "TABLE 4",
    "dimamay nena pacheco": "TABLE 1",
    "dimamay o": "VIP 1",
    "dimamay oshea": "TABLE 2",
    "dimamay rosie": "VIP 1",
    "dofelis honey joyce": "TABLE 4",
    "dolorica manuel": "TABLE 4",
    "dylan lobrido": "TABLE 9",
    "edna gindap labrague": "VIP 1",
    "edna morales": "TABLE 11",
    "edwin lobrido": "TABLE 7",
    "elma vergara": "VIP 2",
    "elsie labrague moscoso": "VIP 1",
    "elvie razonales": "TABLE 12",
    "erma sulmaca": "VIP 2",
    "ernesto lobrido": "TABLE 8",
    "ernie john lobrido": "TABLE 8",
    "erta stevien": "TABLE 1",
    "esparagoza shenry": "TABLE 3",
    "estelito petate": "TABLE 9",
    "esteron kim": "TABLE 11",
    "fher leongson noah": "TABLE 5",
    "gabrielle vergara": "TABLE 8",
    "gayares rosmarie": "TABLE 13",
    "gerlie sulmaca": "TABLE 12",
    "gerry laurent tarroja": "TABLE 5",
    "gindap wilnah": "TABLE 3",
    "grace ianne lim": "VIP 1",
    "graceky sulmaca": "TABLE 10",
    "gualberto javier": "VIP 1",
    "gwendolyn mary tubianosa": "VIP 1",
    "henry sulmaca": "TABLE 10",
    "hermie sulmaca": "VIP 2",
    "inigo legaspi": "TABLE 7",
    "isabelle kiara sulmaca": "TABLE 12",
    "jane publico zan": "TABLE 6",
    "jean ray sulmaca": "TABLE 10",
    "jenifer lobrido": "TABLE 9",
    "jezza villanueva": "TABLE 6",
    "joana mariel vergara": "TABLE 10",
    "john morales paul": "TABLE 12",
    "jomir morales": "TABLE 12",
    "jonas vergara": "TABLE 10",
    "jonathan sevegan": "VIP 2",
    "joshua kyll sulmaca": "VIP 2",
    "judy verdadero": "TABLE 3",
    "kross lobrido": "TABLE 7",
    "lababit meriam yumen": "VIP 1",
    "lababit rhodel": "VIP 1",
    "labanon mirabel": "VIP 1",
    "labrague nena sister": "VIP 1",
    "lobrido rechilda": "TABLE 7",
    "lobrido samara": "TABLE 9",
    "magbanua mercedita": "VIP 2",
    "manuel sulmaca": "VIP 2",
    "megan veloso": "TABLE 6",
    "michaela vergara": "TABLE 8",
    "mirobela morales": "TABLE 12",
    "natasha vergara": "TABLE 8",
    "nathaniel vergara": "TABLE 8",
    "pagarita ray saimon": "TABLE 7",
    "pagarita salvacion": "TABLE 7",
    "paul young": "TABLE 6",
    "petate veronica": "TABLE 9",
    "renjan solis": "TABLE 6",
    "rizalina villarta": "TABLE 13",
    "sulmaca vanjay": "TABLE 10",
    "tabea vergara": "TABLE 8"
};
  const sheet = guestsSheet_();
  const rows = sheet.getLastRow() - (DATA_START - 1);
  const names = sheet.getRange(DATA_START, COL.NAME, rows, 1).getValues();
  const tables = sheet.getRange(DATA_START, COL.TABLE, rows, 1).getValues();
  const missed = [];
  let filled = 0;
  for (let i = 0; i < names.length; i++) {
    const raw = String(names[i][0] || '').trim();
    if (!raw) continue;
    const key = nameTokens_(raw).slice().sort().join(' ');
    if (PLAN[key]) {
      tables[i][0] = PLAN[key];
      filled++;
    } else {
      missed.push(raw);
    }
  }
  sheet.getRange(DATA_START, COL.TABLE, rows, 1).setValues(tables);
  Logger.log('Seated ' + filled + ' guests. Left untouched: ' + (missed.join(', ') || 'none'));
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
    .replace(/[\u0300-\u036f]/g, '') // combining marks, escaped so copy-paste can't mangle them
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
