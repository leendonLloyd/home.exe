# home.exe

Mobile-first hub for small home utilities. React + Vite, deployed to GitHub Pages.

## Apps

| Route | App | Purpose |
| --- | --- | --- |
| `/` | Hub | Entry point listing the mini apps |
| `/laundry` | Laundry tracker | Count clothes per bulk before a laundromat run |
| `/workout` | Workout tracker | Log sets against the dumbbell plan, with the training log history |

Routing uses `HashRouter`, so the deployed URL is `https://leendonlloyd.github.io/home.exe/#/laundry`. This avoids needing server-side rewrites on GitHub Pages.

## Workout tracker

Two plans ship in `src/lib/workoutPlans.js` — the 15-week *Suit block* (3 upper + 1 lower) and the *Base 4-day* upper/lower. Pick a plan, pick a day, then tap a set box to log reps and the weight actually used. A box turns amber when the weight logged differs from the prescribed one, so a total that isn't like-for-like is visible at a glance.

Progression is read off the total reps across sets (`Σ`), not a one-rep max, so each exercise shows today's total against the last session's and the best on record.

- `/workout/log` — the whole training log, grouped by body part and by lift, best total per lift highlighted. Body parts with nothing logged start collapsed.
- `/workout/notes` — the prose that shipped with each plan (feeler sets, progression rules, what caps out).

Sessions 1–9 of the suit block are transcribed into `src/lib/workoutHistory.js` and stay authoritative in code; sessions you log layer on top of them, numbered from 10. Editing the seed file therefore updates existing history without an import step.

**Finish · save session** writes one history entry per exercise that has sets logged, then clears the day.

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

If you later want real persistence across devices, swap `src/lib/store.js` (or `src/lib/workoutStore.js`) for a hosted key-value backend (Supabase, Firebase, or a Gist-backed API) — the rest of the app only talks to the hook.

## Deploy

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes `dist`. Set **Settings → Pages → Source** to *GitHub Actions* once.
