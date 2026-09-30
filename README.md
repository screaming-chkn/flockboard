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

## How routing works

- Word-boundary keyword patterns per role; phrases weigh more than single words.
- The leading verb gets a small bonus, so "write a tweet about the crash" routes to marketing.
- Each card shows **why** (matched words) and a confidence level.
- When there is no clear signal or it's a close call, the card says so, and four role chips let the human switch roles in one tap. The brief regenerates for the new role.
- The brief is one line: verb + task + a per-role "done when" line.

## Tests

```bash
node smoke_test.js   # router + privacy checks (Node)
node e2e_test.js     # real headless Chrome: route, yes, no, copy, role switch (Node 22+, Chrome)
node eval.js         # accuracy report: tuned cases vs blind cases never tuned on
```

Current `eval.js` result: 40/40 on tuned cases, **16/24 (67%) on blind cases**. 5 of the 8 blind misses are flagged "not sure" on the card, so 3/24 are confidently wrong.

## License

MIT — see `LICENSE`.
