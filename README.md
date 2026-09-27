# FlockBoard (Desk Router)

Paste a messy task → get a **role** + **one-line brief** + **yes/no** card.

Four roles only: `ops`, `marketing`, `research`, `code`.  
Local keyword heuristics — no cloud, no paid APIs, no accounts.

Public files are handle-only. No real names, employers, or personal identifiers.

## Try it locally

```bash
# Option A — open the file in a browser
open index.html   # macOS; or double-click / xdg-open on Linux

# Option B — tiny static server
python3 -m http.server 8000
# then visit http://localhost:8000/
```

Demo beat (~90s): paste one messy sentence → Route → Yes → Copy brief.

## Smoke test

```bash
node smoke_test.js
```

## License

MIT — see `LICENSE`.
