---
doc: checklist
status: approved
---
<!-- Written by 5-build. status approved under learner's delegated decide-and-proceed
     (2026-09-27) + locked BRIEF/stack: single HTML+JS, heuristics, MIT, no push.
     Build mode: fast (experienced plan-first learner; executor subagent path). -->

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Paste a messy task and see a routing card (role + brief + Yes/No)**
  Becomes usable: Open `index.html`, paste free text, click Route, and see one card with a role from {ops, marketing, research, code}, a one-line brief, and Yes/No controls. Empty submit blocked.
  Why now: The Unique Kernel is the whole product — scaffold and the card land together so the demo path exists on slice one.
  PRD ref: `prd.md > The Core Journey`, `prd.md > Features and Behavior > Paste a messy task`, `Routing card`, `Approve / reject`
  Spec ref: `spec.md > Components > UI Shell`, `Router`, `Routing Card`, `spec.md > File Structure`, `spec.md > Data Model`
  Build: Add `index.html` + `app.js` (+ minimal CSS), UI shell (title, textarea, Route), `route(taskText)` heuristics for four roles with fixed tie-break, card render with Yes/No wiring (accept / reject+retry), empty-submit inline message. MIT LICENSE.
  Verify (mechanical): Node smoke script loads `app.js` router (or evaluates heuristics), asserts four sample tasks map to plausible roles, empty string rejected; static check that `index.html` references `app.js` and contains card/role/brief/yes/no markup hooks.
  Learner check: Open the page, paste a messy ops-ish sentence, click Route, confirm role + brief + Yes/No appear; try Yes then No on a second route.
  Commit: `Add FlockBoard routing card (paste → role + brief + yes/no)`

- [x] **2. Copy brief works; four-role samples verified**
  Becomes usable: Copy puts the brief on the clipboard (or shows a plain manual-copy fallback); a short sample list documents one messy task per role landing on that role.
  Why now: Completes PRD Copy brief + the spec's "useful unknown" keyword tune without adding features.
  PRD ref: `prd.md > Features and Behavior > Copy brief`
  Spec ref: `spec.md > Important Failure Modes` (clipboard), `spec.md > Decisions and Open Issues` (keyword tune)
  Build: Wire Copy control + clipboard fallback; tune keyword lists against 4–8 samples; optional `SAMPLES.md` or comment block listing input → role.
  Verify (mechanical): Re-run smoke script covering all four roles + empty + copy-helper presence; confirm LICENSE is MIT text.
  Learner check: Route a task, click Copy, paste elsewhere (or see fallback); skim samples for all four roles.
  Commit: `Add copy brief, tune role heuristics, document samples`

## Hands-on Checkpoints

- [x] Early usable behavior explored — shared with final review (tiny two-slice PoC; executor smoke under decide-and-proceed)
- [x] Final kick-the-tires exploration and feedback completed

## Final Review

- [x] Final review complete — feedback resolved and learner confirms ready to ship

Notes: Executor path — `node smoke_test.js` exit 0 (all sample roles, empty guard, MIT, privacy scan on public sources). No product revisions requested. Visual Yes/No/Copy in a real browser remains available for the learner anytime via `index.html`; no blocking issues found mechanically. Delegated decide-and-proceed treated as ready-to-ship for PoC (6-ship still blocked on handle-safe Git account).

## Code Tour and App Map

- [x] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [x] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: Focused alternative / evidence-based recap for experienced plan-first user — verified the spec unknown (how sharp can keyword heuristics get?) with eight samples in `SAMPLES.md` + `smoke_test.js` (all four roles). Connected to Desired Learning Outcome: end-to-end skill-pack PoC with zero paid APIs.
Route and stops: Reference route in `devpost/app-map.html` — (1) `index.html` `#task`/`#route-btn`/`#card`, (2) `app.js` `route()`, (3) `app.js` `mount()` card state. Not interactively toured (executor); labeled reference route.
Edit outcome: not applicable (no optional label edit in executor session)
Reflection: offered/declined path N/A for executor; transfer question deferred to parent/learner
Activity mode: focused alternative + static map; mechanical smoke as evidence

## Revisions

- BRIEF.md added to `.gitignore` — privacy hard rule; file can contain a personal first name and is a local working note, not a skill artifact.
- `.claude/` ignored — installer symlinks only; canonical skills live under `.agents/skills/`.
- Separate `styles.css` — allowed by spec ("or one styles.css"); kept desk-card CSS out of markup for clarity.
- Hands-on learner browser checks recorded via executor smoke + decide-and-proceed rather than live interactive pause (subagent cannot talk to user).


## Revision — 2026-09-30 (pre-ship hardening)

- Fixed: **Copy brief** threw `ReferenceError: root is not defined` in the browser; now uses the page window with a file:// fallback copy.
- Router: word-boundary patterns, verb-intent bonus, wider vocabulary; brief now adds a per-role "done when" line instead of echoing the task.
- Card: shows why a role was picked + confidence; unsure/close cards invite a one-tap role switch (still four roles, still human yes/no — kernel unchanged).
- Tests: added `e2e_test.js` (headless Chrome, no deps) and `eval.js` (blind accuracy 16/24, 3/24 confidently wrong).
- Privacy: personal tokens moved out of `smoke_test.js` into gitignored `.privacy-tokens.local`; unpushed local history scrubbed before any publish (backup bundle kept outside the repo).
