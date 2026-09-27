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

- [ ] **1. Paste a messy task and see a routing card (role + brief + Yes/No)**
  Becomes usable: Open `index.html`, paste free text, click Route, and see one card with a role from {ops, marketing, research, code}, a one-line brief, and Yes/No controls. Empty submit blocked.
  Why now: The Unique Kernel is the whole product — scaffold and the card land together so the demo path exists on slice one.
  PRD ref: `prd.md > The Core Journey`, `prd.md > Features and Behavior > Paste a messy task`, `Routing card`, `Approve / reject`
  Spec ref: `spec.md > Components > UI Shell`, `Router`, `Routing Card`, `spec.md > File Structure`, `spec.md > Data Model`
  Build: Add `index.html` + `app.js` (+ minimal CSS), UI shell (title, textarea, Route), `route(taskText)` heuristics for four roles with fixed tie-break, card render with Yes/No wiring (accept / reject+retry), empty-submit inline message. MIT LICENSE.
  Verify (mechanical): Node smoke script loads `app.js` router (or evaluates heuristics), asserts four sample tasks map to plausible roles, empty string rejected; static check that `index.html` references `app.js` and contains card/role/brief/yes/no markup hooks.
  Learner check: Open the page, paste a messy ops-ish sentence, click Route, confirm role + brief + Yes/No appear; try Yes then No on a second route.
  Commit: `Add FlockBoard routing card (paste → role + brief + yes/no)`

- [ ] **2. Copy brief works; four-role samples verified**
  Becomes usable: Copy puts the brief on the clipboard (or shows a plain manual-copy fallback); a short sample list documents one messy task per role landing on that role.
  Why now: Completes PRD Copy brief + the spec's "useful unknown" keyword tune without adding features.
  PRD ref: `prd.md > Features and Behavior > Copy brief`
  Spec ref: `spec.md > Important Failure Modes` (clipboard), `spec.md > Decisions and Open Issues` (keyword tune)
  Build: Wire Copy control + clipboard fallback; tune keyword lists against 4–8 samples; optional `SAMPLES.md` or comment block listing input → role.
  Verify (mechanical): Re-run smoke script covering all four roles + empty + copy-helper presence; confirm LICENSE is MIT text.
  Learner check: Route a task, click Copy, paste elsewhere (or see fallback); skim samples for all four roles.
  Commit: `Add copy brief, tune role heuristics, document samples`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — shared with final review (tiny two-slice PoC; executor smoke under decide-and-proceed)
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [pending]
Route and stops: [pending]
Edit outcome: [pending]
Reflection: [pending]
Activity mode: [pending]

## Revisions

