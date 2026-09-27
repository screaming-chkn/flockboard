---
doc: spec
status: approved
---
<!-- Written by 4-spec from approved prd.md + scope.md + locked BRIEF.md stack preference.
     Review format: markdown. Approval: BRIEF locked constraints + learner's delegated
     "decide-and-proceed" (2026-09-27) treated as explicit learner yes / "looks good"
     once content matches the locked FlockBoard kernel and stack preference.
     Changelog: 2026-09-27 PT — draft→approved in one pass; stack = single HTML+JS page
     + local heuristic/rules; MIT; no paid LLM; no GitHub push yet. -->

# FlockBoard (Desk Router) — Technical Spec

## How This Works, In Plain Language
One HTML file (with a little JavaScript inside or beside it) opens in a browser. You type
or paste a messy task and hit Route. A small local **rules engine** — keyword and phrase
checks, no cloud, no paid AI — picks one of four roles (ops, marketing, research, code)
and writes a one-line brief from the task text. The page shows a **routing card** with
that role, the brief, Yes, No, and Copy. Everything stays on your machine. We chose this
shape because it is the smallest thing that still proves the kernel on camera in under
90 seconds, with zero accounts and zero spend.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. Operator opens `index.html` in a browser (double-click or a tiny local static serve).
2. Page paints the empty input + Route button (`UI Shell`).
3. Operator pastes text → clicks Route → `Router` runs local heuristics on the text.
4. `Router` returns `{ role, brief }` → `Routing Card` renders role, brief, Yes/No/Copy.
5. Yes → card marked accepted (in-memory; optional localStorage of last card).
6. No → card cleared/rejected; textarea stays editable for another Route.
7. Copy → `navigator.clipboard.writeText(brief)` with a plain fallback message if blocked.

```
┌────────────┐    paste     ┌────────────┐   {role,brief}   ┌──────────────┐
│  UI Shell  │─────────────→│   Router   │─────────────────→│ Routing Card │
│ (index.html)│   Route click│ (rules JS) │                  │ Yes/No/Copy  │
└────────────┘              └────────────┘                  └──────────────┘
```

## Stack
| Choice | Detail | Rationale / tradeoff |
|--------|--------|----------------------|
| Language | HTML5 + vanilla JavaScript (ES2019+), no build step | Learner-locked preference for smallest local demo; tradeoff = no framework ergonomics, gain = open-and-run |
| UI | Single page, plain CSS in the same file (or one `styles.css`) | Desk-card look without a design system |
| Role pick | Local heuristic / keyword-and-phrase rules in JS | **No paid LLM**, no API keys, works offline; tradeoff = less "smart" than an LLM, still proves the kernel with human yes/no as safety valve |
| Brief | Template string from role + trimmed task snippet | Deterministic, demo-stable |
| Persistence | None required; optional `localStorage` for last card only | Matches `prd.md > States and Boundaries` |
| License | MIT | BRIEF default |
| Package manager | None | No `node_modules`, no install step for the demo |

Docs (major deps — none beyond the platform):
- HTML / JS: https://developer.mozilla.org/en-US/docs/Web
- Clipboard API: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
- localStorage (optional): https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

Unverified until build: exact keyword lists per role will be tuned against a handful of
sample messy tasks during `5-build`; flag early if a sample clearly mis-routes.

## Where It Runs and How Someone Tries It
- **Runtime:** any modern desktop browser (Chrome, Firefox, Safari, Edge). No server
  required. No API keys. No Node/Python runtime required for the happy path.
- **Start (preferred):** open `index.html` directly, **or** from the project root:
  `python3 -m http.server 8000` then visit `http://localhost:8000/`.
- **Demo recording:** show empty page → paste one messy sentence → card appears → Yes →
  Copy brief. Target wall-clock under 90 seconds.
- **Deployment:** optional, not required for submission (video + public GitHub repo are
  the requirements). Do **not** push to GitHub until Sentry confirms a handle-safe
  account. When push is allowed, MIT LICENSE + handle-only README.

## Look and Feel
Carried from `prd.md > Look and Feel` / `scope.md > Inspiration & Identity`:
- Desk-card, calm, single-purpose; system font stack; high-contrast text; one accent
  color for Route / accepted.
- Copy tone: plain and decisive ("Role: ops", "Brief: …").
- No purple-gradient "AI app" chrome; no fleet or employer branding.
- CSS must live with the single-page stack (inline or one file) — no UI framework.

## Components

### UI Shell
Renders the page chrome: title, task textarea, Route button, card region, lightweight
empty-state hint. Owns layout only.
PRD ref: `prd.md > Screens and Layout`, `prd.md > Features and Behavior > Paste a messy task`.

