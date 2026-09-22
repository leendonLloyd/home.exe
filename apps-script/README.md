# Wedding planner bridge

Lets home.exe read and edit tabs of the wedding planner sheet. One Apps Script
project, one deployment, one URL — several features, one file each.

## Files

| File | What it owns |
| --- | --- |
| `Common.gs` | `BUILD`, `SPREADSHEET_ID`, opening the book, `json_`, shared helpers |
| `Main.gs` | The project's only `doGet` / `doPost`, routing to everything else |
| `Todo.gs` | `TO DO LIST` tab — read and write |
| `Payments.gs` | `PAYMENT MONITORING` tab — read only |
| `Guests.gs` | `GUEST LIST` tab — entourage listing and RSVP |

Paste each as a separate file in the Apps Script editor (**+ → Script**, name it
without the `.gs`). Order in the editor doesn't matter.

## How multiple scripts share one project

Every file shares **one global scope** — there are no imports, and any function
or constant is visible everywhere. That makes combining separate scripts easy,
with three rules:

1. **Exactly one `doGet` and one `doPost` per project.** They live in `Main.gs`
   and route by `?view=` and `body.action`. A second file declaring either will
   collide. Merging a standalone script means moving its body into a function
   and adding a line to the router.
2. **Top-level names must be unique across all files.** Two files declaring
   `const SHEET_ID` is a hard error. Prefix per-feature constants
   (`PAYMENTS_SHEET`, not `SHEET`).
3. **Never reference another file's constant at the top level.** Constants
   initialise in file order, so a top-level read can run before the other file
   loads. Inside a function is always safe — functions only run once a request
   arrives.

## Entourage and RSVP

`Guests.gs` was a standalone project before. Its query shapes are unchanged,
because the live RSVP form and entourage page already call them:

| Request | Does |
| --- | --- |
| `?list=entourage` | Everyone with a role, with `side` derived from relationship |
| `?rsvp=lookup&name=` | Finds the invitation block(s) a name belongs to |
| `?rsvp=submit&m=&mobile=&head=&message=` | Writes responses and logs to `RSVP_Log` |

Those replies keep their original `{status, message}` shape rather than the
`{ok, error}` the rest of this project uses, so nothing calling them needs
changing. The one behaviour that did change: a bare call with no parameters
used to return the text `OK` and now returns the to-do list, because home.exe
reads it that way. Nothing was calling it without parameters.

`SHEET_ID` is gone — it used `SpreadsheetApp.openById` with the id hardcoded.
It now goes through the shared `book_()`, so **set `SPREADSHEET_ID` under
Project Settings → Script properties before deploying**, or every endpoint
including the live RSVP will fail.

## Adding a feature

Write `Feature.gs` with its own constants and a `readFeature_()`, then add one
line to each router in `Main.gs`:

```js
if (view === 'feature') return json_({ ok: true, ...readFeature_() });
```

and register it in `VIEWS_` so `?view=ping` advertises it. For writes, namespace
the action as `feature.action` — the bare `update` / `add` / `remove` belong to
the to-do list for backwards compatibility.

## Deploy

1. Open the sheet → **Extensions → Apps Script**.
2. Create one file per `.gs` above and paste its contents in. If a tab isn't
   named exactly as expected, change that file's `*_SHEET` constant.

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

Use that in preference to *New deployment*, which mints a **different URL** and
means re-pasting on every device.

If Edit → New version doesn't take — the build stamp below still shows the old
value after deploying — just do **Deploy → New deployment** instead. It always
publishes current code; you only pay for it by having to reconnect each device
with the new URL.

To check which code is actually live, open your `/exec` URL with `?view=ping`:

```json
{"ok":true,"build":"2026-09-22-payments","tabs":["WEDDING DETAILS","PAYMENT MONITORING","TO DO LIST", ...]}
```

Every response carries `build`. If it doesn't match the `BUILD` constant at the
top of `Common.gs`, the deployment is stale — you edited the code but didn't
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
a column header is not — update `FIELDS` in `Todo.gs` if you do.

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
