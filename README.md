# SentryNet — DDoS Monitor UI

Static UI only (no backend included). Runs on mock data out of the box.

## Files
- `index.html` — main dashboard (chart, stats, live connections table)
- `profile.html`, `settings.html` — secondary pages
- `style.css` — shared theme
- `app.js` — all logic + mock data generator

## Connect to your PyTorch model
1. Wrap your model in a small API (Flask/FastAPI) that returns JSON per poll:
   ```json
   { "score": 0.12, "attackTick": false, "connections": 512,
     "packetsPerSec": 4200,
     "rows": [{"ip":"1.2.3.4","port":443,"duration":"1.20s","packets":320,"router":"edge-r1","cls":"safe"}] }
   ```
2. In `settings.html` (in the running app) or `app.js` CONFIG, set `apiUrl` to that endpoint.
3. In `app.js` → `fetchData()`, uncomment the real `fetch(CONFIG.apiUrl)` block and remove the mock return.

## Deploy via GitHub
1. Push these files to a repo (e.g. GitHub Pages, or any static host).
2. If your API is on a different domain, enable CORS on it.
3. That's it — no build step, plain HTML/CSS/JS.
