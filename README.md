# home.exe

Mobile-first hub for small home utilities. React + Vite, deployed to GitHub Pages.

## Apps

| Route | App | Purpose |
| --- | --- | --- |
| `/` | Hub | Entry point listing the mini apps |
| `/laundry` | Laundry tracker | Count clothes per bulk before a laundromat run |

Routing uses `HashRouter`, so the deployed URL is `https://leendonlloyd.github.io/home.exe/#/laundry`. This avoids needing server-side rewrites on GitHub Pages.

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

If you later want real persistence across devices, swap `src/lib/store.js` for a hosted key-value backend (Supabase, Firebase, or a Gist-backed API) — the rest of the app only talks to the hook.

## Deploy

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes `dist`. Set **Settings → Pages → Source** to *GitHub Actions* once.