### Router (local heuristics)
Pure function: `route(taskText) → { role, brief, matchedSignals? }`.
- Normalizes text (lowercase, trim).
- Scores four role buckets via keyword/phrase lists (ops, marketing, research, code).
- Picks the highest score; ties break with a documented fixed order (e.g. ops → code →
  research → marketing) so demos are stable.
- Builds a one-line brief: role-specific verb + shortened task (truncate safely).
- Never calls the network. Never invents a fifth role.
PRD ref: `prd.md > Features and Behavior > Routing card`, `prd.md > What We're Building`.

### Routing Card
Displays role label, brief text, Yes, No, Copy. Reflects accepted / rejected / idle.
PRD ref: `prd.md > Features and Behavior > Routing card`, `Approve / reject`, `Copy brief`.

### Optional Last-Card Store
If enabled, writes `{ task, role, brief, decision, at }` to `localStorage` under a
namespaced key (e.g. `flockboard:last`). Not required for the demo path.
PRD ref: `prd.md > States and Boundaries` (persistence).

## Data Model
In-memory (and optional localStorage) shape:

```
TaskInput: string

RoutingResult: {
  role: "ops" | "marketing" | "research" | "code",
  brief: string,          // one line
  signals?: string[]      // optional debug; hide in demo UI
}

CardState: {
  status: "idle" | "ready" | "accepted" | "rejected",
  result: RoutingResult | null,
  task: string
}
```

- **Lives:** JS memory while the tab is open.
- **Updates:** on Route / Yes / No / Copy UI events.
- **Return visit:** blank unless optional last-card store is on.

## File Structure
```
flockboard/
├── index.html          # UI Shell + card markup + inline or linked CSS/JS entry
├── app.js              # Router heuristics + card state + clipboard helpers
├── styles.css          # optional; may be inlined in index.html instead
├── LICENSE             # MIT (add at ship / first public commit)
├── README.md           # handle-only stub (exists); expand at ship
├── .gitignore          # learner-profile + .env rules (exists)
├── BRIEF.md            # locked answers (local working note; not a skill artifact)
├── devpost/
│   ├── learner-profile.md   # gitignored personal learning context
│   ├── scope.md             # approved
│   ├── prd.md               # approved
│   └── spec.md              # this file
└── .agents/skills/          # Devpost Learn skill pack (course material)
```

No `package.json`, no bundler, no `src/` tree — intentional for PoC size.

## External Services and Dependencies
**None on the critical path.** No APIs, no databases, no hosting required to demo.
Optional later: free static host (e.g. GitHub Pages) only after handle-safe account is
confirmed — out of scope for this spec's build.

## Important Failure Modes
- **Empty submit** → inline message; no card. (PRD empty-submit criterion.)
- **Clipboard blocked** → show the brief selected/highlighted and a plain "copy manually"
  note instead of failing silently.
- **Ambiguous / weak keyword match** → still pick one of four via tie-break; Yes/No lets
  the human correct. Do not add an "unknown" role in MVP.

## What Was Simplified and Why
- **Single HTML+JS page** instead of a Node/React/Vite app — proves the kernel with zero
  install; fuller SPA would add setup without changing the card.
- **Keyword/phrase heuristics** instead of a paid or local LLM — zero spend, offline,
  demo-stable; fuller NLP would need models/keys and risk contest constraints.
- **No persistence by default** instead of a history DB — history is Later; optional
  localStorage is enough if we want a return-visit flourish.
- **No deploy** instead of live hosting — submission needs video + public repo; local
  open + screen record is enough.
- **Four fixed roles** instead of configurable taxonomy — locked POC boundary.

## Decisions and Open Issues

### Decisions
- **Stack = single HTML+JS + local rules** — learner-locked in BRIEF; accepted tradeoff:
  less "AI magic," more reliable zero-spend demo. (Learner choice.)
- **MIT license** — BRIEF default. (Learner choice.)
- **No GitHub push in this phase** — wait for Sentry on handle-safe account.
  (Learner / crew constraint.)
- **Markdown review only** — no `scope.html` / `prd.html` / `spec.html` companions.
  (Learner preference in profile.)
- **Tie-break order and keyword lists** — implementation detail derived from the four
  locked roles; tune in `5-build` against sample tasks. (Derived, not a new product ask.)

### One useful unknown (learner)
How sharp can a tiny keyword heuristic get without an LLM? Agreed check in `5-build`:
try 5–8 sample messy tasks covering all four roles; adjust word lists until each sample
lands on an obviously plausible role. Evidence: a short comment block or `SAMPLES.md`
(optional) listing input → role. Not a new feature — verification of the Router.

### Open
- None blocking `5-build`.
- Public Git host + handle-safe account (Sentry) — blocks push/ship, not local build.
- Pitch / demo script (Hook) — after working PoC.
