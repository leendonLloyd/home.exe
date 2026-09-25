# Firestore setup

Laundry, Workout and Bills move here; To Do, Payments and Guests stay on the
planner sheet, because those are a spreadsheet two people already edit directly.

## What Claude needs from you

1. **The web config.** Firebase console → Project settings → General → Your apps
   → Web app (create one if there isn't one) → the `firebaseConfig` object.

   It is safe to paste and safe to commit. Unlike the Apps Script `/exec` URL,
   a Firebase web config is public by design — `firestore.rules` is what gates
   access, not secrecy of the key.

2. **Both Gmail addresses**, to go in the rules below.

3. **Confirmation that Google sign-in is on**: Build → Authentication → Sign-in
   method → Google → Enable.

## Before anything will work

Firestore created in production mode denies everything by default, so the rules
must be published first.

1. Put the two addresses into `household()` in [`firestore.rules`](firestore.rules).
2. Firebase console → Build → Firestore Database → Rules → paste → **Publish**.

Without this, a correctly configured app still reads and writes nothing, and
the errors say "Missing or insufficient permissions" rather than anything about
the rules not being published.

## Shape of the data

```
households/home/
  laundry/owners/{ownerId}
  laundry/items/{itemId}
  laundry/counts            one doc, a field per item, so increment() applies
  laundry/sessions/{sessionId}
  workout/entries/{entryId}
  workout/current           in-progress sets and the selected plan
  bills/bills/{billId}
  bills/payments/{billId__period}
```

Counts live as fields on a single document so two people counting the same pile
each send `increment(1)` rather than a whole-object write, which is the case
`localStorage` could never get right.

## Migrating what is already there

Existing data sits in `localStorage` on each device: `home.exe:laundry:v1`,
`home.exe:workout:v1`, `home.exe:bills:v1` — including the transcribed workout
history and every saved laundry bulk.

Sign-in alone must not push it. Both phones hold their own copy, and two silent
uploads would merge into duplicates. Import is a deliberate one-per-device
action, and the app says what it is about to send before sending it.
