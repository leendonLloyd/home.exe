# TO DO LIST bridge

Lets `/todo` in home.exe read and edit the **TO DO LIST** tab of the wedding
planner sheet.

## Deploy

1. Open the sheet → **Extensions → Apps Script**.
2. Replace `Code.gs` with the contents of [`TodoList.gs`](TodoList.gs). If the
   tab isn't named exactly `TO DO LIST`, change `SHEET_NAME` at the top.

   **If you made a standalone script** rather than opening it from the sheet,
   `SpreadsheetApp.getActive()` has nothing to return and every call fails with
   *"not attached to a spreadsheet"*. Tell it which sheet to open:

   **Project Settings → Script properties → Add** `SPREADSHEET_ID` = the id from
   your sheet's URL, the part between `/d/` and `/edit`.

   Script properties live in the Apps Script project, not in the code, so the id
   never lands in this public repo. The `SPREADSHEET_ID` constant at the top of
   the file works too and takes precedence — but anything you put there gets
   committed and published, so prefer the property.
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Authorise when prompted (it will warn the app is unverified — that's normal
   for your own script; continue).
5. Copy the `/exec` URL.
6. In home.exe → **To Do → Connect**, paste the URL.

> **Who has access must be "Anyone", not "Anyone with a Google account."** The
> second one makes the browser request fail on Google's sign-in redirect, which
> surfaces as an opaque CORS error rather than a helpful message.

## Redeploying after a change — the part that catches everyone

Editing the code changes nothing on its own. The web app serves a **pinned
version**, so you must publish a new one:

**Deploy → Manage deployments → ✏️ (pencil) → Version → `New version` → Deploy**

Use that, not *New deployment* — *New deployment* mints a **different URL**,
leaving the old one serving the old code, and every device then has to be
re-pasted.

To check which code is actually live, open your `/exec` URL with `?view=ping`:

```json
{"ok":true,"build":"2026-09-22-payments","tabs":["WEDDING DETAILS","PAYMENT MONITORING","TO DO LIST", ...]}
```

Every response carries `build`. If it doesn't match the `BUILD` constant at the
top of `TodoList.gs`, the deployment is stale — you edited the code but didn't
publish a new version, or you're pointing at a different deployment. `?view=ping`
also lists the tab names it can see, which settles any "no tab named …" error.

## What it writes

Only `ITEM`, `PERSON IN CHARGE`, `DUE DATE`, `PRIORITY`, `DONE` and `NOTES`.

`DAYS LEFT` and the four summary tiles are formulas, so the script reads them
and never writes them. Adding a task prefers a blank row already inside the
table (those keep the checkbox, the priority dropdown and the `DAYS LEFT`
formula); only if there isn't one does it grow the table, copying the last row
first so the new row inherits them.

The layout is found at runtime by scanning for the header row containing
`ITEM`, so moving a column or inserting rows above the table is safe. Renaming
a column header is not — update `FIELDS` if you do.

## Why writes can be refused

Row numbers shift if anyone inserts or deletes rows while the app is open, so
every write names the item it expects to find in that row. If it doesn't match,
the write is refused and the app tells you to reload. That is the intended
behaviour, not a bug — it's what stops an edit landing on the wrong task.

## A note on access

A web app deployed to "Anyone" is reachable by anyone who has the URL — there
is no sign-in. Treat the `/exec` URL as a password: home.exe keeps it in
`localStorage` on each device rather than in the repo, so it isn't published
with the site. Each device (and each person) pastes it once.

If it leaks, **Manage deployments → Archive** the old deployment and create a
new one; the old URL dies with it.
