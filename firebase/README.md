# Firestore setup

Laundry, Workout and Bills move here; To Do, Payments and Guests stay on the
planner sheet, because those are a spreadsheet two people already edit directly.

## Console checklist

All of this is in the Firebase console, in this order.

**1. Create the database.** Build → Firestore Database → Create database →
**Production mode** → location **asia-southeast1 (Singapore)**, the closest
region.

> The location is permanent. Everything else here can be changed later; this
> cannot, short of making a new project.

**2. Turn on Google sign-in.** Build → Authentication → Get started → Sign-in
method → Google → Enable. It asks for a project support email — your own
address is fine → Save.

**3. Allow the deployed site to sign in.** Authentication → Settings →
Authorized domains → Add domain → `leendonlloyd.github.io`.

> Easy to miss, and nothing hints at it: sign-in works on `localhost`, which is
> authorised by default, then fails only on the real site with
> `auth/unauthorized-domain`.

**4. Register a web app.** Project settings → General → Your apps → the `</>`
icon → any nickname → Register app. Copy the `firebaseConfig` block it shows.
Skip the SDK snippets it offers; that part is handled here.

**5. Publish the rules.** Put both Google addresses into `household()` in
[`firestore.rules`](firestore.rules), then Firestore Database → Rules → paste
the whole file → **Publish**.

> Production mode denies everything until this is done. Skipping it leaves a
> correctly built app failing with "Missing or insufficient permissions" and
> nothing pointing at the cause.

**6. Set the config as repository variables.** GitHub → Settings → Secrets and
variables → Actions → **Variables** tab → New repository variable, one per line
in [`.env.example`](../.env.example). The deploy workflow passes them to the
build; locally, copy that file to `.env.local` and fill it in.

Variables rather than secrets on purpose: a Firebase web config is public by
design, Vite inlines it into the bundle, and GitHub Pages serves that bundle
publicly — so the values are readable from the deployed site whatever is done
with them. Keeping them out of the repo is config hygiene, not secrecy. The
rules are what gate the data.

## Shape of the data

Firestore paths alternate collection and document, so each app gets one
collection under the household document and keeps its data as named documents
inside it. One listener then covers a whole app.

```
households/home/laundry/config      owners and clothing types
households/home/laundry/counts      one field per item id
households/home/laundry/bulk-<id>   one per saved bulk

households/home/bills/bill-<id>     one per bill
households/home/bills/pay-<billId>__<period>

households/home/grocery/item-<id>   the standing list
households/home/grocery/cart        one field per item, how many are wanted
households/home/grocery/got         what is already in the trolley
households/home/grocery/trip-<id>   one per finished shop

households/home/workout/current     chosen plan and today's part-done sets
households/home/workout/entry-<id>  one per exercise of a finished session
```

`counts` and `cart` are single documents with a field per item so a tap sends
`increment(1)` rather than rewriting a document the other phone is also
editing. That is the case localStorage could never get right: two people adding
to the same list at once.

Everything else is a document per record, so two phones editing different bills
or different items never touch the same one.

Workout's seeded history stays in `workoutHistory.js` rather than Firestore —
it is a transcription of a paper log, so editing the file is how it gets
corrected. Logged sessions layer on top, numbered on from where the seed ends.

## Migrating what is already there

Existing data sits in `localStorage` on each device: `home.exe:laundry:v1`,
`home.exe:workout:v1`, `home.exe:bills:v1` — including the transcribed workout
history and every saved laundry bulk.

Sign-in alone must not push it. Both phones hold their own copy, and two silent
uploads would merge into duplicates. Import is a deliberate one-per-device
action, and the app says what it is about to send before sending it.
