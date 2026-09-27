---
doc: prd
status: approved
---
<!-- Written by 3-prd from approved scope.md + locked BRIEF.md. Review format: markdown.
     Approval: BRIEF locked constraints + learner's delegated "decide-and-proceed" (2026-09-27) treated
     as explicit learner yes / "looks good" once content matches the locked FlockBoard
     kernel. Changelog: 2026-09-27 PT — draft→approved in one pass; no product inventions
     beyond BRIEF / scope. No code/stack talk (belongs in 4-spec). -->

# FlockBoard (Desk Router) — Product Requirements

A tiny local routing card for a solo operator / one-person company: paste a messy task,
get a specialist role, a one-line brief, and a human yes/no.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`, `scope.md > The Core Loop`.

## The Core Journey
1. Open FlockBoard (single local page).
2. See one clear input for a messy task and a primary action to route it. Empty state
   invites a paste — no login, no setup.
3. Paste or type one messy free-text task (a sentence or short paragraph).
4. Trigger route → a **routing card** appears with:
   - **Role** — one of: ops, marketing, research, code
   - **One-line brief** — a short instruction for that role
   - **Yes / No** — human approve or reject
5. Approve → brief becomes the accepted decision; optional **Copy brief**.
6. Reject → card clears or marks rejected; operator can edit the task and route again.
7. Success = a clear, filmable card in under a few seconds, demoable in <90s.
   Source: `scope.md > What "Working" Looks Like`, `scope.md > The Core Loop`.

## Screens and Layout
**One surface only** — a single local page (not a multi-screen app).
- Top / center: task input (textarea or equivalent) + Route action.
- Below / beside: routing card region (role, brief, yes/no, copy).
- No navigation chrome, no settings screen, no history list in the PoC.
Source: `scope.md > The POC Boundary`.

## Look and Feel
- **Style:** desk-card, not dashboard — calm, fast, single-purpose.
- **Tone of copy:** plain and decisive ("Role: ops — Brief: …"), not chatty or corporate.
- **Typography / color:** readable default system fonts; high-contrast text; one accent
  for the primary action and the approved state. Avoid generic "AI purple gradient" chrome.
- **Density:** spacious enough to read the card at a glance; no dense admin tables.
- **Identity:** one-person-company / day-job framing only. No fleet branding, no employer
  or person identifiers in UI strings.
Source: `scope.md > Inspiration & Identity`.

## Features and Behavior

### Paste a messy task
Operator enters free-text (messy sentence or short note). Empty submit is blocked with a
plain inline message.
- As a solo operator, I want to paste a messy task so that I can get a routing decision
  without organizing it first.
  - [ ] Task input accepts multi-line free text
  - [ ] Submitting empty input shows a clear inline message and does not invent a card
  - [ ] Submitting non-empty text produces a routing card without leaving the page

### Routing card (role + brief + yes/no)
The product kernel. After route, show exactly one card with role, one-line brief, and
yes/no controls.
- As a solo operator, I want a role + brief + yes/no card so that I know who owns the
  task and can accept or reject that decision.
  - [ ] Card shows exactly one role from {ops, marketing, research, code}
  - [ ] Card shows a one-line brief derived from the pasted task
  - [ ] Card shows Yes and No actions
  - [ ] Role pick uses local heuristic/rules only (no paid LLM, no cloud call on the path)
  Source: `scope.md > The Unique Kernel`, `scope.md > The POC Boundary`.

### Approve / reject
Yes accepts the card; No rejects it so the operator can revise and retry.
- As a solo operator, I want to approve or reject the card so that I stay in control.
  - [ ] Yes marks the card accepted (visible success state)
  - [ ] No clears or marks rejected and leaves the task editable for another route
  - [ ] Neither action requires an account or network

### Copy brief
After (or while) viewing the card, copy the one-line brief to the clipboard.
- As a solo operator, I want to copy the brief so that I can paste it into whatever tool
  I use next.
  - [ ] A Copy control puts the brief text on the clipboard
  - [ ] UI gives brief confirmation that copy succeeded (or a plain fallback if clipboard
        is unavailable)

## States and Boundaries
- **First use / empty** — input ready; card region empty or lightly prompted ("Paste a
  messy task to get a routing card"). No sample account, no onboarding wizard.
- **Normal use** — task entered → card visible with role, brief, yes/no.
- **Empty submit** — inline message; no fake card.
- **Ambiguous task** — still returns exactly one of the four roles via local rules (best
  effort); human yes/no remains the safety valve. No "unknown role" fifth option in MVP.
- **Accepted** — card shows accepted; brief still copyable.
- **Rejected** — card cleared or marked rejected; task remains for edit + re-route.
- **Persistence** — none required. Optional localStorage of last card is allowed but not
  a demo dependency. Closing the tab may wipe in-memory state.
- **Permissions** — single local operator; no multi-user, no auth.
Source: `scope.md > The POC Boundary`, `scope.md > Explicitly Cut`.

## Product Decisions
- **Name:** FlockBoard (Desk Router) — locked in BRIEF / scope.
- **Four roles only:** ops, marketing, research, code — locked; no custom roles in PoC.
- **Kernel = routing card** — role + one-line brief + yes/no is the whole product.
- **Local / zero paid APIs** — role pick via heuristic or rules (or free local model if
  later chosen); no cloud spend on the critical path.
- **Single surface** — prefer simple local web page.
- **Human stays in the loop** — yes/no is required UI, not optional chrome.
- **Privacy** — handle-only in public artifacts; day-job / one-person-company framing.
- **No pitch copy in product docs** — Hook owns pitch/demo script later.
- **Approval of this PRD:** BRIEF locked constraints + learner's delegated decide-and-proceed count as
  learner "looks good" for content matching the locked kernel.

## What We're Building
- Single local page with task input + Route action
- Local role picker limited to ops / marketing / research / code
- One-line brief generation from the pasted task (local rules/heuristic)
- Routing card UI: role, brief, Yes, No, Copy brief
- Empty-submit and accepted/rejected states sufficient for a <90s demo
- MIT license default for the eventual public repo (when push is allowed)

## Deferred From the POC
- **History of past cards** — nice for return use; not needed to prove the kernel on camera.
- **Multi-user / auth / accounts** — out of POC boundary; single operator.
- **Real agent handoff** — routing card is the product; fleet integration is later.
- **Custom / extra roles** — would dilute the four-role demo.
- **Mobile-native app** — local web page is enough to film.
- **Cloud LLM** — paid/spend risk; kernel works with rules.

## Possible Later Enhancements
Optional last-card localStorage; richer brief templates per role; keyboard shortcuts;
export of accepted briefs as a plain text list; optional free local model behind a flag.

## Non-Goals
- Paid LLM APIs or any required cloud spend — zero-spend / contest constraint.
- Accounts, passwords, sessions — single local operator.
- Persistence beyond optional localStorage — not needed to prove the card.
- Fleet branding or employer/person identifiers — privacy hard rule.
- Pitch video script inside this repo's planning docs — Hook owns.
- Task management / kanban / calendar — different product; would bury the kernel.
- Fifth "unknown" role or open-ended role taxonomy in MVP.

## Open Questions
- None that block `4-spec`. Stack preference already locked in BRIEF: smallest local
  demo (prefer single HTML+JS page; heuristic/rules; MIT; no GitHub push until Sentry
  confirms handle-safe account).
