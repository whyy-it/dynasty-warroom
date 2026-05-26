# Dynasty War Room

A live dynasty fantasy football command center. Composite player rankings, Sleeper league sync, and (eventually) trade analyzer, roster review, and waiver tools.

Built for a 10-team superflex PPR dynasty league. Adapt as needed.

## Live site
Once deployed to GitHub Pages: `https://<your-username>.github.io/dynasty-warroom/`

## Quick start

### 1. Create the GitHub repo

1. On GitHub, create a new public repo named `dynasty-warroom` (or any name you like — adjust paths accordingly).
2. Drop all the files in this folder into the repo root.
3. Commit and push.

### 2. Enable GitHub Pages

1. In the repo, go to **Settings → Pages**.
2. Source: **Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)**.
4. Save. Wait ~30 seconds.
5. Your site is live at `https://<your-username>.github.io/<repo-name>/`.

### 3. Configure your league

1. Open the site, tap **⚙** in the top right.
2. Paste your Sleeper league ID (from the URL on sleeper.com).
3. Optionally enter your roster ID (1-10) so your picks auto-mark as "mine".
4. Toggle **Auto-poll** for live draft tracking.
5. Tap **Save**.

### 4. Run locally (optional)

Open `index.html` in a browser — **but** the `fetch()` calls for `data/rankings-2026.json` may fail under `file://` protocol due to CORS. Use a local server:

```bash
cd dynasty-warroom
python3 -m http.server 8000
# Then open http://localhost:8000
```

Or with Node:
```bash
npx serve .
```

## Repo layout

```
dynasty-warroom/
├── index.html               # SPA shell — single entry point
├── .nojekyll                # Tells GitHub Pages to skip Jekyll
├── README.md
├── css/
│   └── styles.css           # All styles
├── data/
│   └── rankings-2026.json   # 336 players + source metadata
├── js/
│   ├── app.js               # App shell + router
│   ├── state.js             # localStorage persistence layer
│   ├── data.js              # Rankings loader
│   ├── sleeper.js           # Sleeper API client
│   └── views/
│       └── draft-board.js   # Draft board view (the main UI)
└── docs/
    └── DEVELOPMENT.md       # How to add features
```

## Tech notes

- **Vanilla JS with ES modules** — no build step, no npm install, no framework.
- **GitHub Pages serves static files only** — all API calls happen in the browser.
- **No backend / no API keys** — Sleeper's public API is open with no auth.
- **All state is local** — `localStorage` in your browser. Per-device. Clear browser data → app resets.

## Updating rankings

Edit `data/rankings-2026.json` directly. The schema is:

```json
{
  "version": "2026.05.26",
  "updated": "2026-05-26",
  "format": "10-team-superflex-ppr",
  "sources": {
    "bb": { "name": "...", "date": "...", "url": "..." },
    "sp": { "name": "...", "date": "...", "url": "..." },
    "pv": { "name": "...", "date": "...", "url": null }
  },
  "players": [
    {
      "r": 1,                              // composite rank
      "n": "Josh Allen",                   // name
      "p": "QB",                           // position
      "t": "BUF",                          // team
      "a": 30,                             // age
      "rookie": false,
      "ranks": { "bb": 3, "sp": 1.3, "pv": 1 },
      "avg": 1.8,                          // mean of ranks
      "lo": 1,                             // min source rank
      "hi": 3,                             // max source rank
      "ns": 3,                             // # sources
      "tier": 1
    },
    ...
  ]
}
```

Commit and push — the live site updates immediately.

## Adding features

See `docs/DEVELOPMENT.md`. The view system is set up so you can drop a new module into `js/views/` and add an entry to `VIEWS` in `app.js`. Trade analyzer, roster review, and waiver targets are scaffolded as "coming soon" placeholders ready to be replaced.

## License

MIT — do whatever you want with it.
