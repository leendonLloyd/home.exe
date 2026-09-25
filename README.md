# home.exe

Mobile-first hub for small home utilities. React + Vite, deployed to GitHub Pages.

## Apps

| Route | App | Purpose |
| --- | --- | --- |
| `/` | Hub | Entry point listing the mini apps |
| `/laundry` | Laundry tracker | Count clothes per bulk before a laundromat run |
| `/laundry/check/:id` | Check-in | Count a saved bulk back in and see what's missing |
| `/workout` | Workout tracker | Log sets against the dumbbell plan, with the training log history |
| `/bills` | Bill tracker | Track recurring bills and see what's due or overdue |
| `/todo` | To Do | Read and edit the wedding planner's TO DO LIST tab, live |
| `/payments` | Payments | Vendor balances from the PAYMENT MONITORING tab, read-only |

Routing uses `HashRouter`, so the deployed URL is `https://leendonlloyd.github.io/home.exe/#/laundry`. This avoids needing server-side rewrites on GitHub Pages.

## Laundry check-in

Selecting a bulk in **History** opens its check-in page. It reuses the counter's layout — same grouped sections, same colour/owner toggle, same cards — but the number runs the other way: it starts at what you sent and you tap **−** as each piece turns up, so a card reading `0 of 5` is fully accounted for and the header count is what's still missing.

Finishing with pieces outstanding asks first, then records the shortfall against the bulk rather than quietly closing it. History rows show the state at a glance: `3/10 back` while counting, `All back` when clean, `2 short` when closed with pieces missing.

The check state lives on the session (`returned` per line, plus `closedAt`), so it survives leaving the page, and bulks saved before this existed simply start at zero.

## Workout tracker

Two plans ship in `src/lib/workoutPlans.js` — the 15-week *Suit block* (3 upper + 1 lower) and the *Base 4-day* upper/lower. Pick a plan, pick a day, then tap a set box to log reps and the weight actually used. A box turns amber when the weight logged differs from the prescribed one, so a total that isn't like-for-like is visible at a glance.

Progression is read off the total reps across sets (`Σ`), not a one-rep max, so each exercise shows today's total against the last session's and the best on record.

- `/workout/log` — the whole training log, grouped by body part and by lift, best total per lift highlighted. Body parts with nothing logged start collapsed.
- `/workout/notes` — the prose that shipped with each plan (feeler sets, progression rules, what caps out).

Sessions 1–9 of the suit block are transcribed into `src/lib/workoutHistory.js` and stay authoritative in code; sessions you log layer on top of them, numbered from 10. Editing the seed file therefore updates existing history without an import step.

**Finish · save session** writes one history entry per exercise that has sets logged, then clears the day.

## Bill tracker

Add a bill with an amount, an icon, and a cadence (monthly, quarterly, or yearly) plus the day it's due. No amounts ship seeded — unlike laundry's clothing presets, a wrong number for rent is worse than an empty list, so `/bills` starts blank.

On load, the page computes each bill's current cycle and flags anything overdue or due within 5 days in a banner at the top — that's the whole "reminder": no push notifications, no scheduled job, just date math against whatever's open when the page loads. The cadence and due-date logic lives in `src/lib/billing.js`, independent of storage, so it's covered by its own sanity checks rather than only exercised through the UI.

Marking a bill paid records a payment for that bill's specific cycle (`billId + period`, e.g. `bill-rent__2026-09`) rather than pushing onto a list — logging the same period twice overwrites instead of duplicating. **History** in the header opens the full payment log, with Export/Import JSON in its footer.

## To Do (Google Sheet backed)

The only app here that isn't `localStorage` — it reads and writes the **TO DO LIST**
tab of the wedding planner sheet through an Apps Script web app you deploy
yourself. Setup is in [`apps-script/README.md`](apps-script/README.md).

Tasks in that sheet are named by convention — `Entourage: CORD`, `Fam: Mama Gigi
Shoes` — so the app splits on the first colon and uses the prefix as a collapsible
section, showing just the task name inside it. Writing back re-joins the two, so
the sheet's own naming is preserved.

It writes `ITEM`, `PERSON IN CHARGE`, `DUE DATE`, `PRIORITY`, `DONE` and `NOTES`
only. `DAYS LEFT` and the four summary tiles are formulas: read, never written.

Two things worth knowing:

- **The `/exec` URL is the only credential.** It lives in `localStorage` per device
  and is deliberately not committed, so the published site doesn't leak it. Anyone
  holding it can read and edit the sheet.
- **Writes can be refused on purpose.** Row numbers shift if someone edits the
  sheet directly while the app is open, so every write names the item it expects in
  that row and backs out on a mismatch rather than overwriting the wrong task.

## Payments (read-only)

Reads the **PAYMENT MONITORING** tab through the same Apps Script deployment as
To Do — connect it once under To Do and this works too. It never writes: the
`FINAL PAYMENT` column is a formula and the figures are real money.

Payment stages are discovered as whatever columns sit between `TOTAL PACKAGE`
and `FINAL PAYMENT`, so adding a `6TH PAYMENT` to the sheet needs no code
change. Vendors sort by balance, biggest first.

