## Densetsu Wiki / Reader – Quick Setup

This repository is static HTML/CSS/JS plus a small Node “save server.” Use these steps on a new machine.

### 1) Prerequisites
- **Node.js (LTS)** with npm (bundled). Install via OS instructions in `SETUP_NODE.md`.
- **Git** (or copy the tree as-is).
- A modern browser (Chrome/Edge/Firefox).

### 2) Get the code
- Clone/copy the repo, preserving the `pages/`, `scripts/`, `docbase/`, and `assets/` structure.
- Keep media paths intact under `pages/retraissance/assets/media` and `pages/retraissance/reader/media`.

### 3) Start the save/dev server
From the repo root:
```
node scripts/dev-save-server.js
```
- Serves pages at `http://localhost:3000`.
- Saves are posted to `http://localhost:3000/__save`.
- On startup you’ll be prompted: “Activate CyberSpaceGod mode?” (default No). This optional mode logs handler names/line numbers when routes are hit.

### 4) Open the site
- Main index: `http://localhost:3000/pages/retraissance/index.html`
- Universe/engine hubs live under `/pages/retraissance/densetsu/...`.
- Reader mode (Bible view): `http://localhost:3000/pages/retraissance/reader/index.html`

### 5) Editing notes
- Use the served URLs (not `file://`) to avoid CORS/path issues.
- Reader mode page list comes from `pages/retraissance/reader/pages-list.json`. Reorder/rename via the UI; it persists through the save server.
- Inline edit buttons and reordering controls only show when editor mode is enabled from the toolbar.
- “Save” in reader mode writes back the current page’s panel content via the save server. Outside reader mode, use normal edit flows.

### 6) Common paths
- **Styles/JS:** `pages/retraissance/assets/site.css`, `pages/retraissance/assets/site.js`
- **Reader:** `pages/retraissance/reader/index.html`, `pages/retraissance/reader/pages-list.json`
- **Media:** `pages/retraissance/assets/media/...`, `pages/retraissance/reader/media/...`
- **Dev server:** `scripts/dev-save-server.js`

### 7) Troubleshooting
- If media 404s, check relative prefixes start with `/pages/retraissance/...`.
- If random/save/edit buttons do nothing, confirm you’re on `http://localhost:3000/...` and the server is running.
- If port 3000 is busy, stop the other service or adjust the script (edit `dev-save-server.js` port).