**The vendor table ends at the grand total.** Rows below `TOTAL AMOUNT` are
other sections — bridesmaid gifts, flower girls, prenup extras, loose transport
notes — none of which are vendors or covered by that total, so the app stops
reading there and says how many rows it left out. Without a grand total row
nothing is cut.

**Due dates need a column in the sheet.** `PAYMENT MONITORING` has no date
column, so the "due within 7 days" banner stays hidden until you add one.
Any of `DUE DATE`, `DUE`, `PAYMENT DUE`, `NEXT DUE`, `DUE ON` or `SCHEDULE`
works, anywhere in the row — the header is found by name, not position. The
banner then lists who is owed and how much, and opens to the instalment history
behind each figure. Each vendor row also carries its own due date, counting down
to it and turning red once past. Totals and below-the-line rows never appear.

**Marking a vendor paid** writes the amount into the first empty instalment
column — the ones `FINAL PAYMENT` subtracts from — so the sheet recalculates
the balance itself. Nothing ever writes to `FINAL PAYMENT`. If every instalment
column on a row is filled there is nowhere to put it, and the app says so
rather than overwriting one. Like the to-do list, the write names the vendor it
expects in that row and backs out if the sheet has moved underneath it.

**Adding a vendor** writes a new row just above the last existing one, not
below it. A grand total written as a `SUM` over the vendor rows only widens
when a row is inserted *inside* that range, so appending underneath would leave
the new vendor out of the sheet's own total — the number the app shows as the
headline. The row below is copied first so the new one inherits the
`FINAL PAYMENT` formula and lets the sheet work the balance out. The reply says
whether the grand total actually moved, and the app warns if it didn't.

Only the vendor name is required. Down payment and 1st payment are on the form;
2nd through 5th sit behind a toggle. Instalments left blank are omitted
entirely rather than written as `0`, which would read as "paid nothing" instead
of "not yet due".

**Nothing about money is added up here.** `TOTAL PACKAGE` and `FINAL PAYMENT`
come straight from the sheet, and paid is `package − balance` — the inverse of
the sheet's own `FINAL PAYMENT` formula, so it always agrees with it. Summing
the instalment columns does not: three rows are settled on the
`Soiree Events Place (Total Cost)` roll-up and never had their own columns
filled in, so adding them up called a settled line part-paid. The instalments
are still listed on a vendor's detail, with a note where they fall short of
what the sheet says was paid.

**The headline is read, not computed.** The tab mixes vendor lines, roll-ups
(`Soiree Events Place (Total Cost)`) and the sheet's own totals (`TOTAL
AMOUNT`), so adding every row up counts some twice — against the live sheet
that gave 1,282,920 outstanding where the sheet itself says 618,960. A row
whose name starts with `TOTAL` / `GRAND TOTAL` is treated as the sheet's answer
and used directly, and those rows are kept out of the vendor list below. Only
when no such row exists does the app sum the vendors, and there you can tap one
and **Exclude from totals** to drop roll-ups or superseded quotes.

## Run

```bash
npm install
npm run dev
```

## Data storage

GitHub Pages is static hosting — the browser cannot write to a JSON file inside the repo. State is kept as a single JSON document in `localStorage` under `home.exe:laundry:v1`:

```json
{
  "owners": [{ "id": "own-me", "name": "Me", "color": "#7b8cff" }],
  "items": [{ "id": "itm-1", "name": "T-Shirt", "icon": "tshirt", "ownerId": "own-me", "colorType": "whites" }],
  "counts": { "itm-1": 3 },
  "sessions": [{ "id": "ses-1", "date": "2026-09-04", "note": "", "total": 3, "lines": [] }]
}
```

History → **Export JSON** downloads that document; **Import JSON** restores it. Commit an exported file to the repo if you want a versioned snapshot.

The workout tracker keeps its own document under `home.exe:workout:v1`, holding only the selected plan, the sets in progress, and the sessions you have logged — the plan and the seeded history live in code. Export and Import sit in the tab bar on `/workout/log`.

The bill tracker keeps its own document under `home.exe:bills:v1`: the bills you've added and every payment record, keyed by `billId + period` rather than a random id. That key shape is deliberate — it's the same document address a Firestore collection would use (`payments/{billId}__{period}`), so "mark paid" is already a targeted upsert rather than a whole-document rewrite.

If you later want real persistence across devices, swap `src/lib/store.js` (or `src/lib/workoutStore.js` / `src/lib/billsStore.js`) for a hosted key-value backend — the rest of the app only talks to the hook. This matters more once two people share a browser-per-device: `localStorage` is per-device, so laundry and bills counts don't sync between phones. Firestore is the planned target — its free tier covers this comfortably, and the store hooks above are already shaped for targeted writes (bump a count, mark a period paid) rather than whole-blob rewrites, which is what makes that swap safe instead of a rewrite.

## Deploy

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes `dist`. Set **Settings → Pages → Source** to *GitHub Actions* once.
